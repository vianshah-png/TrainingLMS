"use client";

import {
    BookOpen,
    ExternalLink,
    CheckCircle,
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
    ArrowUpRight,
    MessageSquare,
    MessageCircle,
    BrainCircuit
} from "lucide-react";
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { syllabusData, Module } from "@/data/syllabus";
import { motion, Variants } from "framer-motion";
import { useState, useEffect } from "react";
import TopicCard from "@/components/TopicCard";
import { supabase } from "@/lib/supabase";
import AIAssessment from "@/components/AIAssessment";
import AcademySimulator from "@/components/AcademySimulator";
import { AnimatePresence } from "framer-motion";
import { logActivity } from "@/lib/activity";
import { canAccessModule, getAccessibleModuleIds } from "@/lib/moduleAccess";

function getDocEmbedUrl(url: string | null): string {
    if (!url) return '';
    if (url.includes('docs.google.com/presentation')) {
        const idMatch = url.match(/\/d\/([^\/]+)/);
        if (idMatch) {
            return `https://docs.google.com/presentation/d/${idMatch[1]}/embed?start=false&loop=false&delayms=3000`;
        }
        return url.replace(/\/(edit|preview|present).*$/, '/embed');
    }
    if (url.includes('docs.google.com') || url.includes('drive.google.com')) {
        // Handle Folders specifically
        if (url.includes('/drive/folders/') || url.includes('/drive/u/0/folders/')) {
            const folderIdMatch = url.match(/\/folders\/([^\/?#]+)/);
            if (folderIdMatch) {
                return `https://drive.google.com/embeddedfolderview?id=${folderIdMatch[1]}#grid`;
            }
        }
        return url.replace(/\/(edit|view|present|view\?usp=sharing).*$/, '/preview');
    }
    return url;
}

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
    const [showGymPopup, setShowGymPopup] = useState(false);
    const [loadingContent, setLoadingContent] = useState(true);
    const [selectedDocument, setSelectedDocument] = useState<{ url: string, label: string } | null>(null);
    const [hasModuleAccess, setHasModuleAccess] = useState(true);
    const [userAccessibleIds, setUserAccessibleIds] = useState<string[]>([]);

    const [isAdmin, setIsAdmin] = useState(false);
    // Admin Edit Mode States
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedTopics, setEditedTopics] = useState<Record<string, Partial<any>>>({});
    const [isSavingEdits, setIsSavingEdits] = useState(false);
    const [dragItem, setDragItem] = useState<number | null>(null);
    const [dragOverItem, setDragOverItem] = useState<number | null>(null);

    // Counsellor context for WhatsApp 
    const [assignedCounsellors, setAssignedCounsellors] = useState<any[]>([]);
    const [overallProgress, setOverallProgress] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    
    const [healthTab, setHealthTab] = useState<'doctors' | 'pharma'>('doctors');

    // Scroll to top on every module change, or to specific topic if hash present
    useEffect(() => {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#topic-')) {
            // Wait for content to render, then scroll to the topic
            const timer = setTimeout(() => {
                const el = document.getElementById(hash.substring(1));
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Brief highlight effect
                    el.style.outline = '3px solid #00B6C1';
                    el.style.outlineOffset = '8px';
                    el.style.borderRadius = '24px';
                    setTimeout(() => { el.style.outline = 'none'; }, 3000);
                } else {
                    window.scrollTo(0, 0);
                }
            }, 600);
            return () => clearTimeout(timer);
        } else {
            window.scrollTo(0, 0);
        }
    }, [moduleId]);

    const handleTopicEdit = (topicCode: string, updatedFields: Partial<any>) => {
        setEditedTopics(prev => ({
            ...prev,
            [topicCode]: { ...prev[topicCode], ...updatedFields }
        }));

        // Update local state immediately for fast UI response
        setModuleTopics(prev => prev.map(t => t.code === topicCode ? { ...t, ...updatedFields } : t));
    };

    // Drag-and-drop reorder handler (admin edit mode)
    const handleDragEnd = async () => {
        if (dragItem === null || dragOverItem === null || dragItem === dragOverItem) {
            setDragItem(null);
            setDragOverItem(null);
            return;
        }
        const reordered = [...moduleTopics];
        const dragged = reordered.splice(dragItem, 1)[0];
        reordered.splice(dragOverItem, 0, dragged);
        setModuleTopics(reordered);
        setDragItem(null);
        setDragOverItem(null);
        // Persist new sort_order to DB
        try {
            for (let i = 0; i < reordered.length; i++) {
                // We need to ensure we have a title for upsert if it's the first time
                const baseTitle = reordered[i].title || 'Untitled Segment';
                await supabase.from('syllabus_content').upsert({
                    module_id: moduleId,
                    topic_code: reordered[i].code,
                    title: baseTitle,
                    sort_order: i,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'topic_code' });
            }
        } catch (e) {
            console.error('Failed to save sort order:', e);
        }
    };

    const handleDeleteTopic = async (topicCode: string) => {
        if (!confirm("Are you sure you want to delete this segment? This will remove all custom content for this topic.")) return;

        try {
            const { error } = await supabase
                .from('syllabus_content')
                .delete()
                .eq('topic_code', topicCode);

            if (error) throw error;

            setModuleTopics(prev => prev.filter(t => t.code !== topicCode));
            alert("Segment deleted successfully.");
        } catch (e: any) {
            console.error(e);
            alert(`Deletion failed: ${e.message}`);
        }
    };

    const handleSaveEdits = async () => {
        setIsSavingEdits(true);
        const errors: string[] = [];
        try {
            for (const topicCode of Object.keys(editedTopics)) {
                const edits = editedTopics[topicCode];

                // Get the current local state of this topic (which includes any unsaved in-memory edits)
                const localTopic = moduleTopics.find(t => t.code === topicCode);

                // Fetch the existing row so we don't wipe other fields
                const { data: existing } = await supabase
                    .from('syllabus_content')
                    .select('*')
                    .eq('topic_code', topicCode)
                    .single();

                // Build a robust payload. Fallback order: 
                // 1. Current user edits 
                // 2. Existing DB row 
                // 3. Static/Base topic data
                const payload: any = {
                    module_id: moduleId,
                    topic_code: topicCode,
                    title: edits.title || existing?.title || localTopic?.title || 'Segment',
                    content: edits.content !== undefined ? edits.content : (existing?.content || localTopic?.content || ''),
                    links: edits.links || existing?.links || localTopic?.links || [],
                    outcome: edits.outcome !== undefined ? edits.outcome : (existing?.outcome || localTopic?.outcome || ''),
                    updated_at: new Date().toISOString()
                };

                const { error } = await supabase
                    .from('syllabus_content')
                    .upsert(payload, { onConflict: 'topic_code' });

                if (error) errors.push(`${topicCode}: ${error.message}`);
            }

            if (errors.length > 0) {
                alert(`Saved with some errors:\n${errors.join('\n')}`);
            } else {
                setIsEditMode(false);
                setEditedTopics({});
                alert('All changes saved successfully!');
            }
        } catch (e: any) {
            console.error(e);
            alert(`Save failed: ${e?.message || 'Unknown error'}`);
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
            const newSortOrder = moduleTopics.length;
            const contentBody = newSegmentType === 'video' ? 'Interactive Video Session' : 'Resource Document';
            const links = [{ url: newSegmentLink, label: newSegmentType === 'video' ? 'Watch Video' : 'Access Resource' }];

            const { error } = await supabase.from('syllabus_content').upsert({
                module_id: moduleId,
                title: newSegmentTitle,
                content: contentBody,
                links: links,
                topic_code: topicCode,
                sort_order: newSortOrder,
                updated_at: new Date().toISOString()
            });

            if (error) throw error;

            // Push to local state to avoid refresh
            setModuleTopics([...moduleTopics, {
                code: topicCode,
                title: newSegmentTitle,
                content: contentBody,
                links: links,
                isDynamic: true,
                hasLive: false,
                isAssignment: false,
                sort_order: newSortOrder
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (moduleId && baseModule) {
            logActivity('view_module', { moduleId, contentTitle: baseModule.title });
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
                        links: (d.links && d.links.length > 0) ? d.links : currentTopics[existingIndex].links,
                        layout: d.layout != null ? d.layout : currentTopics[existingIndex].layout,
                        outcome: d.outcome != null ? d.outcome : currentTopics[existingIndex].outcome,
                        sort_order: d.sort_order != null ? d.sort_order : (currentTopics[existingIndex].sort_order ?? existingIndex)
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
                        isAssignment: false,
                        layout: d.layout,
                        outcome: d.outcome,
                        sort_order: d.sort_order !== undefined ? d.sort_order : currentTopics.length
                    });
                }
            });

            // Final sort based on DB defined order
            currentTopics.sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));

            setModuleTopics(currentTopics);

            if (session) {
                setUserId(session.user.id);

                // Fetch profile for role-based access
                const { data: userProfile } = await supabase
                    .from('profiles')
                    .select('role, allowed_modules')
                    .eq('id', session.user.id)
                    .single();

                const role = userProfile?.role || 'counsellor';
                const allowedMods = userProfile?.allowed_modules || [];
                setIsAdmin(role === 'admin' || role === 'moderator');

                // Check module access
                const accessIds = getAccessibleModuleIds(role, allowedMods);
                setUserAccessibleIds(accessIds);
                if (!canAccessModule(moduleId, role, allowedMods)) {
                    setHasModuleAccess(false);
                    setLoadingContent(false);
                    return;
                }

                // 2. Fetch Progress (Module Specific & Overall for Context)
                const { data: modProgressData } = await supabase
                    .from('mentor_progress')
                    .select('topic_code')
                    .eq('user_id', session.user.id)
                    .eq('module_id', moduleId);

                if (modProgressData) {
                    setCompletedTopics(modProgressData.map(p => p.topic_code));
                }

                const { data: allProgress } = await supabase
                    .from('mentor_progress')
                    .select('topic_code')
                    .eq('user_id', session.user.id);
                // We'll just do a rough total topics calculation
                const TOTAL_SYMS = 40; // Approx 
                setOverallProgress(Math.min(100, Math.round(((allProgress?.length || 0) / TOTAL_SYMS) * 100)));

                // Fetch Buddy info
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('training_buddy')
                    .eq('id', session.user.id)
                    .single();

                if (profile?.training_buddy) {
                    try {
                        const parsed = JSON.parse(profile.training_buddy);
                        const buddiesArray = Array.isArray(parsed) ? parsed : [parsed];
                        setAssignedCounsellors(buddiesArray);
                    } catch (e) {
                        // Fallback structure
                        setAssignedCounsellors([{ full_name: profile.training_buddy, phone: "" }]);
                    }
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
                const topic = moduleTopics.find(t => t.code === topicCode);
                logActivity('complete_segment', {
                    topicCode,
                    moduleId,
                    contentTitle: topic?.title || topicCode
                });
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

    const visibleSyllabus = syllabusData.filter(m => m.id !== 'resource-bank' && (userAccessibleIds.length === 0 || userAccessibleIds.includes(m.id)));
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

    if (!hasModuleAccess) {
        return (
            <main className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-24 h-24 bg-[#FAFCEE] rounded-[2rem] flex items-center justify-center text-[#0E5858]/30 mb-8 border-2 border-[#0E5858]/10">
                    <BookOpen size={48} />
                </div>
                <h1 className="text-4xl font-serif text-[#0E5858] mb-4">Access Restricted</h1>
                <p className="text-gray-400 mb-3 max-w-md leading-relaxed">Your current role does not include access to <strong className="text-[#0E5858]">{baseModule.title}</strong>.</p>
                <p className="text-[10px] font-bold text-[#00B6C1] uppercase tracking-widest mb-8">Contact your admin to request module access</p>
                <Link href="/" className="px-8 py-4 bg-[#0E5858] text-white rounded-2xl font-bold shadow-xl hover:bg-[#00B6C1] transition-all flex items-center gap-2">
                    <ArrowRight size={16} className="rotate-180" /> Return to Dashboard
                </Link>
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
                                        <span>Time Limit: 15 Minutes to complete all questions.</span>
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

                            <AcademySimulator
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
                                }}
                                onClose={() => {
                                    setShowModuleAssessment(false);
                                    handleContinue();
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
                            className="w-full max-w-2xl bg-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden"
                        >
                            <button
                                onClick={() => setShowHealthPopup(false)}
                                className="absolute top-8 right-8 text-[#0E5858]/40 hover:text-[#0E5858]"
                            >
                                <X size={24} />
                            </button>

                            <div className="mb-8 text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF5733]/10 text-[#FF5733] rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                                    <Activity size={12} />
                                    BN Health Ecosystem
                                </div>
                                <h2 className="text-3xl font-serif text-[#0E5858] mb-2">Health & Diagnostics</h2>
                                <p className="text-gray-500 font-medium italic text-sm">"Integrated support for optimized client results."</p>
                            </div>

                            {/* Tab Selector */}
                            <div className="flex gap-2 mb-8 bg-[#FAFCEE] rounded-2xl p-1.5">
                                <button
                                    onClick={() => setHealthTab('doctors')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${healthTab === 'doctors' ? 'bg-[#0E5858] text-white shadow-lg' : 'text-[#0E5858]/60 hover:text-[#0E5858]'}`}
                                >
                                    <Stethoscope size={16} />
                                    Doctors
                                </button>
                                <button
                                    onClick={() => setHealthTab('pharma')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${healthTab === 'pharma' ? 'bg-[#0E5858] text-white shadow-lg' : 'text-[#0E5858]/60 hover:text-[#0E5858]'}`}
                                >
                                    <FlaskConical size={16} />
                                    Pharma Partnerships
                                </button>
                            </div>

                                        {healthTab === 'doctors' ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <button
                                                    onClick={() => {
                                                        setShowHealthPopup(false);
                                                        setSelectedDocument({ url: '/Doctor_X_BN_Life.pdf', label: 'Nutritional Integration' });
                                                    }}
                                                    className="p-7 group bg-[#FAFCEE] rounded-3xl border-2 border-transparent hover:border-[#00B6C1]/20 flex flex-col gap-3 text-center items-center transition-all shadow-sm hover:shadow-xl cursor-pointer"
                                                >
                                                    <div className="w-14 h-14 rounded-2xl bg-[#00B6C1]/10 text-[#00B6C1] flex items-center justify-center group-hover:bg-[#00B6C1] group-hover:text-white transition-all">
                                                        <Stethoscope size={26} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-serif text-[#0E5858] mb-1">Nutritional Integration</h4>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Doctor Referral Protocol</p>
                                                    </div>
                                                    <ArrowUpRight size={16} className="text-[#00B6C1] mt-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setShowHealthPopup(false);
                                                        setSelectedDocument({ url: '/BN_Smart_Clinic_Pitch.pdf', label: 'BN Smart Clinic' });
                                                    }}
                                                    className="p-7 group bg-[#FAFCEE] rounded-3xl border-2 border-transparent hover:border-[#00B6C1]/20 flex flex-col gap-3 text-center items-center transition-all shadow-sm hover:shadow-xl cursor-pointer"
                                                >
                                                    <div className="w-14 h-14 rounded-2xl bg-[#FFCC00]/10 text-[#FFCC00] flex items-center justify-center group-hover:bg-[#FFCC00] group-hover:text-[#0E5858] transition-all">
                                                        <FlaskConical size={26} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-serif text-[#0E5858] mb-1">Smart Clinic</h4>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Diagnostics & Smart Tools</p>
                                                    </div>
                                                    <ArrowUpRight size={16} className="text-[#00B6C1] mt-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setShowHealthPopup(false);
                                                        setSelectedDocument({ url: '/HCP_Doc.pdf', label: 'HCP Document' });
                                                    }}
                                                    className="p-7 group bg-[#FAFCEE] rounded-3xl border-2 border-transparent hover:border-[#00B6C1]/20 flex flex-col gap-3 text-center items-center transition-all shadow-sm hover:shadow-xl cursor-pointer sm:col-span-2"
                                                >
                                                    <div className="w-14 h-14 rounded-2xl bg-[#0E5858]/10 text-[#0E5858] flex items-center justify-center group-hover:bg-[#0E5858] group-hover:text-white transition-all">
                                                        <FileText size={26} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-serif text-[#0E5858] mb-1">HCP Document</h4>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Healthcare Professionals Profile</p>
                                                    </div>
                                                    <ArrowUpRight size={16} className="text-[#00B6C1] mt-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <button
                                                    onClick={() => {
                                                        setShowHealthPopup(false);
                                                        setSelectedDocument({ url: '/Pharma_Pitch_Deck.pdf', label: 'Pharma Partnerships' });
                                                    }}
                                                    className="p-7 group bg-[#FAFCEE] rounded-3xl border-2 border-transparent hover:border-[#00B6C1]/20 flex flex-col gap-3 text-center items-center transition-all shadow-sm hover:shadow-xl cursor-pointer"
                                                >
                                                    <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                                                        <FlaskConical size={26} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-serif text-[#0E5858] mb-1">Pharma Partnerships</h4>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Pharmaceutical Alliances</p>
                                                    </div>
                                                    <ArrowUpRight size={16} className="text-[#00B6C1] mt-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setShowHealthPopup(false);
                                                        setSelectedDocument({ url: '/BN_Chemist_Deck.pdf', label: 'Chemist Partnerships' });
                                                    }}
                                                    className="p-7 group bg-[#FAFCEE] rounded-3xl border-2 border-transparent hover:border-[#00B6C1]/20 flex flex-col gap-3 text-center items-center transition-all shadow-sm hover:shadow-xl cursor-pointer"
                                                >
                                                    <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all">
                                                        <ShoppingBag size={26} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-serif text-[#0E5858] mb-1">Chemist Partnerships</h4>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Retail Pharmacy Network</p>
                                                    </div>
                                                    <ArrowUpRight size={16} className="text-[#00B6C1] mt-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                </button>
                                            </div>
                                        )}

                                        <p className="mt-8 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center">Select a document to view protocols</p>
                        </motion.div>
                    </motion.div>
                )}

                {showGymPopup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-[#0E5858]/95 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="w-full max-w-2xl bg-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden"
                        >
                            <button
                                onClick={() => setShowGymPopup(false)}
                                className="absolute top-8 right-8 text-[#0E5858]/40 hover:text-[#0E5858]"
                            >
                                <X size={24} />
                            </button>

                            <div className="mb-8 text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#27AE60]/10 text-[#27AE60] rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                                    <Dumbbell size={12} />
                                    Gym & B2B Partnerships
                                </div>
                                <h2 className="text-3xl font-serif text-[#0E5858] mb-2">Partnership Ecosystem</h2>
                                <p className="text-gray-500 font-medium italic text-sm">"Expanding Balance Nutrition into the fitness industry."</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <button
                                    onClick={() => {
                                        setShowGymPopup(false);
                                        setSelectedDocument({ url: '/docs/BNXFitnessFirst_Context.pdf', label: 'Gym Partnership Context' });
                                    }}
                                    className="p-7 group bg-[#FAFCEE] rounded-3xl border-2 border-transparent hover:border-[#00B6C1]/20 flex flex-col gap-3 text-center items-center transition-all shadow-sm hover:shadow-xl cursor-pointer"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        <Building2 size={26} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-serif text-[#0E5858] mb-1">Gym Partnership Context</h4>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Case Study & Integration</p>
                                    </div>
                                    <ArrowUpRight size={16} className="text-[#00B6C1] mt-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </button>

                                <button
                                    onClick={() => {
                                        setShowGymPopup(false);
                                        setSelectedDocument({ url: '/docs/gym-brochure.pdf', label: 'Gym Brochure' });
                                    }}
                                    className="p-7 group bg-[#FAFCEE] rounded-3xl border-2 border-transparent hover:border-[#00B6C1]/20 flex flex-col gap-3 text-center items-center transition-all shadow-sm hover:shadow-xl cursor-pointer"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-all">
                                        <Dumbbell size={26} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-serif text-[#0E5858] mb-1">Gym Brochure</h4>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Product Catalog for Gyms</p>
                                    </div>
                                    <ArrowUpRight size={16} className="text-[#00B6C1] mt-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </button>

                                <button
                                    onClick={() => {
                                        setShowGymPopup(false);
                                        setSelectedDocument({ url: '/Gym_Partnerships.pdf', label: 'Gym Partnerships' });
                                    }}
                                    className="p-7 group bg-[#FAFCEE] rounded-3xl border-2 border-transparent hover:border-[#00B6C1]/20 flex flex-col gap-3 text-center items-center transition-all shadow-sm hover:shadow-xl cursor-pointer sm:col-span-2"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                                        <Globe size={26} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-serif text-[#0E5858] mb-1">Gym & B2B Partnerships</h4>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Commercial & Business Tie-ups</p>
                                    </div>
                                    <ArrowUpRight size={16} className="text-[#00B6C1] mt-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </button>
                            </div>

                            <p className="mt-8 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center">Select a document to view protocols</p>
                        </motion.div>
                    </motion.div>
                )}

                {/* Standard Document Overlay */}
                {selectedDocument && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-12 bg-[#0E5858]/95 backdrop-blur-xl"
                    >
                        <div className="w-full max-w-5xl">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-3xl font-serif text-white mb-1">{selectedDocument.label}</h3>
                                    <p className="text-[#00B6C1] text-xs font-bold uppercase tracking-widest">Document Viewer</p>
                                </div>
                                <button
                                    onClick={() => setSelectedDocument(null)}
                                    className="w-14 h-14 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all border border-white/10"
                                >
                                    <X size={28} />
                                </button>
                            </div>

                            {(() => {
                                const isEmbeddable = selectedDocument.url.includes('docs.google.com') ||
                                    selectedDocument.url.includes('drive.google.com') ||
                                    selectedDocument.url.includes('zoom.us') ||
                                    selectedDocument.url.toLowerCase().endsWith('.mp4') ||
                                    selectedDocument.url.toLowerCase().endsWith('.pdf');

                                if (!isEmbeddable) {
                                    return (
                                        <div className="w-full h-[400px] rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
                                            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-white">
                                                <ExternalLink size={36} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-white/70 text-sm font-medium mb-1">This resource opens in a new browser tab</p>
                                                <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold">External website</p>
                                            </div>
                                            <a
                                                href={selectedDocument.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => setSelectedDocument(null)}
                                                className="px-10 py-4 bg-[#00B6C1] hover:bg-white text-white hover:text-[#0E5858] rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl"
                                            >
                                                Open Resource →
                                            </a>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="w-full h-[75vh] rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-black">
                                        <iframe
                                            src={getDocEmbedUrl(selectedDocument.url)}
                                            className="w-full h-full"
                                            allow="autoplay"
                                        />
                                    </div>
                                );
                            })()}
                        </div>
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
                        onClick={() => {
                            if (nextModule) router.push(`/modules/${nextModule.id}`);
                        }}
                        className={`h-12 px-6 rounded-2xl font-bold shadow-lg flex items-center gap-2 transition-all ${nextModule ? 'bg-white text-[#0E5858] hover:bg-green-50 border border-green-100' : 'bg-gray-50 text-gray-300 opacity-50 cursor-not-allowed border-gray-100'}`}
                        title="Next Module"
                        disabled={!nextModule}
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

                <div className="lg:col-span-12">
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
                        className="text-2xl text-gray-500 leading-relaxed max-w-5xl italic font-light"
                    >
                        “{baseModule.subtitle || baseModule.description}”
                    </motion.p>
                </div>
            </header>


            <div className="space-y-6">
                <h3 className="text-2xl font-serif text-[#0E5858] mb-6 flex items-center gap-4">
                    The Syllabus Breakdown
                    <div className="h-px flex-1 bg-gradient-to-r from-gray-100 to-transparent"></div>
                </h3>

                {moduleTopics.length > 0 ? (
                    moduleTopics.map((topic, index) => (
                        <div
                            key={topic.code}
                            draggable={isEditMode}
                            onDragStart={() => setDragItem(index)}
                            onDragEnter={() => setDragOverItem(index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            className={`relative transition-all duration-200 ${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''
                                } ${dragOverItem === index && dragItem !== index
                                    ? 'ring-2 ring-[#00B6C1] ring-offset-2 rounded-[2.5rem] scale-[1.01]'
                                    : ''
                                }`}
                        >
                            {isEditMode && (
                                <>
                                    <div className="absolute -left-10 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-1 opacity-40 hover:opacity-100 transition-opacity cursor-grab">
                                        <div className="w-1.5 h-1.5 bg-[#0E5858] rounded-full"></div>
                                        <div className="w-1.5 h-1.5 bg-[#0E5858] rounded-full"></div>
                                        <div className="w-1.5 h-1.5 bg-[#0E5858] rounded-full"></div>
                                        <div className="w-1.5 h-1.5 bg-[#0E5858] rounded-full"></div>
                                        <div className="w-1.5 h-1.5 bg-[#0E5858] rounded-full"></div>
                                        <div className="w-1.5 h-1.5 bg-[#0E5858] rounded-full"></div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteTopic(topic.code); }}
                                        className="absolute -right-8 top-10 w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm z-20"
                                        title="Delete Segment"
                                    >
                                        <X size={16} />
                                    </button>
                                </>
                            )}
                            <TopicCard
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
                        </div>
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

            {
                moduleId === 'module-1' && (
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
                                { title: "Corporate Wellness", url: "/docs/corporate-wellness-brochure.pdf", desc: "Enterprise Health Partnerships", icon: Building2, color: "#8E44AD" },
                                { title: "Gym & B2B Partnerships", url: "#", desc: "Commercial & Business Tie-ups", icon: Dumbbell, color: "#27AE60", isGymPopup: true }
                            ].map((link, i) => (
                                <motion.div
                                    key={i} 
                                    onClick={(e) => {
                                        if (link.isPopup) { 
                                            setShowHealthPopup(true); 
                                        } else if (link.isGymPopup) {
                                            setShowGymPopup(true);
                                        } else if (link.url.includes('drive.google.com') || link.url.includes('docs.google.com') || link.url.endsWith('.pdf')) {
                                            setSelectedDocument({ url: link.url, label: link.title });
                                        } else {
                                            window.open(link.url, '_blank');
                                        }
                                        logActivity('click_link', { contentTitle: 'Ecosystem Hub: ' + link.title });
                                    }}
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    className="premium-card p-8 group relative overflow-hidden flex flex-col items-center text-center hover:border-[#00B6C1]/30 transition-all border border-transparent bg-white shadow-xl cursor-pointer"
                                >
                                    <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-xl transition-all group-hover:rotate-12" style={{ backgroundColor: `${link.color}15`, color: link.color }}>
                                        <link.icon size={28} />
                                    </div>
                                    <h4 className="text-xl font-serif font-bold text-[#0E5858] mb-2">{link.title}</h4>
                                    <p className="text-xs text-gray-400 leading-relaxed px-4 font-medium">{link.desc}</p>
                                    <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#00B6C1] opacity-0 group-hover:opacity-100 transition-all">
                                        { (link.url.includes('drive.google.com') || link.url.includes('docs.google.com') || link.url.endsWith('.pdf')) ? 'View Dashboard' : 'Launch Platform' } <ArrowRight size={14} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )
            }

            {
                moduleId === 'module-4' && (
                    <section className="mt-24 mb-10">
                        <div className="flex items-center gap-6 mb-12">
                            <div className="w-1.5 h-10 bg-purple-500 rounded-full"></div>
                            <div>
                                <h3 className="text-3xl font-serif text-[#0E5858]">Practical Implementation</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Simulated Practice & AI Viva</p>
                            </div>
                        </div>

                        <div className="premium-card p-12 bg-gradient-to-br from-[#0E5858] to-[#00B6C1] rounded-[3.5rem] relative overflow-hidden group shadow-3xl">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
                            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                                <div className="max-w-xl">
                                    <h4 className="text-3xl font-serif text-white mb-4">Protocol Viva Simulation</h4>
                                    <p className="text-white/70 text-lg leading-relaxed mb-8">
                                        Practice your consultation pitch, objection handling, and client engagement with our AI client. This simulation is available at all times for you to refine your skills.
                                    </p>
                                    <div className="flex flex-wrap gap-4">
                                        <button
                                            onClick={() => setShowSimulation(true)}
                                            className="px-10 py-5 bg-white text-[#0E5858] rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#FAFCEE] transition-all hover:-translate-y-1 shadow-2xl flex items-center gap-3"
                                        >
                                            <MessageCircle size={18} className="text-[#00B6C1]" />
                                            Start Practice Session
                                        </button>
                                        <div className="px-6 py-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center gap-3">
                                            <Sparkles size={18} className="text-[#B8E218]" />
                                            <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">AI-Powered Feedback</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden lg:block w-64 h-64 bg-white/10 backdrop-blur-3xl rounded-[3rem] border border-white/20 flex items-center justify-center rotate-12 group-hover:rotate-6 transition-transform duration-1000">
                                    <BrainCircuit size={80} className="text-white opacity-40" />
                                </div>
                            </div>
                        </div>
                    </section>
                )
            }

            {
                moduleTopics.length > 0 && completedTopics.length === moduleTopics.length && (
                    <motion.section
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className={`mt-12 p-8 lg:p-12 rounded-[3.5rem] border-2 transition-all duration-1000 relative overflow-hidden group ${assessmentPassed
                            ? 'bg-[#FAFCEE] border-[#0E5858]/10'
                            : 'bg-[#0E5858] border-[#0E5858] shadow-3xl shadow-[#0E5858]/30'
                            }`}
                    >
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
                        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                            <div className="flex-1">
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 ${assessmentPassed ? 'bg-green-100 text-green-700' : 'bg-[#00B6C1]/20 text-[#00B6C1]'
                                    }`}>
                                    {assessmentPassed ? <CheckCircle2 size={12} /> : <Brain size={12} />}
                                    {assessmentPassed ? 'Mastery Achieved' : 'Pending Verification'}
                                </div>
                                <h2 className={`text-4xl lg:text-5xl font-serif mb-4 leading-tight ${assessmentPassed ? 'text-[#0E5858]' : 'text-white'}`}>
                                    {assessmentPassed ? "Module Achievement Unlocked" : "Pending Quiz"}
                                </h2>
                                <p className={`text-lg font-medium max-w-xl ${assessmentPassed ? 'text-gray-500' : 'text-white/60 text-base'}`}>
                                    {assessmentPassed
                                        ? "Great job! You've successfully covered all sections and verified your proficiency. You're now ready for the next level."
                                        : "Great job on completing the sections! Demonstrate your subject mastery by taking the final module quiz."
                                    }
                                </p>
                            </div>
                            <div className="shrink-0 relative z-10">
                                {!assessmentPassed ? (
                                    <button
                                        onClick={() => {
                                            if (moduleId === 'module-4' && !simulationDone) {
                                                setShowSimulation(true);
                                                return;
                                            }
                                            if (moduleId === 'module-2' && !completedTopics.includes('M2-05')) {
                                                alert("Please complete the Peer Review (M2-05) first.");
                                                return;
                                            }
                                            setShowVivaIntro(true);
                                        }}
                                        className="px-12 py-6 bg-[#00B6C1] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-white hover:text-[#0E5858] transition-all hover:-translate-y-2 group"
                                    >
                                        <span className="flex items-center gap-4">
                                            {moduleId === 'module-4' && !simulationDone ? "Start Simulation" : "Start Module Quiz"}
                                            <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
                                        </span>
                                    </button>
                                ) : (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white shadow-2xl relative mb-4">
                                            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
                                            <Award size={40} />
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (nextModule) router.push(`/modules/${nextModule.id}`);
                                                else router.push('/');
                                            }}
                                            className="px-12 py-6 bg-white text-[#0E5858] border border-[#0E5858]/10 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-[#0E5858] hover:text-white transition-all"
                                        >
                                            {nextModule ? "Next Module" : "Return to Hub"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.section>
                )
            }

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

            {/* Floating WhatsApp Action for Specific Module */}
            {assignedCounsellors.length > 0 && assignedCounsellors[0].phone && (
                <motion.a
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href={`https://wa.me/${assignedCounsellors[0].phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Hi ${assignedCounsellors[0].full_name?.split(' ')[0] || 'Trainer'}, I am currently working on ${baseModule.title} (Overall Progress: ${overallProgress}%). I have a query regarding: `
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-green-500 text-white px-5 py-4 rounded-full shadow-2xl hover:bg-green-600 transition-colors group"
                >
                    <MessageSquare size={24} className="group-hover:animate-pulse" />
                    <span className="text-sm font-bold truncate max-w-0 group-hover:max-w-[200px] transition-all duration-500 overflow-hidden whitespace-nowrap">
                        Ask {assignedCounsellors[0].full_name?.split(' ')[0] || 'Counsellor'}
                    </span>
                </motion.a>
            )}

        </motion.main >
    );
}
