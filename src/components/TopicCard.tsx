"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle,
    Lock,
    Play,
    Sparkles,
    User,
    ExternalLink,
    BookOpen,
    Target,
    Share2,
    Activity,
    ListChecks,
    CheckCircle2,
    X,
    FileText,
    Maximize2,
    ArrowUpRight,
    ArrowRight,
    BrainCircuit,
    ShoppingBag,
    Globe,
    Building2,
    Dumbbell,
    Stethoscope,
    FlaskConical,
    School,
    HeartPulse,
    Calendar
} from "lucide-react";
import YouTubePlayer from "./YouTubePlayer";
import ClinicalSimulator from "./ClinicalSimulator";
import AIAssessment from "./AIAssessment";
import SummaryGrader from "./SummaryGrader";
import AssignmentForm from "./AssignmentForm";
import { Topic } from "@/data/syllabus";
import { logActivity } from "@/lib/activity";

interface TopicCardProps {
    topic: Topic;
    index: number;
    isCompleted: boolean;
    onToggleComplete: () => void;
    onMoveNext?: (justDoneCode?: string) => void;
    isLastTopic?: boolean;
    userId?: string;
    isEditMode?: boolean;
    onEdit?: (updatedFields: Partial<Topic>) => void;
}

function getEmbedUrl(url: string | undefined): string | null {
    if (!url) return null;

    // YouTube
    const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const ytMatch = url.match(ytRegExp);
    if (ytMatch && ytMatch[2].length === 11) {
        return `https://www.youtube.com/embed/${ytMatch[2]}`;
    }

    // Google Drive
    if (url.includes('drive.google.com')) {
        const driveMatch = url.match(/\/file\/d\/([^\/]+)/);
        if (driveMatch) {
            return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
        }
    }

    // Zoom
    if (url.includes('zoom.us')) {
        return url;
    }

    return null;
}

function getDocEmbedUrl(url: string): string {
    if (url.includes('docs.google.com/presentation')) {
        // Use /embed for better iframe rendering in slideshow mode
        const idMatch = url.match(/\/d\/([^\/]+)/);
        if (idMatch) {
            return `https://docs.google.com/presentation/d/${idMatch[1]}/embed?start=false&loop=false&delayms=3000`;
        }
        return url.replace(/\/(edit|preview|present).*$/, '/embed');
    }
    if (url.includes('docs.google.com')) {
        return url.replace(/\/(edit|view|present).*$/, '/preview');
    }
    return url;
}

