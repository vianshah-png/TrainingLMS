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
    Calendar,
    Mail,
    MessageCircle,
    ChevronDown,
    ChevronUp,
    LayoutDashboard,
    Headphones,
    Mic,
    Layers,
    Copy,
    Instagram
} from "lucide-react";
import YouTubePlayer from "./YouTubePlayer";
import AcademySimulator from "./AcademySimulator";
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

    // Google Drive - Enable embedding for files, but skip folders (folders cause 403 in iframes)
    if (url.includes('drive.google.com')) {
        if (url.includes('/file/d/')) {
            return url.replace(/\/(view|edit|present|preview).*$/, '/preview');
        }
        return null;
    }

    // Zoom
    if (url.includes('zoom.us')) {
        return url;
    }

    return null;
}

function getSlideThumbnail(url: string | null): string | null {
    if (!url || !url.includes('docs.google.com/presentation')) return null;
    const idMatch = url.match(/\/d\/([^\/]+)/);
    if (!idMatch) return null;
    return `https://docs.google.com/presentation/d/${idMatch[1]}/export/png`;
}

function getYouTubeVideoId(url: string | undefined): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

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



export default function TopicCard({ topic, index, isCompleted, onToggleComplete, onMoveNext, isLastTopic, userId, isEditMode, onEdit }: TopicCardProps) {
    const [videoCompleted, setVideoCompleted] = useState(false);
    const [simulationCompleted, setSimulationCompleted] = useState(false);
    const [assignmentCompleted, setAssignmentCompleted] = useState(false);
    const [showHealthPopup, setShowHealthPopup] = useState(false);
    const [selectedCaseStudy, setSelectedCaseStudy] = useState<string | null>(null);
    const [showSimulation, setShowSimulation] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<{ url: string, label: string } | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [emailStatus, setEmailStatus] = useState<Record<string, 'idle' | 'sending' | 'sent' | 'error'>>({});
    const [isAccordionOpen, setIsAccordionOpen] = useState(false);
    const [selectedAccordionLink, setSelectedAccordionLink] = useState<any>(null);
    const [activeSubResource, setActiveSubResource] = useState<any>(null);
    const [showAllCaseStudies, setShowAllCaseStudies] = useState(false);
    const [activeGridVideo, setActiveGridVideo] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [healthTab, setHealthTab] = useState<'doctors' | 'pharma'>('doctors');


    const sendMockCallEmail = async (mentorName: string, mentorEmail: string) => {
        const key = mentorEmail;
        setEmailStatus(prev => ({ ...prev, [key]: 'sending' }));
        try {
            const res = await fetch('/api/send-mock-call-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mentorName,
                    mentorEmail,
                    counselorEmail: undefined, // server uses session if needed
                    counselorName: undefined,
                }),
            });
            if (!res.ok) throw new DOMException('Mock call email delivery failed', 'NetworkError');
            setEmailStatus(prev => ({ ...prev, [key]: 'sent' }));
            setTimeout(() => setEmailStatus(prev => ({ ...prev, [key]: 'idle' })), 4000);
        } catch {
            setEmailStatus(prev => ({ ...prev, [key]: 'error' }));
            setTimeout(() => setEmailStatus(prev => ({ ...prev, [key]: 'idle' })), 3000);
        }
    };

    // Find main video/media link
    const mediaLink = topic.links?.find(l =>
        l.url.includes('youtube') ||
        l.url.includes('youtu.be') ||
        l.url.includes('drive.google.com') ||
        l.url.includes('zoom.us')
    );
    const embedUrl = getEmbedUrl(mediaLink?.url);

    // Links to display in the UI (hides the media link if it's playing as a video, unless in edit mode)
    const displayLinks = (isEditMode
        ? topic.links
        : topic.links?.filter(link => !(topic.layout !== 'grid' && embedUrl && link === mediaLink))) || [];

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
            </AnimatePresence>

            {/* Standard Document Overlay */}
            <AnimatePresence>
                {selectedDocument && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-12 transition-all duration-500 ${(selectedDocument.label.toLowerCase().includes('clip') || selectedDocument.label.toLowerCase().includes('call'))
                                ? 'bg-black/40 backdrop-blur-sm'
                                : 'bg-[#0E5858]/95 backdrop-blur-xl'
                            }`}
                    >
                        <div className={`w-full transition-all duration-500 ${(selectedDocument.label.toLowerCase().includes('clip') || selectedDocument.label.toLowerCase().includes('call'))
                                ? 'max-w-xl bg-[#0E5858] p-8 rounded-[2.5rem] shadow-2xl border border-white/10'
                                : 'max-w-5xl'
                            }`}>
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-3xl font-serif text-white mb-1">{selectedDocument.label}</h3>
                                    <p className="text-[#00B6C1] text-xs font-bold uppercase tracking-widest">
                                        {selectedDocument.label.toLowerCase().includes('clip') || selectedDocument.label.toLowerCase().includes('call') ? 'Audio Player' : 'Document Viewer'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedDocument(null)}
                                    className="w-14 h-14 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all border border-white/10"
                                >
                                    <X size={28} />
                                </button>
                            </div>

                            {/* Adaptive Player Container */}
                            {(() => {
                                const isEmbeddable = selectedDocument.url.includes('docs.google.com') ||
                                    selectedDocument.url.includes('drive.google.com') ||
                                    selectedDocument.url.includes('zoom.us') ||
                                    selectedDocument.url.toLowerCase().endsWith('.mp4') ||
                                    selectedDocument.url.toLowerCase().endsWith('.pdf');
                                const isAudio = selectedDocument.label.toLowerCase().includes('clip') || selectedDocument.label.toLowerCase().includes('call');

                                if (!isEmbeddable && !isAudio) {
                                    // Non-embeddable URL — show a clean open-in-browser card
                                    return (
                                        <div className="w-full h-[300px] rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
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
                                    <div className={`w-full rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-black ${isAudio ? 'h-[100px]' : 'h-[75vh]'}`}>
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
                                    className="text-gray-600 leading-relaxed text-[15px] font-medium"
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

                            {((displayLinks && displayLinks.length > 0) || topic.isAccordion) && !topic.caseStudyLinks && (
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
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                            {displayLinks.map((link) => {
                                                const isVideo = link.url.toLowerCase().endsWith('.mp4') || link.url.toLowerCase().endsWith('.mov') || link.url.includes('drive.google.com/file/d/');
                                                const isDocs = !isVideo && (link.isPopup || link.url.includes('drive.google.com') || link.url.includes('docs.google.com') || link.url.toLowerCase().includes('.pdf') || link.label.toLowerCase().includes('catalogue') || link.label.toLowerCase().includes('catelogue'));

                                                return (
                                                    <motion.div
                                                        key={link.label}
                                                        layout
                                                        whileHover={activeGridVideo === link.url ? {} : { y: -8, scale: 1.01 }}
                                                        onClick={() => {
                                                            if (activeGridVideo === link.url) return;
                                                            if (link.isCopyOnly) {
                                                                navigator.clipboard.writeText(link.url);
                                                                setCopiedId(link.url);
                                                                setTimeout(() => setCopiedId(null), 2000);
                                                                return;
                                                            }
                                                            if (link.isPopup) {
                                                                setShowHealthPopup(true);
                                                            } else if (isDocs) {
                                                                setSelectedDocument({ url: link.url, label: link.label });
                                                            } else if (isVideo) {
                                                                setActiveGridVideo(link.url);
                                                            } else {
                                                                setSelectedDocument({ url: link.url, label: link.label });
                                                            }
                                                            logActivity('click_link', { topicCode: topic.code, contentTitle: link.label });
                                                        }}
                                                        className={`group/grid-card cursor-pointer flex flex-col bg-white rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 border border-[#0E5858]/10 hover:border-[#00B6C1]/20 relative overflow-hidden h-[300px] ${activeGridVideo === link.url ? 'ring-4 ring-[#00B6C1] z-50' : ''}`}
                                                    >
                                                        {activeGridVideo === link.url ? (
                                                            <div className="absolute inset-0 bg-black animate-in fade-in duration-500">
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveGridVideo(null);
                                                                    }}
                                                                    className="absolute top-4 right-4 z-[60] w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all border border-white/20 shadow-xl"
                                                                >
                                                                    <X size={20} />
                                                                </button>
                                                                <iframe 
                                                                    src={getEmbedUrl(link.url) || link.url} 
                                                                    className="w-full h-full border-0" 
                                                                    allow="autoplay; fullscreen"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className={`aspect-video w-full relative overflow-hidden flex items-center justify-center ${isVideo ? 'bg-black' : link.isCopyOnly ? 'bg-gradient-to-br from-[#E1306C]/10 via-[#C13584]/10 to-[#833AB4]/10' : 'bg-[#FAFCEE]'}`}>
                                                                    {isVideo ? (
                                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                                            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center group-hover/grid-card:scale-110 transition-transform z-20">
                                                                                <Play size={32} className="text-white fill-current translate-x-1" />
                                                                            </div>
                                                                            <img 
                                                                                src={`https://images.unsplash.com/photo-1576091160550-217359f4bd01?w=800&q=80&auto=format&fit=crop`} 
                                                                                className="w-full h-full object-cover opacity-60 grayscale group-hover/grid-card:grayscale-0 transition-all duration-700" 
                                                                                alt="Video Preview"
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl group-hover/grid-card:scale-110 transition-transform ${link.isCopyOnly ? 'bg-gradient-to-br from-[#E1306C] to-[#833AB4] text-white' : 'bg-white text-[#00B6C1]'}`}>
                                                                            {link.icon === 'shop' && <ShoppingBag size={28} />}
                                                                            {link.icon === 'target' && <Target size={28} />}
                                                                            {link.icon === 'globe' && <Globe size={28} />}
                                                                            {link.icon === 'activity' && <Activity size={28} />}
                                                                            {link.icon === 'building' && <Building2 size={28} />}
                                                                            {link.icon === 'dumbbell' && <Dumbbell size={28} />}
                                                                            {link.icon === 'medical' && <Stethoscope size={28} />}
                                                                            {link.icon === 'flask' && <FlaskConical size={28} />}
                                                                            {link.icon === 'school' && <School size={28} />}
                                                                            {link.icon === 'instagram' && <Instagram size={28} />}
                                                                            {!link.icon && <FileText size={28} />}
                                                                        </div>
                                                                    )}
                                                                    {/* Copied Toast */}
                                                                    {link.isCopyOnly && copiedId === link.url && (
                                                                        <div className="absolute inset-0 bg-gradient-to-br from-[#E1306C] to-[#833AB4] flex items-center justify-center z-30 animate-in fade-in duration-300">
                                                                            <div className="flex flex-col items-center gap-2 text-white">
                                                                                <CheckCircle size={32} />
                                                                                <span className="text-xs font-bold uppercase tracking-widest">Copied!</span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="p-5 flex flex-col flex-1">
                                                                    <div className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1.5 ${isVideo ? 'text-[#00B6C1]' : link.isCopyOnly ? 'text-[#E1306C]' : 'text-gray-400'}`}>
                                                                        {isVideo ? 'Training Video' : link.isCopyOnly ? 'Tap to Copy · Instagram' : 'Reference Material'}
                                                                    </div>
                                                                    <h5 className="text-base font-serif text-[#0E5858] mb-2 group-hover/grid-card:text-[#00B6C1] transition-colors">{link.label}</h5>
                                                                    <p className="text-[12px] font-medium leading-relaxed text-gray-500 mb-4 line-clamp-2">{link.subtitle || (link.isCopyOnly ? 'Tap to copy this ID, then paste in Instagram search on your phone.' : 'Review this resource to strengthen your understanding.')}</p>
                                                                    
                                                                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-50">
                                                                        <span className="text-[9px] font-bold text-[#0E5858]/60 uppercase tracking-widest">
                                                                            {isVideo ? 'Play on Dashboard' : link.isCopyOnly ? (copiedId === link.url ? '✓ Copied to Clipboard' : 'Click to Copy ID') : 'View in Dashboard'}
                                                                        </span>
                                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${link.isCopyOnly ? 'bg-[#E1306C]/10 group-hover/grid-card:bg-[#E1306C]' : 'bg-[#FAFCEE] group-hover/grid-card:bg-[#0E5858]'}`}>
                                                                            {isVideo ? <Play size={12} className="group-hover/grid-card:text-white" /> : link.isCopyOnly ? <Copy size={12} className="group-hover/grid-card:text-white" /> : <ArrowRight size={12} className="group-hover/grid-card:text-white" />}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </motion.div>
                                                )
                                            })}
                                        </div>

                                    ) : topic.isAccordion ? (
                                        <div className="space-y-6 w-full max-w-4xl">
                                            {/* Specialized Dropdown for Program Training (M2-03) */}
                                            {topic.code === 'M2-03' ? (
                                                <div className="w-full">
                                                    <div className="relative group/dropdown">
                                                        <div className="absolute -inset-1 bg-gradient-to-r from-[#00B6C1] to-[#0E5858] rounded-[2rem] blur opacity-20 group-hover/dropdown:opacity-40 transition-opacity"></div>
                                                        <div className="relative bg-white border border-[#0E5858]/10 rounded-[1.8rem] p-2 flex flex-col md:flex-row items-center gap-4 shadow-xl">
                                                            <div className="w-full md:w-auto px-6 py-3 bg-[#FAFCEE] rounded-2xl flex items-center gap-3">
                                                                <Layers size={18} className="text-[#0E5858]" />
                                                                <span className="text-[10px] font-black text-[#0E5858] uppercase tracking-widest whitespace-nowrap">Select Program</span>
                                                            </div>
                                                            <select
                                                                value={activeSubResource?.url || ""}
                                                                onChange={(e) => {
                                                                    const selected = topic.links?.[0]?.subLinks?.find(sl => sl.url === e.target.value);
                                                                    if (selected) {
                                                                        setActiveSubResource(selected);
                                                                        logActivity('select_program_dropdown', { topicCode: topic.code, contentTitle: selected.label });
                                                                    }
                                                                }}
                                                                className="flex-1 bg-transparent border-none focus:ring-0 text-[#0E5858] font-serif text-lg py-2 px-4 cursor-pointer appearance-none"
                                                            >
                                                                <option value="" disabled>— Choose a program to start training —</option>
                                                                {topic.links?.[0]?.subLinks?.map((subLink, i) => (
                                                                    <option key={i} value={subLink.url}>{subLink.label}</option>
                                                                ))}
                                                            </select>
                                                            <div className="absolute right-6 pointer-events-none text-[#00B6C1]">
                                                                <ChevronDown size={20} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Integrated Video Player for M2-03 */}
                                                    {activeSubResource && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            className="mt-8 relative"
                                                        >
                                                            <div className="absolute -inset-4 bg-white/50 blur-3xl -z-10"></div>
                                                            <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(14,88,88,0.2)] border-4 border-white bg-black group/player relative">
                                                                <YouTubePlayer 
                                                                    videoId={getYouTubeVideoId(activeSubResource.url) || ""} 
                                                                    onComplete={() => setVideoCompleted(true)}
                                                                />
                                                                <div className="absolute top-6 left-6 z-10">
                                                                    <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border border-white/10">
                                                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                                                        Training in progress
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="mt-6 flex items-center justify-between px-4">
                                                                <div>
                                                                    <h4 className="text-xl font-serif text-[#0E5858]">{activeSubResource.label}</h4>
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Foundational Program Training • v3.1</p>
                                                                </div>
                                                                <button 
                                                                    onClick={() => window.open(activeSubResource.url, '_blank')}
                                                                    className="flex items-center gap-2 px-4 py-2 bg-[#FAFCEE] text-[#0E5858] rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#0E5858]/10 hover:bg-[#0E5858] hover:text-white transition-all shadow-sm"
                                                                >
                                                                    <ExternalLink size={14} /> View on YouTube
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Category Tabs - Stacked Vertically */}
                                                    <div className="flex flex-col gap-3 w-full">
                                                        {displayLinks.map((link, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => {
                                                                    setSelectedAccordionLink(link);
                                                                    setActiveSubResource(null);
                                                                    logActivity('select_category', { topicCode: topic.code, contentTitle: link.label });
                                                                }}
                                                                className={`flex items-center gap-4 p-5 rounded-[1.5rem] border-2 transition-all duration-300 w-full ${selectedAccordionLink?.label === link.label
                                                                    ? 'bg-[#0E5858] border-[#0E5858] text-white shadow-xl shadow-[#0E5858]/20'
                                                                    : 'bg-[#FAFCEE] border-[#0E5858]/10 text-[#0E5858] hover:border-[#00B6C1]/40 hover:bg-white shadow-sm'}`}
                                                            >
                                                                <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center transition-colors ${selectedAccordionLink?.label === link.label ? 'bg-white/10 text-white' : 'bg-white text-[#0E5858] shadow-sm'}`}>
                                                                    {link.icon === 'audio' ? <Headphones size={24} /> : <LayoutDashboard size={24} />}
                                                                </div>
                                                                <div className="text-left min-w-0 flex-1">
                                                                    <span className="text-sm font-bold block">{link.label}</span>
                                                                    <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${selectedAccordionLink?.label === link.label ? 'text-white/60' : 'text-gray-400'}`}>
                                                                        {link.subLinks?.length || 0} Resources
                                                                    </p>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {selectedAccordionLink && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="bg-white border border-[#0E5858]/10 rounded-[2rem] p-5 shadow-lg w-full overflow-hidden"
                                                        >
                                                            {/* Compact Player Section */}
                                                            <div className="flex flex-col items-center text-center mb-5">
                                                                <h5 className="text-lg font-serif text-[#0E5858] mb-0.5">{activeSubResource?.label || selectedAccordionLink.label}</h5>
                                                                <p className="text-[9px] font-bold text-[#00B6C1] uppercase tracking-[0.2em] mb-3">
                                                                    {activeSubResource ? 'Currently Playing' : 'Select a recording below'}
                                                                </p>

                                                                {/* Centered Player - Dynamic Height based on content */}
                                                                <div className={`w-full max-w-lg ${activeSubResource?.url?.includes('youtube.com') || activeSubResource?.url?.includes('youtu.be') ? 'aspect-video' : 'h-[120px]'} bg-black rounded-2xl overflow-hidden shadow-xl border border-white/10 relative mx-auto transition-all duration-500`}>
                                                                    {activeSubResource?.url?.includes('youtube.com') || activeSubResource?.url?.includes('youtu.be') ? (
                                                                        <YouTubePlayer 
                                                                            videoId={getYouTubeVideoId(activeSubResource.url) || ""} 
                                                                            onComplete={() => setVideoCompleted(true)}
                                                                        />
                                                                    ) : (
                                                                        <iframe
                                                                            src={getDocEmbedUrl(activeSubResource?.url || (selectedAccordionLink.subLinks?.[0]?.url) || selectedAccordionLink.url)}
                                                                            className="w-full h-full"
                                                                            allow="autoplay"
                                                                        />
                                                                    )}
                                                                    
                                                                    {!activeSubResource && (
                                                                        <div className="absolute inset-0 bg-[#0E5858]/80 backdrop-blur-md flex items-center justify-center gap-3 text-white cursor-pointer" onClick={() => setActiveSubResource(selectedAccordionLink.subLinks?.[0])}>
                                                                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                                                                <Play size={18} fill="white" />
                                                                            </div>
                                                                            <p className="text-xs font-bold">Tap to play Master Recording</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Thin separator */}
                                                            <div className="w-full h-px bg-[#0E5858]/5 mb-4"></div>

                                                            {/* Compact Horizontal Media Strip */}
                                                            {selectedAccordionLink.subLinks && selectedAccordionLink.subLinks.length > 0 && (
                                                                <div className="w-full">
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <div className="w-1 h-4 bg-[#00B6C1] rounded-full"></div>
                                                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Media Repository</p>
                                                                        <span className="ml-auto text-[8px] text-[#0E5858]/30 font-bold uppercase tracking-widest">Scroll →</span>
                                                                    </div>
                                                                    <div className="flex overflow-x-auto pb-3 gap-4 scroll-smooth snap-x snap-mandatory" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(14,88,88,0.15) transparent' }}>
                                                                        {selectedAccordionLink.subLinks.map((subLink: { label: string, url: string }, i: number) => (
                                                                            <motion.div
                                                                                key={i}
                                                                                whileHover={{ y: -5, scale: 1.02 }}
                                                                                whileTap={{ scale: 0.97 }}
                                                                                onClick={() => {
                                                                                    setActiveSubResource(subLink);
                                                                                    logActivity('select_subresource', { topicCode: topic.code, contentTitle: subLink.label });
                                                                                }}
                                                                                className={`flex-none w-[200px] h-[120px] rounded-2xl p-4 flex flex-col justify-between cursor-pointer group/sub transition-all snap-start shadow-sm hover:shadow-xl border relative ${activeSubResource?.url === subLink.url
                                                                                        ? 'bg-[#0E5858] border-[#0E5858] text-white ring-2 ring-[#00B6C1]/30'
                                                                                        : 'bg-[#FAFCEE] border-[#0E5858]/5 text-[#0E5858] hover:bg-white hover:border-[#00B6C1]/30'
                                                                                    }`}
                                                                            >
                                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-colors ${activeSubResource?.url === subLink.url ? 'bg-white/10 text-white' : 'bg-white text-[#00B6C1]'}`}>
                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                                                                                </div>
                                                                                <p className="text-[11px] font-bold leading-tight line-clamp-2">{subLink.label}</p>
                                                                            </motion.div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {displayLinks.map(link => {
                                                const isDocs = link.isPopup || link.url.includes('drive.google.com') || link.url.includes('docs.google.com') || link.url.toLowerCase().includes('.pdf') || link.label.toLowerCase().includes('catalogue') || link.label.toLowerCase().includes('catelogue');

                                                const content = (
                                                    <div className="flex items-start gap-4 h-full">
                                                        <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                                                            <div>
                                                                <h5 className="text-sm font-bold text-[#0E5858] group-hover/link:text-[#00B6C1] transition-colors line-clamp-1">{link.label}</h5>
                                                                {link.subtitle ? (
                                                                    <div className="mt-2 p-3 bg-[#FAFCEE] rounded-xl border border-[#00B6C1]/10">
                                                                        <p className="text-[11px] text-[#0E5858] leading-relaxed italic font-medium">
                                                                            <span className="text-[9px] font-black text-[#00B6C1] uppercase tracking-widest block mb-1">Mentor Note</span>
                                                                            {link.subtitle}
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-[10px] text-gray-400 mt-2 leading-relaxed line-clamp-2">
                                                                        {link.isCopyOnly ? 'Click this button to copy the ID.' : 'Essential resource link required for your training journey.'}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {link.isCopyOnly && copiedId === link.url && (
                                                                <div className="mt-3 text-[#E1306C] text-[10px] font-bold uppercase flex items-center gap-1 opacity-0 animate-in fade-in duration-300">
                                                                    <CheckCircle size={12} /> Copied to clipboard!
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className={`mt-1 shrink-0 ${link.isCopyOnly ? 'text-[#E1306C] bg-[#E1306C]/10 p-2 rounded-full' : 'text-[#00B6C1]'} transition-transform group-hover/link:scale-110`}>
                                                            {link.isCopyOnly ? <Copy size={16} /> : <ArrowUpRight size={16} />}
                                                        </div>
                                                    </div>
                                                );

                                                if (link.isCopyOnly) {
                                                    return (
                                                        <button
                                                            key={link.label}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                navigator.clipboard.writeText(link.url);
                                                                setCopiedId(link.url);
                                                                setTimeout(() => setCopiedId(null), 2000);
                                                                logActivity('copy_id', { topicCode: topic.code, contentTitle: link.label });
                                                            }}
                                                            className="group/link text-left flex flex-col justify-between p-5 bg-white shadow-sm hover:shadow-xl rounded-3xl border border-[#0E5858]/5 hover:border-[#E1306C]/30 transition-all gap-4"
                                                        >
                                                            {content}
                                                        </button>
                                                    );
                                                }

                                                return (
                                                    <a
                                                        key={link.label}
                                                        href={isDocs ? undefined : link.url}
                                                        target={isDocs ? undefined : "_blank"}
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => {
                                                            if (isDocs) {
                                                                e.preventDefault();
                                                                setSelectedDocument({ url: link.url, label: link.label });
                                                            }
                                                            logActivity('click_link', { topicCode: topic.code, contentTitle: link.label });
                                                        }}
                                                        className="group/link flex flex-col justify-between p-5 bg-white shadow-sm hover:shadow-xl rounded-3xl border border-[#0E5858]/5 hover:border-[#00B6C1]/30 transition-all gap-4"
                                                    >
                                                        {content}
                                                    </a>
                                                )
                                            })}
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
                            {/* Case Study Grid OR Video/Mark as Read OR Assignment Resources OR Practice Booking */}
                            {topic.isBooking ? (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-12 h-12 bg-[#FFCC00] rounded-2xl flex items-center justify-center text-[#0E5858] shadow-xl shadow-[#FFCC00]/20">
                                            <Calendar size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-serif text-[#0E5858]">Schedule Your Mock Call</h3>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact a mentor to schedule</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Mentor Epshita */}
                                        <div className="premium-card p-6 bg-white rounded-3xl border border-[#0E5858]/10 shadow-xl flex flex-col gap-6 relative overflow-hidden group/contact">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00B6C1]/5 rounded-bl-full -z-10 group-hover/contact:scale-150 transition-transform duration-700"></div>

                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-full bg-[#FAFCEE] flex items-center justify-center text-[#0E5858] font-serif text-2xl shadow-inner border border-[#0E5858]/10">
                                                    E
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-serif text-[#0E5858]">Mentor Epshita</h4>
                                                    <p className="text-[10px] font-bold text-[#00B6C1] uppercase tracking-widest">Training Lead</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3 mt-auto">
                                                <button
                                                    onClick={() => sendMockCallEmail('Mentor Epshita', 'mentor.epshita@balancenutrition.in')}
                                                    disabled={emailStatus['mentor.epshita@balancenutrition.in'] === 'sending' || emailStatus['mentor.epshita@balancenutrition.in'] === 'sent'}
                                                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${emailStatus['mentor.epshita@balancenutrition.in'] === 'sent'
                                                        ? 'bg-green-500 text-white'
                                                        : emailStatus['mentor.epshita@balancenutrition.in'] === 'error'
                                                            ? 'bg-red-100 text-red-600'
                                                            : emailStatus['mentor.epshita@balancenutrition.in'] === 'sending'
                                                                ? 'bg-[#0E5858]/60 text-white cursor-wait'
                                                                : 'bg-[#FAFCEE] hover:bg-[#0E5858] text-[#0E5858] hover:text-white'
                                                        }`}
                                                >
                                                    <Mail size={16} />
                                                    {emailStatus['mentor.epshita@balancenutrition.in'] === 'sending' ? 'Sending...' : emailStatus['mentor.epshita@balancenutrition.in'] === 'sent' ? '✓ Email Sent!' : emailStatus['mentor.epshita@balancenutrition.in'] === 'error' ? 'Failed — Retry' : 'Email Epshita'}
                                                </button>
                                                <a
                                                    href="https://wa.me/917021963284?text=Hi%20Mentor%20Epshita,%20I%20would%20like%20to%20schedule%20my%20mock%20call."
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full flex items-center justify-center gap-2 py-3 bg-green-50 hover:bg-green-500 text-green-600 hover:text-white rounded-xl text-sm font-bold transition-colors"
                                                >
                                                    <MessageCircle size={16} /> WhatsApp Epshita
                                                </a>
                                            </div>
                                        </div>

                                        {/* Mentor Omanshi */}
                                        <div className="premium-card p-6 bg-white rounded-3xl border border-[#0E5858]/10 shadow-xl flex flex-col gap-6 relative overflow-hidden group/contact">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00B6C1]/5 rounded-bl-full -z-10 group-hover/contact:scale-150 transition-transform duration-700"></div>

                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-full bg-[#FAFCEE] flex items-center justify-center text-[#0E5858] font-serif text-2xl shadow-inner border border-[#0E5858]/10">
                                                    O
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-serif text-[#0E5858]">Mentor Omanshi</h4>
                                                    <p className="text-[10px] font-bold text-[#00B6C1] uppercase tracking-widest">Training Lead</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3 mt-auto">
                                                <button
                                                    onClick={() => sendMockCallEmail('Mentor Omanshi', 'mentor.omanshi@balancenutrition.in')}
                                                    disabled={emailStatus['mentor.omanshi@balancenutrition.in'] === 'sending' || emailStatus['mentor.omanshi@balancenutrition.in'] === 'sent'}
                                                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${emailStatus['mentor.omanshi@balancenutrition.in'] === 'sent'
                                                        ? 'bg-green-500 text-white'
                                                        : emailStatus['mentor.omanshi@balancenutrition.in'] === 'error'
                                                            ? 'bg-red-100 text-red-600'
                                                            : emailStatus['mentor.omanshi@balancenutrition.in'] === 'sending'
                                                                ? 'bg-[#0E5858]/60 text-white cursor-wait'
                                                                : 'bg-[#FAFCEE] hover:bg-[#0E5858] text-[#0E5858] hover:text-white'
                                                        }`}
                                                >
                                                    <Mail size={16} />
                                                    {emailStatus['mentor.omanshi@balancenutrition.in'] === 'sending' ? 'Sending...' : emailStatus['mentor.omanshi@balancenutrition.in'] === 'sent' ? '✓ Email Sent!' : emailStatus['mentor.omanshi@balancenutrition.in'] === 'error' ? 'Failed — Retry' : 'Email Omanshi'}
                                                </button>
                                                <a
                                                    href="https://wa.me/919820017056?text=Hi%20Mentor%20Omanshi,%20I%20would%20like%20to%20schedule%20my%20mock%20call."
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full flex items-center justify-center gap-2 py-3 bg-green-50 hover:bg-green-500 text-green-600 hover:text-white rounded-xl text-sm font-bold transition-colors"
                                                >
                                                    <MessageCircle size={16} /> WhatsApp Omanshi
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-[#FAFCEE] rounded-3xl border border-[#0E5858]/5 flex items-start gap-4">
                                        <div className="p-3 bg-white rounded-xl text-[#00B6C1] shadow-sm">
                                            <Sparkles size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-[#0E5858] mb-1">Post-Booking Protocol</h4>
                                            <p className="text-xs text-gray-400 leading-relaxed">Once you message or email your preferred mentor, an automated email invitation will be sent to both you and your counselor with the meeting link. Please ensure your camera is active for the mock call.</p>
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
                            ) : topic.isAssignment ? (
                                <div id={`assignment-${topic.code}`} className="mt-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
                                    <AssignmentForm
                                        topicCode={topic.code}
                                        questions={topic.assignmentQuestions || []}
                                        persona={topic.persona}
                                        userId={userId}
                                        onComplete={() => setAssignmentCompleted(true)}
                                    />
                                </div>
                            ) : (topic.caseStudies || topic.caseStudyLinks) ? (
                                <div className="space-y-10">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                        {(topic.caseStudies || topic.caseStudyLinks?.map((l, i) => ({ label: `Patient Journal #${String(i + 1).padStart(2, '0')}`, url: l })) || [])
                                            .slice(0, showAllCaseStudies ? undefined : 8)
                                            .map((cs: any, i: number) => {
                                            const thumbnail = cs.thumbnail || getSlideThumbnail(cs.url);
                                            
                                            return (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    whileHover={{ y: -10, scale: 1.02 }}
                                                    onClick={() => {
                                                        setSelectedCaseStudy(cs.url);
                                                        logActivity('view_case_study', { topicCode: topic.code, contentTitle: cs.label });
                                                    }}
                                                    className="group/case aspect-[4/5] bg-white border border-[#0E5858]/10 rounded-[2.5rem] flex flex-col cursor-pointer shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden relative"
                                                >
                                                    {/* Thumbnail / Image Area - ZOOMED PREVIEW */}
                                                    <div className="flex-1 bg-[#FAFCEE] relative overflow-hidden flex items-center justify-center">
                                                        {thumbnail ? (
                                                            <div className="w-full h-full overflow-hidden">
                                                                <img 
                                                                    src={thumbnail} 
                                                                    alt={cs.label} 
                                                                    className="w-full h-full object-cover object-[70%_50%] origin-right scale-[1.55] group-hover/case:scale-[1.8] transition-transform duration-1000 ease-out"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-14 h-14 bg-white rounded-[1.5rem] flex items-center justify-center text-[#00B6C1] shadow-sm transform group-hover/case:rotate-12 transition-transform">
                                                                <FileText size={28} />
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0E5858]/40 via-transparent to-transparent opacity-60 group-hover/case:opacity-80 transition-opacity" />
                                                        
                                                        {/* Floating Play Indicator */}
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/case:opacity-100 transition-opacity duration-500">
                                                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                                                                <Maximize2 size={20} className="text-white" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Footer / Label */}
                                                    <div className="p-6 bg-white relative">
                                                        <div className="absolute -top-3 left-6 px-3 py-1 bg-[#00B6C1] text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg">
                                                            Lead case study
                                                        </div>
                                                        <p className="text-[14px] font-bold text-[#0E5858] leading-tight line-clamp-2 mt-2 min-h-[40px] flex items-center">{cs.label}</p>
                                                        <p className="text-[10px] font-medium text-gray-400 mt-2 flex items-center gap-1.5 font-serif italic">
                                                            View Clinical Journal →
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    {(topic.caseStudies?.length || 0) > 8 && (
                                        <div className="flex justify-center pt-4">
                                            <button
                                                onClick={() => setShowAllCaseStudies(!showAllCaseStudies)}
                                                className="group flex items-center gap-3 px-8 py-3 bg-[#FAFCEE] hover:bg-[#0E5858] text-[#0E5858] hover:text-white rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-sm hover:shadow-xl border border-[#0E5858]/10"
                                            >
                                                {showAllCaseStudies ? (
                                                    <>Show Less <ChevronUp size={16} /></>
                                                ) : (
                                                    <>Load More Case Studies ({topic.caseStudies!.length - 8} more) <ChevronDown size={16} /></>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (embedUrl && topic.layout !== 'grid') ? (
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
                                </div>
                            ) : null}
            {/* AI Simulation Overlay - CENTERED LARGE MODAL */}
            <AnimatePresence>
                {showSimulation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] bg-[#0E5858]/95 backdrop-blur-3xl flex items-center justify-center p-4 lg:p-12"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="w-full max-w-4xl h-[85vh] bg-white rounded-[3rem] shadow-4xl overflow-hidden flex flex-col relative border border-white/20"
                        >
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-[#0E5858] text-white flex items-center justify-center shadow-xl">
                                        <BrainCircuit size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-serif text-[#0E5858]">Protocol Proficiency Hub</h3>
                                        <p className="text-[10px] font-black text-[#00B6C1] uppercase tracking-widest">Live Client Simulation</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowSimulation(false);
                                        setSimulationCompleted(true);
                                    }}
                                    className="w-12 h-12 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl flex items-center justify-center transition-all shadow-sm border border-gray-100"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-hidden">
                                <AcademySimulator 
                                    topicTitle={topic.title} 
                                    topicContent={topic.content} 
                                    topicCode={topic.code}
                                    onComplete={() => {
                                        setSimulationCompleted(true);
                                        logActivity('complete_simulation', { topicCode: topic.code });
                                    }} 
                                />
                            </div>

                            <div className="p-6 bg-gray-50/50 border-t border-gray-100 text-center">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Complete the interaction to proceed to the next module</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
        </div>
    );
}
