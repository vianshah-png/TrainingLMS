"use client";

import {
    BookOpen,
    ExternalLink,
    CheckCircle,
    Clock,
    User,
    Sparkles,
    ChevronRight,
    ChevronLeft,
    Brain,
    ArrowRight,
    Building2,
    Dumbbell,
    Stethoscope,
    FlaskConical,
    School,
    FileText,
    ShoppingBag,
    Globe,
    Activity,
    Target,
    CheckCircle2,
    Award,
    X,
    ArrowUpRight
} from "lucide-react";
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { syllabusData, Module } from "@/data/syllabus";
import { motion, Variants } from "framer-motion";
import { useState, useEffect } from "react";
import TopicCard from "@/components/TopicCard";
import { supabase } from "@/lib/supabase";
import AIAssessment from "@/components/AIAssessment";
import ClinicalSimulator from "@/components/ClinicalSimulator";
import { AnimatePresence } from "framer-motion";
import { logActivity } from "@/lib/activity";

export default function ModulePage() {

    const params = useParams();
    const router = useRouter();
    const moduleId = params.id as string;

    const baseModule = (syllabusData as Module[]).find(m => m.id === moduleId);

    const [moduleTopics, setModuleTopics] = useState<any[]>(baseModule?.topics || []);
    const [completedTopics, setCompletedTopics] = useState<string[]>([]);
    const [userId, setUserId] = useState<string | undefined>();
    const [showModuleAssessment, setShowModuleAssessment] = useState(false);
    const [assessmentPassed, setAssessmentPassed] = useState(false);
    const [showVivaIntro, setShowVivaIntro] = useState(false);
    const [showSimulation, setShowSimulation] = useState(false);
    const [simulationDone, setSimulationDone] = useState(false);
    const [showHealthPopup, setShowHealthPopup] = useState(false);
    const [loadingContent, setLoadingContent] = useState(true);

    const [isAdmin, setIsAdmin] = useState(false);
    // Admin Edit Mode States
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedTopics, setEditedTopics] = useState<Record<string, Partial<any>>>({});
    const [isSavingEdits, setIsSavingEdits] = useState(false);

    const handleTopicEdit = (topicCode: string, updatedFields: Partial<any>) => {
        setEditedTopics(prev => ({
            ...prev,
            [topicCode]: { ...prev[topicCode], ...updatedFields }
        }));

        // Update local state immediately for fast UI response
        setModuleTopics(prev => prev.map(t => t.code === topicCode ? { ...t, ...updatedFields } : t));
    };

    const handleSaveEdits = async () => {
        setIsSavingEdits(true);
        try {
            const updates = Object.keys(editedTopics).map(topicCode => {
                const edits = editedTopics[topicCode];
                return {
                    module_id: moduleId,
                    topic_code: topicCode,
                    title: edits.title,
                    content: edits.content,
                    links: edits.links,
                    updated_at: new Date().toISOString()
                };
            });

            for (const update of updates) {
                const { error } = await supabase.from('syllabus_content').upsert(update, { onConflict: 'topic_code' });
                if (error) throw error;
            }

            setIsEditMode(false);
            setEditedTopics({});
            alert('Changes saved successfully!');
        } catch (e) {
            console.error(e);
            alert('Failed to save changes.');
        } finally {
            setIsSavingEdits(false);
        }
    };

    // Admin Inline Segment States
    const [isAddingSegment, setIsAddingSegment] = useState(false);
    const [newSegmentTitle, setNewSegmentTitle] = useState("");
    const [newSegmentType, setNewSegmentType] = useState("video");
    const [newSegmentLink, setNewSegmentLink] = useState("");
    const [isSavingSegment, setIsSavingSegment] = useState(false);

    const handleSaveSegment = async () => {
        if (!newSegmentTitle || !newSegmentLink) return;
        setIsSavingSegment(true);
        try {
            const topicCode = `DYN-${Date.now()}`;
            const { error } = await supabase.from('syllabus_content').upsert({
                module_id: moduleId,
                title: newSegmentTitle,
                content_type: newSegmentType,
                content: newSegmentLink,
                topic_code: topicCode,
                updated_at: new Date().toISOString()
            });

            if (error) throw error;

            // Push to local state to avoid refresh
            setModuleTopics([...moduleTopics, {
                code: topicCode,
                title: newSegmentTitle,
                content: newSegmentType === 'video' ? 'Interactive Video Session' : 'Resource Document',
                links: [{ url: newSegmentLink, label: 'Access Resource' }],
                isDynamic: true,
                hasLive: false,
                isAssignment: false
            }]);

            setIsAddingSegment(false);
            setNewSegmentTitle("");
            setNewSegmentLink("");
        } catch (e) {
            alert('Failed to save segment.');
        } finally {
            setIsSavingSegment(false);
        }
    };

    // Concatenate module content for AI test generation
    const moduleContentSummary = moduleTopics.map(t => `${t.title}: ${t.content}`).join("\n\n") || "";

    useEffect(() => {
        if (moduleId && baseModule) {
            logActivity('view_topic', { moduleId, contentTitle: baseModule.title });
        }
    }, [moduleId, baseModule]);

    useEffect(() => {
        const fetchContentAndProgress = async () => {
            setLoadingContent(true);
            const { data: { session } } = await supabase.auth.getSession();

            // 1. Fetch Dynamic Content & Overrides (Content Architect additions / Inline Edits)
            const { data: dynData } = await supabase
                .from('syllabus_content')
                .select('*')
                .eq('module_id', moduleId);

            const fetchedContent = dynData || [];

            // Merge static topics with database overrides
            let currentTopics = [...(baseModule?.topics || [])];

            fetchedContent.forEach(d => {
                const existingIndex = currentTopics.findIndex(t => t.code === d.topic_code);

                if (existingIndex >= 0) {
                    // Override existing static topic
                    currentTopics[existingIndex] = {
                        ...currentTopics[existingIndex],
                        title: d.title || currentTopics[existingIndex].title,
                        content: d.content || currentTopics[existingIndex].content,
                        links: d.links || currentTopics[existingIndex].links
                    };
                } else {
                    // Append new dynamic segment
                    currentTopics.push({
                        title: d.title,
                        code: d.topic_code || `DYN-${d.id}`,
                        content: d.content,
                        links: d.links ? d.links : (d.content ? [{ url: d.content, label: 'Access Resource' }] : []),
                        isDynamic: true,
                        hasLive: false,
                        isAssignment: false
                    });
                }
            });

            setModuleTopics(currentTopics);

            if (session) {
                setUserId(session.user.id);
                // Check if user is admin
                setIsAdmin(session.user.user_metadata?.role === 'admin');

                // 2. Fetch Progress
                const { data } = await supabase
                    .from('mentor_progress')
                    .select('topic_code')
                    .eq('user_id', session.user.id)
                    .eq('module_id', moduleId);

                if (data) {
                    setCompletedTopics(data.map(p => p.topic_code));
                }

                // 3. Check Assessment
                const { data: assessmentData } = await supabase
                    .from('assessment_logs')
                    .select('id')
                    .eq('user_id', session.user.id)
                    .eq('topic_code', `MODULE_${moduleId}`);

                if (assessmentData && assessmentData.length > 0) {
                    setAssessmentPassed(true);
                }

                // 4. Check Simulation
                const { data: simData } = await supabase
                    .from('simulation_logs')
                    .select('id')
                    .eq('user_id', session.user.id)
                    .eq('topic_code', `SIM_${moduleId}`);

                if (simData && simData.length > 0) {
                    setSimulationDone(true);
                }
            }
            setLoadingContent(false);
        };
        fetchContentAndProgress();
    }, [moduleId, baseModule]);

    const toggleTopic = async (topicCode: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const isCompleted = completedTopics.includes(topicCode);

        if (isCompleted) {
            const { error } = await supabase
                .from('mentor_progress')
                .delete()
                .eq('user_id', session.user.id)
                .eq('topic_code', topicCode);

            if (!error) {
                setCompletedTopics(completedTopics.filter(t => t !== topicCode));
            } else {
                console.error("Failed to unmark topic:", error.message);
            }
        } else {
            // First check if it already exists to avoid conflict errors if the constraint is weird
            const { data: existing } = await supabase
                .from('mentor_progress')
                .select('id')
                .eq('user_id', session.user.id)
                .eq('topic_code', topicCode)
                .single();

            if (existing) {
                setCompletedTopics([...completedTopics, topicCode]);
                return;
            }

            const { error } = await supabase
                .from('mentor_progress')
                .insert([{
                    user_id: session.user.id,
                    topic_code: topicCode,
                    module_id: moduleId
                }]);

            if (!error) {
                setCompletedTopics([...completedTopics, topicCode]);
                logActivity('complete_quiz', { topicCode, moduleId });
            } else {
                console.error("Failed to mark topic complete:", error.message);
                // Fallback: try upsert if insert failed (maybe it was created in the millisecond since check)
                await supabase.from('mentor_progress').upsert([{
                    user_id: session.user.id,
                    topic_code: topicCode,
                    module_id: moduleId
                }], { onConflict: 'user_id,topic_code' });

                // Still update local state if we reached here
                setCompletedTopics(prev => prev.includes(topicCode) ? prev : [...prev, topicCode]);
            }
        }
    };

    const visibleSyllabus = syllabusData.filter(m => m.id !== 'resource-bank');
    const currentModuleIndex = visibleSyllabus.findIndex(m => m.id === moduleId);
    const prevModule = visibleSyllabus[currentModuleIndex - 1];
    const nextModule = visibleSyllabus[currentModuleIndex + 1];

    const handlePrev = () => {
        if (prevModule) {
            router.push(`/modules/${prevModule.id}`);
        }
    };

    const handleContinue = (newlyCompleted?: string) => {
        const currentCompleted = newlyCompleted
            ? (completedTopics.includes(newlyCompleted) ? completedTopics : [...completedTopics, newlyCompleted])
            : completedTopics;

        const allTopicsDone = moduleTopics.every(t => currentCompleted.includes(t.code));

        if (allTopicsDone) {
            // Prerequisites
            if (moduleId === 'module-2' && !currentCompleted.includes('M2-05')) {
                alert("Please submit your Peer Review report before proceeding to the module quiz.");
                return;
            }

            if (moduleId === 'module-4' && !simulationDone) {
                setShowSimulation(true);
                return;
            }

            // Universal Module Quiz Check
            if (!assessmentPassed) {
                setShowVivaIntro(true); // This shows the quiz invitation
                return;
            }

            // Move to Next Module
            if (nextModule) {
                router.push(`/modules/${nextModule.id}`);
            } else {
                router.push('/');
            }
        } else {
            const incomplete = moduleTopics.filter(t => !currentCompleted.includes(t.code));
            console.log("Incomplete topics:", incomplete.map(t => t.code));
            alert(`You have ${incomplete.length} segment(s) remaining in this module. Please complete all sections before proceeding.`);
        }
    };

    if (!baseModule) {
        return (
            <main className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
                <Sparkles className="text-[#00B6C1] mb-6" size={64} />
                <h1 className="text-4xl font-serif text-[#0E5858] mb-4">Module Out of Reach</h1>
                <p className="text-gray-400 mb-8 max-w-xs">This curriculum path hasn't been mapped yet.</p>
                <Link href="/" className="px-8 py-3 bg-[#0E5858] text-white rounded-2xl font-bold shadow-xl">Return to Hub</Link>
            </main>
        );
    }

    if (loadingContent) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#FAFCEE]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#0E5858]/10 border-t-[#00B6C1] rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-[#0E5858]/30 uppercase tracking-[0.2em]">Assembling Masterclass...</p>
                </div>
            </div>
        );
    }

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const topicVariants: Variants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <motion.main
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="p-8 lg:p-12 xl:p-16 max-w-7xl mx-auto"
        >
            <AnimatePresence>
                {showVivaIntro && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#0E5858]/95 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="w-full max-w-xl bg-white rounded-[3rem] p-12 shadow-2xl relative overflow-hidden text-center"
                        >
                            <div className="w-20 h-20 bg-[#FAFCEE] text-[#00B6C1] rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl">
                                <Brain size={40} />
                            </div>

                            <h2 className="text-4xl font-serif text-[#0E5858] mb-4">{baseModule.title} Quiz</h2>
                            <p className="text-gray-500 font-medium mb-10 italic">"Verify your proficiency before proceeding to the next segment."</p>

                            <div className="bg-[#FAFCEE] rounded-3xl p-8 text-left mb-10 space-y-4 border border-[#00B6C1]/10">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00B6C1] mb-2">Quiz Rules & Protocols</h4>
                                <ul className="space-y-3">
                                    <li className="flex gap-3 text-xs font-bold text-[#0E5858]/70">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#00B6C1] mt-1.5"></div>
                                        <span>Time Limit: 10 Minutes to complete all questions.</span>
                                    </li>
                                    <li className="flex gap-3 text-xs font-bold text-[#0E5858]/70">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#00B6C1] mt-1.5"></div>
                                        <span>No Mid-Way Exit: Closing the window will void the attempt.</span>
                                    </li>
                                    <li className="flex gap-3 text-xs font-bold text-[#0E5858]/70">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#00B6C1] mt-1.5"></div>
                                        <span>Reporting: Scores are logged for training lead review.</span>
                                    </li>
                                </ul>
                            </div>

                            <button
                                onClick={() => {
                                    setShowVivaIntro(false);
                                    setShowModuleAssessment(true);
                                }}
                                className="w-full py-5 bg-[#0E5858] text-white rounded-[1.5rem] font-bold shadow-2xl hover:bg-[#00B6C1] transition-all flex items-center justify-center gap-3"
                            >
                                Start Module Quiz
                                <ChevronRight size={18} />
                            </button>

                            <button
                                onClick={() => setShowVivaIntro(false)}
                                className="mt-6 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#0E5858] transition-colors"
                            >
                                I need more preparation
                            </button>
                        </motion.div>
                    </motion.div>
                )}

                {showSimulation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-[#0E5858]/95 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="w-full max-w-2xl bg-white rounded-[3rem] p-12 shadow-2xl relative overflow-hidden"
                        >
                            <div className="mb-8">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00B6C1]/10 text-[#00B6C1] rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                                    <Activity size={12} />
                                    Practice Simulation
                                </div>
                                <h2 className="text-4xl font-serif text-[#0E5858] mb-2">Protocol Viva Simulation</h2>
                                <p className="text-gray-500 font-medium">Practice your consultation pitch with our AI client before the final module check.</p>
                            </div>

                            <ClinicalSimulator
                                topicTitle="Consultation Protocol Mastery"
                                topicContent="Deep dive into program pitching, client engagement, and medical history discovery."
                                topicCode={`SIM_${moduleId}`}
                            />

                            <div className="mt-10 pt-8 border-t border-gray-50 flex items-center justify-between">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Complete at least 3 turns to proceed</p>
                                <button
                                    onClick={() => {
                                        setSimulationDone(true);
                                        setShowSimulation(false);
                                        handleContinue();
                                    }}
                                    className="px-8 py-4 bg-[#0E5858] text-white rounded-2xl font-bold hover:bg-[#00B6C1] transition-all shadow-xl"
                                >
                                    I've Practiced Enough
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {showModuleAssessment && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0E5858]/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="w-full max-w-2xl bg-[#FAFCEE] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden"
                        >
                            <button
                                onClick={() => setShowModuleAssessment(false)}
                                className="absolute top-8 right-8 text-[#0E5858]/40 hover:text-[#0E5858]"
                            >
                                Skip for now
                            </button>

                            <div className="mb-8">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00B6C1]/10 text-[#00B6C1] rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                                    <Brain size={12} />
                                    Module Certification
                                </div>
                                <h2 className="text-4xl font-serif text-[#0E5858] mb-2">{baseModule.title} Check</h2>
                                <p className="text-gray-500 font-medium">Verify your knowledge before proceeding to the next segment.</p>
                            </div>

                            <AIAssessment
                                topicTitle={baseModule.title}
                                topicContent={moduleContentSummary}
                                topicCode={`MODULE_${moduleId}`}
                                onComplete={() => {
                                    setAssessmentPassed(true);
                                    setTimeout(() => {
                                        setShowModuleAssessment(false);
                                        if (nextModule) {
                                            router.push(`/modules/${nextModule.id}`);
                                        } else {
                                            router.push('/');
                                        }
                                    }, 2000);
                                }}
                            />
                        </motion.div>
                    </motion.div>
                )}
                {showHealthPopup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-[#0E5858]/95 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="w-full max-w-2xl bg-white rounded-[3rem] p-12 shadow-2xl relative overflow-hidden"
                        >
                            <button
                                onClick={() => setShowHealthPopup(false)}
                                className="absolute top-8 right-8 text-[#0E5858]/40 hover:text-[#0E5858]"
                            >
                                <X size={24} />
                            </button>

                            <div className="mb-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF5733]/10 text-[#FF5733] rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                                    <Activity size={12} />
                                    BN Health Ecosystem
                                </div>
                                <h2 className="text-4xl font-serif text-[#0E5858] mb-2">Health & Diagnostics</h2>
                                <p className="text-gray-500 font-medium italic">"Integrated support for optimized client results."</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <a
                                    href="https://drive.google.com/file/d/1smbdyHpELk0-07mpUxvkTIiXG3gV5Ftp/view?usp=drive_link"
                                    target="_blank"
                                    className="premium-card p-8 group border border-[#0E5858]/5 hover:border-[#00B6C1]/20 flex flex-col gap-4 text-center items-center"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                                        <FlaskConical size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-serif text-[#0E5858] mb-1">BN Diagnostics</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lab Integration & Reports</p>
                                    </div>
                                    <ArrowUpRight size={18} className="text-[#00B6C1] mt-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </a>

                                <a
                                    href="https://drive.google.com/drive/folders/1GN7nDd6QmuiO2rmMB1uiQUvYeqIZPuGK?usp=sharing"
                                    target="_blank"
                                    className="premium-card p-8 group border border-[#0E5858]/5 hover:border-[#00B6C1]/20 flex flex-col gap-4 text-center items-center"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all">
                                        <Stethoscope size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-serif text-[#0E5858] mb-1">BN Doctors</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Specialist Consultation Network</p>
                                    </div>
                                    <ArrowUpRight size={18} className="text-[#00B6C1] mt-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </a>
                            </div>

                            <p className="mt-10 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center">Click a service to view specialized protocols</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <nav className="flex items-center justify-between mb-16">
                <Link href="/" className="group flex items-center gap-4 text-[#0E5858] transition-all">
                    <div className="w-14 h-14 flex items-center justify-center group-hover:bg-[#0E5858] rounded-2xl transition-all duration-500">
                        <img src="/assets/BN_Logo-BlueBG-Square-HD.png" alt="BN" className="w-full h-full object-contain rounded-xl shadow-lg" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-[#00B6C1] uppercase tracking-[0.2em]">Resource Hub</span>
                        <span className="text-lg font-serif">Balance Nutrition</span>
                    </div>
                </Link>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="h-12 px-6 rounded-2xl font-bold shadow-lg flex items-center gap-2 transition-all bg-white text-[#0E5858] hover:bg-green-50 border border-green-100"
                        title="Go Back"
                    >
                        <ChevronLeft size={20} />
                        <span className="hidden md:inline">Back</span>
                    </button>

                    <button
                        onClick={() => router.forward()}
                        className="h-12 px-6 rounded-2xl font-bold shadow-lg flex items-center gap-2 transition-all bg-white text-[#0E5858] hover:bg-green-50 border border-green-100"
                        title="Go Forward"
                    >
                        <span className="hidden md:inline">Forward</span>
                        <ChevronRight size={20} />
                    </button>
                </div>
            </nav>

            <header className="mb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative">
                {isAdmin && (
                    <div className="absolute top-0 right-0 -mt-16 flex gap-4 z-50">
                        {isEditMode && (
                            <button
                                onClick={handleSaveEdits}
                                disabled={isSavingEdits}
                                className="px-6 py-2 bg-green-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl animate-pulse disabled:opacity-50"
                            >
                                {isSavingEdits ? 'Saving...' : 'Save All Changes'}
                            </button>
                        )}
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className="px-6 py-2 bg-white text-[#0E5858] border border-[#00B6C1]/30 rounded-xl font-bold uppercase tracking-widest text-xs shadow-sm hover:bg-[#FAFCEE] transition-colors"
                        >
                            {isEditMode ? 'Cancel Edit Mode' : 'Enter Edit Mode'}
                        </button>
                    </div>
                )}

                <div className="lg:col-span-8">
                    <motion.div variants={topicVariants} className="flex items-center gap-3 mb-6">
                        <span className="badge-teal">CURRICULUM v3.1</span>
                        <span className="text-[#0E5858]/20 font-light">•</span>
                        <span className="text-sm font-bold text-[#0E5858]/40 uppercase tracking-widest">{moduleTopics.length} Sections Found</span>
                    </motion.div>
                    <motion.h1
                        variants={topicVariants}
                        className="text-6xl lg:text-7xl font-serif text-[#0E5858] mb-8 leading-[0.95] tracking-tight"
                    >
                        {baseModule.title}
                    </motion.h1>
                    <motion.p
                        variants={topicVariants}
                        className="text-2xl text-gray-500 leading-relaxed max-w-3xl italic font-light"
                    >
                        “{baseModule.subtitle || baseModule.description}”
                    </motion.p>
                </div>

                <motion.div variants={topicVariants} className="lg:col-span-4 bg-[#0E5858] rounded-[3rem] p-10 text-white shadow-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-1000"></div>
                    <p className="text-[10px] font-bold text-[#00B6C1] uppercase tracking-[0.3em] mb-6">Learning Metrics</p>
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-2xl"><Clock size={20} /></div>
                                <span className="text-sm font-medium">Estimated Time</span>
                            </div>
                            <span className="text-lg font-serif">2.5 Hours</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-2xl"><Sparkles size={20} /></div>
                                <span className="text-sm font-medium">Difficulty level</span>
                            </div>
                            <span className="text-sm font-bold uppercase tracking-widest text-[#00B6C1]">Advanced</span>
                        </div>
                    </div>
                </motion.div>
            </header>

            <div className="space-y-6">
                <h3 className="text-2xl font-serif text-[#0E5858] mb-6 flex items-center gap-4">
                    The Syllabus Breakdown
                    <div className="h-px flex-1 bg-gradient-to-r from-gray-100 to-transparent"></div>
                </h3>

                {moduleTopics.length > 0 ? (
                    moduleTopics.map((topic, index) => (
                        <TopicCard
                            key={topic.code}
                            topic={topic}
                            index={index}
                            isCompleted={completedTopics.includes(topic.code)}
                            onToggleComplete={() => toggleTopic(topic.code)}
                            onMoveNext={(justDoneCode) => {
                                const nextTopic = moduleTopics[index + 1];
                                if (nextTopic) {
                                    document.getElementById(`topic-${nextTopic.code}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                } else {
                                    handleContinue(justDoneCode);
                                }
                            }}
                            isLastTopic={index === moduleTopics.length - 1}
                            userId={userId}
                            isEditMode={isEditMode}
                            onEdit={(updatedFields) => handleTopicEdit(topic.code, updatedFields)}
                        />
                    ))
                ) : (
                    <div className="premium-card p-20 text-center flex flex-col items-center">
                        <div className="w-24 h-24 bg-[#0E5858] rounded-[2.5rem] flex items-center justify-center text-[#00B6C1] mb-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                            <BookOpen size={40} className="relative z-10" />
                        </div>
                        <h2 className="text-4xl font-serif text-[#0E5858] mb-4">Curriculum Mapping</h2>
                        <p className="text-gray-400 max-w-sm mb-12 text-lg">Detailed educational paths and practice simulations are coming soon to this module.</p>
                        <button className="px-12 py-4 bg-[#0E5858] text-white rounded-[1.5rem] font-bold shadow-2xl hover:bg-black transition-all">Mark as Review Ready</button>
                    </div>
                )}

                {/* Inline Admin Uploader UI */}
                {isAdmin && (
                    <div className="mt-8 p-8 border-2 border-dashed border-[#00B6C1]/30 rounded-[2.5rem] bg-[#FAFCEE]/50">
                        {!isAddingSegment ? (
                            <button
                                onClick={() => setIsAddingSegment(true)}
                                className="w-full py-6 flex flex-col items-center justify-center text-[#0E5858] hover:text-[#00B6C1] transition-colors gap-3"
                            >
                                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
                                    <Sparkles size={20} />
                                </div>
                                <span className="font-bold uppercase tracking-widest text-xs">Add New Content Segment</span>
                            </button>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-serif text-xl text-[#0E5858]">New Segment Details</h4>
                                    <button onClick={() => setIsAddingSegment(false)} className="text-gray-400 hover:text-gray-600">
                                        <X size={20} />
                                    </button>
                                </div>

                                <input
                                    type="text"
                                    placeholder="Segment Title (e.g. Sales Objection Handling Part 2)"
                                    className="w-full p-4 rounded-xl border border-gray-200 focus:outline-[#00B6C1]"
                                    value={newSegmentTitle}
                                    onChange={e => setNewSegmentTitle(e.target.value)}
                                />

                                <div className="flex gap-4">
                                    <select
                                        className="p-4 rounded-xl border border-gray-200 bg-white focus:outline-[#00B6C1] min-w-[150px]"
                                        value={newSegmentType}
                                        onChange={e => setNewSegmentType(e.target.value)}
                                    >
                                        <option value="video">Video URL</option>
                                        <option value="document">Document/PDF</option>
                                        <option value="link">Web Link</option>
                                    </select>

                                    <input
                                        type="url"
                                        placeholder="Paste the URL here..."
                                        className="flex-1 p-4 rounded-xl border border-gray-200 focus:outline-[#00B6C1]"
                                        value={newSegmentLink}
                                        onChange={e => setNewSegmentLink(e.target.value)}
                                    />
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleSaveSegment}
                                        disabled={isSavingSegment || !newSegmentTitle || !newSegmentLink}
                                        className="px-8 py-3 bg-[#0E5858] text-white rounded-xl font-bold uppercase tracking-widest text-xs disabled:opacity-50 hover:bg-[#00B6C1] transition-colors"
                                    >
                                        {isSavingSegment ? 'Saving...' : 'Publish Segment'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {moduleTopics.length > 0 && completedTopics.length === moduleTopics.length && (
                <motion.section
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className={`mt-12 p-8 lg:p-12 rounded-[3.5rem] border-2 transition-all duration-1000 relative overflow-hidden group ${assessmentPassed || moduleId !== 'module-2'
                        ? 'bg-[#FAFCEE] border-[#0E5858]/10'
                        : 'bg-[#0E5858] border-[#0E5858] shadow-3xl shadow-[#0E5858]/30'
                        }`}
                >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                        <div className="flex-1">
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 ${assessmentPassed || moduleId !== 'module-2' ? 'bg-green-100 text-green-700' : 'bg-[#00B6C1]/20 text-[#00B6C1]'
                                }`}>
                                {assessmentPassed || moduleId !== 'module-2' ? <CheckCircle2 size={12} /> : <Brain size={12} />}
                                {moduleId === 'module-2' ? (assessmentPassed ? 'Audit Mastered' : 'Achievement Unlocked') : 'Section Completed'}
                            </div>
                            <h2 className={`text-4xl lg:text-5xl font-serif mb-4 leading-tight ${assessmentPassed || moduleId !== 'module-2' ? 'text-[#0E5858]' : 'text-white'}`}>
                                {moduleId === 'module-2'
                                    ? (assessmentPassed ? "Verification complete." : "Final Module Assessment")
                                    : "Module Achievement Unlocked"
                                }
                            </h2>
                            <p className={`text-lg font-medium max-w-xl ${assessmentPassed || moduleId !== 'module-2' ? 'text-gray-500' : 'text-white/60 text-base'}`}>
                                {moduleId === 'module-2'
                                    ? (assessmentPassed ? "Your understanding of this training block has been verified." : "Demonstrate your clinical mastery by taking the final module quiz.")
                                    : "Great job! You've successfully covered all sections of this module. You're now ready to move forward."
                                }
                            </p>
                        </div>
                        <div className="shrink-0 relative z-10">
                            {moduleId === 'module-2' ? (
                                assessmentPassed ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white shadow-2xl relative">
                                            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
                                            <Award size={40} />
                                        </div>
                                        {nextModule && <button onClick={() => router.push(`/modules/${nextModule.id}`)} className="text-xs font-black text-[#00B6C1] uppercase tracking-widest hover:underline">Next Module</button>}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            if (!completedTopics.includes('M2-05')) {
                                                alert("Please complete the Peer Review (M2-05) first.");
                                                return;
                                            }
                                            setShowVivaIntro(true);
                                        }}
                                        className="px-12 py-6 bg-[#00B6C1] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-white hover:text-[#0E5858] transition-all hover:-translate-y-2 group"
                                    >
                                        <span className="flex items-center gap-4">
                                            Initialize Audit
                                            <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
                                        </span>
                                    </button>
                                )
                            ) : (
                                <button
                                    onClick={() => {
                                        if (moduleId === 'module-4' && !simulationDone) setShowSimulation(true);
                                        else if (nextModule) router.push(`/modules/${nextModule.id}`);
                                        else router.push('/');
                                    }}
                                    className="px-12 py-6 bg-white text-[#0E5858] border border-[#0E5858]/10 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-[#0E5858] hover:text-white transition-all transform hover:scale-105"
                                >
                                    {moduleId === 'module-4' && !simulationDone ? "Start Simulation" : (nextModule ? "Next Module" : "Return to Hub")}
                                </button>
                            )}
                        </div>
                    </div>
                </motion.section>
            )}

            {moduleId === 'module-1' && (
                <section className="mt-24 mb-10">
                    <div className="flex items-center gap-6 mb-12">
                        <div className="w-1.5 h-10 bg-[#00B6C1] rounded-full"></div>
                        <div>
                            <h3 className="text-3xl font-serif text-[#0E5858]">BN Ecosystem Hub</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Cross-Platform Resource Deep Links</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { title: "BN Shop", url: "https://www.balancenutrition.in/shop", desc: "E-Commerce & Product Inventory", icon: ShoppingBag, color: "#FFCC00" },
                            { title: "Nutripreneur", url: "https://nutripreneur.balancenutrition.in/", desc: "Entrepreneurial Learning Platform", icon: Target, color: "#00B6C1" },
                            { title: "BN Franchise", url: "https://bnlifecentre.balancenutrition.in/#", desc: "Life Centre & Franchise Operations", icon: Globe, color: "#0E5858" },
                            { title: "BN Health", url: "#", desc: "Diagnostics & Doctors Network", icon: Activity, color: "#FF5733", isPopup: true },
                            { title: "Corporate Wellness", url: "https://drive.google.com/file/d/1YC6Yoz4NSgTsMr65hkc4fHtKApPI3xgM/view?usp=drive_link", desc: "Enterprise Health Partnerships", icon: Building2, color: "#8E44AD" },
                            { title: "Educational Institute", url: "https://drive.google.com/drive/folders/18NQXel0C-rHSOX9TdTo20liyE67jjz-5?usp=sharing", desc: "Student & Academic Health Programs", icon: School, color: "#27AE60" }
                        ].map((link, i) => (
                            <motion.a
                                key={i} href={link.url} target={link.isPopup ? undefined : "_blank"}
                                onClick={(e) => { if (link.isPopup) { e.preventDefault(); setShowHealthPopup(true); } }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className="premium-card p-8 group relative overflow-hidden flex flex-col items-center text-center hover:border-[#00B6C1]/30 transition-all border border-transparent bg-white shadow-xl"
                            >
                                <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-xl transition-all group-hover:rotate-12" style={{ backgroundColor: `${link.color}15`, color: link.color }}>
                                    <link.icon size={28} />
                                </div>
                                <h4 className="text-xl font-serif font-bold text-[#0E5858] mb-2">{link.title}</h4>
                                <p className="text-xs text-gray-400 leading-relaxed px-4 font-medium">{link.desc}</p>
                                <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#00B6C1] opacity-0 group-hover:opacity-100 transition-all">Launch Platform <ArrowRight size={14} /></div>
                            </motion.a>
                        ))}
                    </div>
                </section>
            )}

            <footer className="mt-32 pt-16 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <button
                    onClick={handlePrev}
                    disabled={!prevModule}
                    className={`px-8 py-4 rounded-[2rem] font-bold shadow-xl flex items-center gap-3 transition-all ${prevModule ? 'bg-white text-[#0E5858] hover:bg-gray-50 border border-gray-100 hover:shadow-2xl' : 'bg-gray-50 text-gray-300 cursor-not-allowed opacity-50'}`}
                >
                    <ChevronLeft size={20} /> Previous Module
                </button>
                <button
                    onClick={() => handleContinue()}
                    className={`px-10 py-5 rounded-[2rem] font-bold shadow-3xl flex items-center gap-4 transition-all duration-500 ${(moduleTopics.every(t => completedTopics.includes(t.code)) && assessmentPassed) ? 'bg-[#0E5858] text-white hover:bg-[#00B6C1] hover:shadow-[#00B6C1]/40 hover:translate-y-[-5px]' : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none'}`}
                >
                    {nextModule ? 'Next Module' : 'Return to Hub'} <ChevronRight size={20} />
                </button>
            </footer>
        </motion.main>
    );
}