export default function TopicCard({ topic, index, isCompleted, onToggleComplete, onMoveNext, isLastTopic, userId, isEditMode, onEdit }: TopicCardProps) {
    const [videoCompleted, setVideoCompleted] = useState(false);
    const [simulationCompleted, setSimulationCompleted] = useState(false);
    const [assignmentCompleted, setAssignmentCompleted] = useState(false);
    const [showHealthPopup, setShowHealthPopup] = useState(false);
    const [selectedCaseStudy, setSelectedCaseStudy] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Find main video/media link
    const mediaLink = topic.links?.find(l =>
        l.url.includes('youtube') ||
        l.url.includes('youtu.be') ||
        l.url.includes('drive.google.com') ||
        l.url.includes('zoom.us')
    );
    const embedUrl = getEmbedUrl(mediaLink?.url);

    // Links to display in the UI (hides the media link if it's playing as a video, unless in edit mode)
    const displayLinks = isEditMode
        ? topic.links
        : topic.links?.filter(link => !(embedUrl && link === mediaLink));

    // Persist progress to local storage
    useEffect(() => {
        const key = `bn-topic-progress-${userId || 'anon'}-${topic.code}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            const progress = JSON.parse(saved);
            setVideoCompleted(progress.video || false);
            setSimulationCompleted(progress.simulation || false);
            setAssignmentCompleted(progress.assignment || false);
        } else if (isCompleted) {
            setVideoCompleted(true);
            setSimulationCompleted(true);
            setAssignmentCompleted(true);
        }
    }, [topic.code, isCompleted, userId]);

    useEffect(() => {
        // Don't save if it's already fully completed via the global toggle to avoid redundancy
        if (isCompleted) return;

        const key = `bn-topic-progress-${userId || 'anon'}-${topic.code}`;
        localStorage.setItem(key, JSON.stringify({
            video: videoCompleted,
            simulation: simulationCompleted,
            assignment: assignmentCompleted
        }));
    }, [videoCompleted, simulationCompleted, assignmentCompleted, topic.code, isCompleted, userId]);

    const handleVideoComplete = () => {
        setVideoCompleted(true);
    };

    const isReadyToComplete =
        (topic.isAssignment ? assignmentCompleted : true) &&
        (topic.hasLive ? simulationCompleted : true);

    return (
        <div id={`topic-${topic.code}`} className={`premium-card p-6 lg:p-10 group cursor-default relative transition-all duration-500 ${isCompleted ? 'bg-[#FAFCEE]/80 border-[#0E5858]/10' : 'bg-white'}`}>
            {/* Case Study Overlay */}
            <AnimatePresence>
                {selectedCaseStudy && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-[#0E5858]/95 backdrop-blur-xl p-8 lg:p-16 flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-3xl font-serif text-white mb-1">Case Study Analysis</h3>
                                <p className="text-[#00B6C1] text-xs font-bold uppercase tracking-widest">Service Overview</p>
                            </div>
                            <button
                                onClick={() => setSelectedCaseStudy(null)}
                                className="w-14 h-14 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all border border-white/10"
                            >
                                <X size={28} />
                            </button>
                        </div>
                        <div className="flex-1 w-full rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-black">
                            <iframe
                                src={getDocEmbedUrl(selectedCaseStudy)}
                                className="w-full h-full"
                                allow="autoplay"
                            />
                        </div>
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

                            <div className="mb-10 text-left">
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
                                    className="p-8 group bg-[#FAFCEE] rounded-3xl border-2 border-transparent hover:border-[#00B6C1]/20 flex flex-col gap-4 text-center items-center transition-all shadow-sm hover:shadow-xl"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-[#00B6C1]/10 text-[#00B6C1] flex items-center justify-center group-hover:bg-[#00B6C1] group-hover:text-white transition-all">
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
                                    className="p-8 group bg-[#FAFCEE] rounded-3xl border-2 border-transparent hover:border-[#00B6C1]/20 flex flex-col gap-4 text-center items-center transition-all shadow-sm hover:shadow-xl"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-[#FFCC00]/10 text-[#FFCC00] flex items-center justify-center group-hover:bg-[#FFCC00] group-hover:text-[#0E5858] transition-all">
                                        <Stethoscope size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-serif text-[#0E5858] mb-1">BN Doctors</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Specialist Network</p>
                                    </div>
                                    <ArrowUpRight size={18} className="text-[#00B6C1] mt-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </a>
                            </div>

                            <p className="mt-10 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center">Click a service to view specialized protocols</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#FAFCEE] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

            <div className="flex flex-col lg:flex-row gap-10 relative z-10">
                {/* Topic Index & Sidebar Line */}
                <div className="flex lg:flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#0E5858] flex items-center justify-center text-white font-serif text-xl font-bold shadow-xl group-hover:bg-[#00B6C1] transition-all duration-500">
                        {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="hidden lg:block w-px h-full bg-gradient-to-b from-[#0E5858]/20 via-[#0E5858]/10 to-transparent"></div>
                </div>

                <div className="flex-1">
                    {/* Header: Title & Info */}
                    <div className="mb-10">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="text-[10px] font-bold text-[#00B6C1] uppercase tracking-[0.3em]">{topic.code}</span>
                            {topic.isAssignment && (
                                <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-purple-100">Assignment Module</span>
                            )}
                        </div>
                        {isEditMode ? (
                            <input
                                type="text"
                                className="w-full text-4xl lg:text-5xl font-serif text-[#0E5858] mb-6 tracking-tight leading-tight border-b-2 border-dashed border-[#0E5858]/30 bg-transparent focus:outline-none focus:border-[#00B6C1]"
                                value={topic.title}
                                onChange={(e) => onEdit?.({ title: e.target.value })}
                            />
                        ) : (
                            <h2 className="text-4xl lg:text-5xl font-serif text-[#0E5858] mb-6 tracking-tight leading-tight">{topic.title}</h2>
                        )}

                        <div className="max-w-4xl mb-8">
                            {isEditMode ? (
                                <textarea
                                    className="w-full text-gray-500 leading-relaxed text-base font-medium p-4 border-2 border-dashed border-[#0E5858]/30 rounded-xl focus:outline-none focus:border-[#00B6C1] min-h-[120px]"
                                    value={topic.content}
                                    onChange={(e) => onEdit?.({ content: e.target.value })}
                                />
                            ) : (
                                <div
                                    className="text-gray-500 leading-relaxed text-base font-medium"
                                    dangerouslySetInnerHTML={{ __html: topic.content }}
                                />
                            )}
                        </div>

                        <div className="flex flex-wrap items-start gap-8">
                            {isEditMode ? (
                                <div className="flex-1 min-w-[300px] flex items-start gap-4 p-5 bg-blue-50/30 rounded-3xl border border-blue-50/50">
                                    <div className="shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                                        <Sparkles size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-blue-700/60 uppercase tracking-widest mb-1.5">Configure Topic</p>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Learning Outcome</label>
                                                <input
                                                    type="text"
                                                    className="w-full text-sm font-bold text-[#0E5858] bg-white p-2 rounded-lg border border-[#0E5858]/10 focus:outline-[#00B6C1]"
                                                    value={topic.outcome || ""}
                                                    placeholder="Define what the user will learn..."
                                                    onChange={(e) => onEdit?.({ outcome: e.target.value })}
                                                />
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Layout Type:</label>
                                                <button
                                                    onClick={() => onEdit?.({ layout: topic.layout === 'grid' ? undefined : 'grid' })}
                                                    className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${topic.layout === 'grid' ? 'bg-[#00B6C1] text-white' : 'bg-gray-100 text-gray-400'}`}
                                                >
                                                    {topic.layout === 'grid' ? 'Card Grid' : 'Standard List'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : topic.outcome && (
                                <div className="flex-1 min-w-[300px] flex items-start gap-4 p-5 bg-green-50/30 rounded-3xl border border-green-50/50">
                                    <div className="shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center text-green-600 shadow-sm">
                                        <Target size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-green-700/60 uppercase tracking-widest mb-1.5">Learning Outcome</p>
                                        <p className="text-sm font-bold text-[#0E5858] leading-snug italic opacity-80">“{topic.outcome}”</p>
                                    </div>
                                </div>
                            )}

                            {displayLinks && displayLinks.length > 0 && !topic.caseStudyLinks && (
                                <div className="space-y-6 flex-1 min-w-[300px]">
                                    <div className="flex items-center justify-between mb-4 px-1">
                                        <div className="flex items-center gap-4">
                                            {topic.layout === 'grid' && <div className="w-1.5 h-10 bg-[#FFCC00] rounded-full"></div>}
                                            <div>
                                                <h4 className={`${topic.layout === 'grid' ? 'text-2xl' : 'text-lg'} font-serif text-[#0E5858]`}>
                                                    {topic.layout === 'grid' ? topic.title : (topic.isAssignment ? 'Reference links' : 'Reference Materials')}
                                                </h4>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">
                                                    {topic.layout === 'grid' ? 'Explore Cross-Platform Resources' : (topic.isAssignment ? 'Peer Audit Resource Links' : 'Essential Learning Material')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {isEditMode ? (
                                        <div className="space-y-4">
                                            {topic.links?.map((link, idx) => (
                                                <div key={idx} className="flex flex-col sm:flex-row gap-4 items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                                    <input
                                                        type="text"
                                                        value={link.label}
                                                        placeholder="Link Label"
                                                        className="w-full sm:flex-1 p-3 border-2 border-dashed border-[#0E5858]/20 rounded-xl focus:border-[#00B6C1] outline-none text-sm text-[#0E5858] font-bold"
                                                        onChange={(e) => {
                                                            const newLinks = [...(topic.links || [])];
                                                            newLinks[idx] = { ...newLinks[idx], label: e.target.value };
                                                            onEdit?.({ links: newLinks });
                                                        }}
                                                    />
                                                    <div className="w-full sm:flex-[2] relative">
                                                        <input
                                                            type="url"
                                                            value={link.url}
                                                            placeholder="https://"
                                                            className={`w-full p-3 border-2 border-dashed rounded-xl focus:border-[#00B6C1] outline-none text-sm ${(link.url.includes('youtu') || link.url.includes('drive') || link.url.includes('zoom'))
                                                                ? 'border-[#00B6C1]/50 text-[#00B6C1] bg-[#00B6C1]/5'
                                                                : 'border-[#0E5858]/20 text-gray-500'
                                                                }`}
                                                            onChange={(e) => {
                                                                const newLinks = [...(topic.links || [])];
                                                                newLinks[idx] = { ...newLinks[idx], url: e.target.value };
                                                                onEdit?.({ links: newLinks });
                                                            }}
                                                        />
                                                        {(link.url.includes('youtu') || link.url.includes('drive') || link.url.includes('zoom')) && (
                                                            <div className="absolute top-0 right-0 -trany-full flex items-center gap-1.5 px-2 py-0.5 bg-[#00B6C1] text-white rounded-t-lg text-[7px] font-black uppercase tracking-widest">
                                                                <Play size={8} /> Active Player Link
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const newLinks = [...(topic.links || [])];
                                                            newLinks.splice(idx, 1);
                                                            onEdit?.({ links: newLinks });
                                                        }}
                                                        className="p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors shrink-0"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => {
                                                    const newLinks = [...(topic.links || []), { label: "New Resource", url: "" }];
                                                    onEdit?.({ links: newLinks });
                                                }}
                                                className="w-full py-4 border-2 border-dashed border-[#00B6C1]/50 text-[#00B6C1] rounded-2xl hover:bg-[#00B6C1]/5 font-bold uppercase tracking-widest text-xs transition-colors mt-2"
                                            >
                                                + Add Resource Link
                                            </button>
                                        </div>
                                    ) : topic.layout === 'grid' ? (
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                            {displayLinks.map(link => (
                                                <motion.a
                                                    key={link.label}
                                                    href={link.url}
                                                    target={link.isPopup ? undefined : "_blank"}
                                                    rel="noopener noreferrer"
                                                    whileHover={{ y: -8, scale: 1.02 }}
                                                    onClick={(e) => {
                                                        if (link.isPopup) {
                                                            e.preventDefault();
                                                            setShowHealthPopup(true);
                                                        }
                                                        logActivity('click_link', { topicCode: topic.code, contentTitle: link.label });
                                                    }}
                                                    className="group/grid-card flex flex-col items-center text-center p-6 bg-white rounded-[2rem] shadow-sm hover:shadow-2xl transition-all border border-[#0E5858]/5 hover:border-[#00B6C1]/20 relative overflow-hidden aspect-[4/5] justify-center"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-b from-[#FAFCEE]/30 to-transparent opacity-0 group-hover/grid-card:opacity-100 transition-opacity"></div>

                                                    <div className="w-16 h-16 rounded-full bg-[#FAFCEE] flex items-center justify-center text-[#00B6C1] mb-6 group-hover/grid-card:bg-[#00B6C1] group-hover/grid-card:text-white transition-all shadow-inner">
                                                        {link.icon === 'shop' && <ShoppingBag size={28} />}
                                                        {link.icon === 'target' && <Target size={28} />}
                                                        {link.icon === 'globe' && <Globe size={28} />}
                                                        {link.icon === 'activity' && <Activity size={28} />}
                                                        {link.icon === 'building' && <Building2 size={28} />}
                                                        {link.icon === 'dumbbell' && <Dumbbell size={28} />}
                                                        {link.icon === 'medical' && <Stethoscope size={28} />}
                                                        {link.icon === 'flask' && <FlaskConical size={28} />}
                                                        {link.icon === 'school' && <School size={28} />}
                                                        {!link.icon && <FileText size={28} />}
                                                    </div>

                                                    <h5 className="text-sm font-serif text-[#0E5858] mb-1 group-hover/grid-card:text-[#00B6C1] transition-colors">{link.label}</h5>
                                                    <p className="text-[9px] font-medium text-gray-400 mb-4">{link.subtitle || 'Direct Resource Link'}</p>

                                                    <div className="mt-auto px-4 py-1.5 bg-[#FAFCEE] rounded-full flex items-center gap-1.5 group-hover/grid-card:bg-[#0E5858] transition-colors">
                                                        <FileText size={10} className="text-[#00B6C1] group-hover/grid-card:text-white" />
                                                        <span className="text-[8px] font-black text-[#00B6C1] group-hover/grid-card:text-white uppercase tracking-widest">Brochure</span>
                                                    </div>
                                                </motion.a>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {displayLinks.map(link => (
                                                <a
                                                    key={link.label}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={() => logActivity('click_link', { topicCode: topic.code, contentTitle: link.label })}
                                                    className="group/link flex items-center justify-between px-4 py-3 bg-white text-[#0E5858] shadow-sm hover:shadow-xl rounded-2xl text-[11px] font-bold border border-[#0E5858]/5 hover:border-[#00B6C1]/20 transition-all"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-[#FAFCEE] rounded-lg text-[#00B6C1] group-hover/link:bg-[#00B6C1] group-hover/link:text-white transition-colors">
                                                            <Share2 size={12} />
                                                        </div>
                                                        {link.label}
                                                    </div>
                                                    <ArrowUpRight size={14} className="opacity-0 group-hover/link:opacity-100 transition-opacity text-[#00B6C1]" />
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Engagement Area */}
                    <div className="space-y-12">
                        {/* PHASE 1: MATERIAL CONSUMPTION / RESEARCH */}
                        <div className="max-w-5xl">
                            {!topic.isAssignment && (
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xl transition-transform ${videoCompleted ? 'bg-green-500 shadow-green-500/10' : 'bg-[#00B6C1] shadow-[#00B6C1]/20'}`}>
                                        {videoCompleted ? <CheckCircle size={20} /> : <BookOpen size={20} />}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-serif text-[#0E5858]">
                                            {topic.caseStudyLinks ? 'Case Study Repository' : 'Material Review'}
                                        </h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                                            {topic.caseStudyLinks ? 'Select a case study to analyze' : 'Complete this to unlock simulations'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Case Study Grid OR Video/Mark as Read OR Assignment Resources OR Practice Booking */}
                            {topic.isBooking ? (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-12 h-12 bg-[#FFCC00] rounded-2xl flex items-center justify-center text-[#0E5858] shadow-xl shadow-[#FFCC00]/20">
                                            <Calendar size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-serif text-[#0E5858]">Mock Call Scheduler</h3>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select your preferred slot</p>
                                        </div>
                                    </div>

                                    <div className="premium-card bg-white rounded-[2.5rem] overflow-hidden border border-[#0E5858]/10 shadow-3xl h-[700px] relative">
                                        <iframe
                                            src={topic.bookingUrl}
                                            className="w-full h-full border-0"
                                            title="Schedule Mock Call"
                                        />
                                        <div className="absolute top-0 right-0 p-6 pointer-events-none">
                                            <div className="bg-[#FAFCEE]/80 backdrop-blur-md px-4 py-2 rounded-full border border-[#0E5858]/5 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                                <span className="text-[8px] font-black text-[#0E5858] uppercase tracking-widest">Live Calendar Connection</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-[#FAFCEE] rounded-3xl border border-[#0E5858]/5 flex items-start gap-4">
                                        <div className="p-3 bg-white rounded-xl text-[#00B6C1] shadow-sm">
                                            <Sparkles size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-[#0E5858] mb-1">Post-Booking Protocol</h4>
                                            <p className="text-xs text-gray-400 leading-relaxed">Once you book your slot, an automated email invitation will be sent to both you and your counselor with the meeting link. Please ensure your camera is active for the mock call.</p>
                                        </div>
                                    </div>
                                </div>
                            ) : topic.isAssignment && !assignmentCompleted && !videoCompleted ? (
                                <div className="p-8 bg-gradient-to-br from-[#0E5858] to-[#00B6C1] rounded-[2.5rem] text-center shadow-2xl shadow-[#0E5858]/20 animate-in fade-in zoom-in duration-700">
                                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
                                        <BrainCircuit size={32} className="text-white animate-pulse" />
                                    </div>
                                    <h3 className="text-2xl font-serif text-white mb-2">Ready for Performance Audit?</h3>
                                    <p className="text-white/60 text-sm mb-8 max-w-md mx-auto">Use the peer resource links above to gather your data, then click below to initialize your audit matrix.</p>
                                    <button
                                        onClick={() => {
                                            setVideoCompleted(true);
                                            logActivity('click_audit', { topicCode: topic.code, contentTitle: topic.title });
                                            setTimeout(() => {
                                                document.getElementById(`assignment-${topic.code}`)?.scrollIntoView({ behavior: 'smooth' });
                                            }, 100);
                                        }}
                                        className="inline-flex items-center gap-4 px-12 py-5 bg-white text-[#0E5858] rounded-2xl font-black text-xs uppercase tracking-[0.25em] hover:bg-[#FAFCEE] transition-all hover:-translate-y-1 shadow-xl"
                                    >
                                        <Sparkles size={20} className="text-[#00B6C1]" />
                                        Initialize Audit Matrix
                                    </button>
                                </div>
                            ) : topic.caseStudyLinks ? (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {topic.caseStudyLinks.map((link, i) => (
                                            <motion.div
                                                key={i}
                                                whileHover={{ y: -5, scale: 1.02 }}
                                                onClick={() => {
                                                    setSelectedCaseStudy(link);
                                                    logActivity('view_case_study', { topicCode: topic.code, contentTitle: `Case Study #${i + 1}` });
                                                }}
                                                className="aspect-[4/5] bg-[#FAFCEE] border border-[#0E5858]/5 rounded-2xl p-4 flex flex-col justify-between cursor-pointer group/case shadow-sm hover:shadow-xl hover:bg-white transition-all overflow-hidden relative"
                                            >
                                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/case:opacity-100 transition-opacity">
                                                    <Maximize2 size={12} className="text-[#00B6C1]" />
                                                </div>
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#00B6C1] shadow-sm transform group-hover/case:rotate-12 transition-transform">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black text-[#00B6C1] uppercase tracking-[0.2em] mb-1">Case study</p>
                                                    <p className="text-xs font-bold text-[#0E5858] leading-tight">Patient Journal #{String(i + 1).padStart(2, '0')}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                    {/* Intermediate confirmation removed as per user request */}
                                </div>
                            ) : embedUrl ? (
                                <div className={`transition-all duration-700 ${videoCompleted ? "opacity-60 grayscale-[0.5]" : ""}`}>
                                    <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 ring-1 ring-black/[0.03]">
                                        {embedUrl.includes('youtube.com') ? (
                                            <YouTubePlayer videoId={embedUrl.split('/').pop() || ''} onComplete={handleVideoComplete} topicCode={topic.code} topicTitle={topic.title} />
                                        ) : (
                                            <iframe
                                                src={embedUrl}
                                                className="w-full h-full"
                                                allow="autoplay"
                                                allowFullScreen
                                            />
                                        )}
                                    </div>
                                    {/* Intermediate confirmation removed */}
                                </div>
                            ) : null}
                        </div>

                        {/* PHASE 2: INTERACTION (ONLY IF APPLICABLE) */}
                        {(topic.hasLive || topic.isAssignment) && (
                            <div
                                id={`assignment-${topic.code}`}
                                className={`${videoCompleted ? "opacity-100" : (topic.isAssignment ? "opacity-0 h-0 overflow-hidden" : "opacity-40 blur-[4px] pointer-events-none grayscale select-none")} transition-all duration-1000 max-w-5xl`}
                            >
                                {!topic.isAssignment && (
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xl ${simulationCompleted || assignmentCompleted ? 'bg-green-500 shadow-green-500/10' : 'bg-purple-500 shadow-purple-500/20'}`}>
                                            {topic.hasLive ? <User size={20} /> : <Activity size={20} />}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-serif text-[#0E5858]">{topic.hasLive ? 'Practice Simulation' : 'Analytical Research Task'}</h4>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Practical Implementation Phase</p>
                                        </div>
                                    </div>
                                )}

                                <div className="p-8 bg-gradient-to-br from-white to-[#FAFCEE]/30 rounded-[3rem] border border-[#0E5858]/5 shadow-2xl relative overflow-hidden">
                                    {topic.hasLive ? (
                                        <>
                                            <ClinicalSimulator topicTitle={topic.title} topicContent={topic.content} topicCode={topic.code} />
                                            {/* Intermediate confirmation removed */}
                                        </>
                                    ) : (
                                        <AssignmentForm
                                            topicCode={topic.code}
                                            questions={topic.assignmentQuestions || []}
                                            persona={topic.persona}
                                            onComplete={() => setAssignmentCompleted(true)}
                                            userId={userId}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* FOOTER: THE "MARK COMPLETED" ACTION */}
                        <div className="pt-10 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${isReadyToComplete ? 'bg-green-500 animate-pulse' : 'bg-gray-200'}`}></div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    {isCompleted ? 'Segment Completed & Logged' : (isReadyToComplete ? 'Requirements Met • Ready to Mark' : 'Incomplete Requirements')}
                                </p>
                            </div>

                            <button
                                onClick={async () => {
                                    if (isCompleted) {
                                        onMoveNext?.(topic.code);
                                        return;
                                    }
                                    if (isSyncing) return;

                                    setIsSyncing(true);
                                    try {
                                        // Immediate UI feedback for internal states
                                        setVideoCompleted(true);
                                        setSimulationCompleted(true);
                                        setAssignmentCompleted(true);

                                        // Trigger DB sync
                                        await onToggleComplete();

                                        // Optional: log specific activity
                                        logActivity('complete_quiz', { topicCode: topic.code, contentTitle: topic.title });
                                    } catch (err) {
                                        console.error("Completion Sync Failed:", err);
                                    } finally {
                                        setTimeout(() => setIsSyncing(false), 1000);
                                    }
                                }}
                                disabled={isSyncing}
                                className={`group flex items-center gap-4 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.25em] transition-all duration-500 relative transform active:scale-95 ${isCompleted
                                    ? 'bg-[#00B6C1] text-white hover:bg-[#0E5858] hover:-translate-y-1 shadow-2xl scale-105'
                                    : (isSyncing ? 'bg-green-500 text-white shadow-xl shadow-green-500/20' : 'bg-[#0E5858] text-white hover:bg-[#00B6C1] hover:-translate-y-1 shadow-2xl shadow-[#0E5858]/30 scale-105')
                                    }`}
                            >
                                {!isCompleted && !isSyncing && (
                                    <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse pointer-events-none"></div>
                                )}
                                {isCompleted ? (
                                    <>
                                        <ArrowRight size={20} className="animate-pulse" />
                                        {isLastTopic ? "Next Module" : "Move Next"}
                                    </>
                                ) : (
                                    <>
                                        {isSyncing ? (
                                            <>
                                                <CheckCircle2 size={20} className="animate-bounce" />
                                                Verified!
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={20} />
                                                Complete Segment
                                            </>
                                        )}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
