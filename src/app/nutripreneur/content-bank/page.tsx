"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Play, Quote, FileText, Link as LinkIcon, Filter, ArrowRight, CheckCircle2, UserCheck, RefreshCw, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchSocialPosts, SocialPost } from "@/lib/bn-crm";
import NutripreneurNav from "@/components/nutripreneur/NutripreneurNav";

// Local curriculum fallback in case API is empty or we want to mix it
const LOCAL_FOUNDATIONS = [
    { id: 1001, title: "Mission: Heal India", postSubType: "Foundations", postType: "video", videoId: "vJ7V_oT32AY", dur: "12 min", tags: "mission, healthcare, basics", description: "Our core mission to tackle modern health epidemics through nutrition." },
    { id: 1002, title: "The Balance Method", postSubType: "Foundations", postType: "video", videoId: "v0vS2kXU8oM", dur: "18 min", tags: "science, method, core", description: "Understanding the core science behind how we help thousands." },
];

const TYPE_ICONS: Record<string, any> = {
    reel: Play,
    video: Play,
    story: UserCheck,
    quiz: CheckCircle2,
    article: FileText,
    link: LinkIcon
};

export default function NutripreneurContentBank() {
    const router = useRouter();
    const [allContent, setAllContent] = useState<any[]>([]);
    const [filteredItems, setFilteredItems] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("All");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

    const BRAND_LIGHT = "#5B9A8B";
    const BRAND_GOLD = "#C9A84C";

    const fetchContent = async () => {
        setLoading(true);
        setError(null);
        try {
            const apiRecords = await fetchSocialPosts();
            // Combine API and local
            const combined = [...LOCAL_FOUNDATIONS, ...apiRecords];
            setAllContent(combined);
            setFilteredItems(combined);
        } catch (e: any) {
            setError("Could not hydration knowledge bank. Please try again.");
            setAllContent(LOCAL_FOUNDATIONS);
            setFilteredItems(LOCAL_FOUNDATIONS);
        } finally {
            setLoading(false);
        }
    };

    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push('/login'); return; }
            if (isMounted.current) fetchContent();
        };
        checkAuth();
        return () => { isMounted.current = false; };
    }, [router]);

    // Universal Search & Filter
    useEffect(() => {
        let result = allContent;
        
        // Filter by Category
        if (activeTab !== "All") {
            result = result.filter(c => c.postSubType?.toLowerCase() === activeTab.toLowerCase());
        }

        // Universal Search
        if (search.length >= 2) {
            const term = search.toLowerCase();
            result = result.filter(c => 
                c.title?.toLowerCase().includes(term) || 
                c.description?.toLowerCase().includes(term) ||
                c.tags?.toLowerCase().includes(term) ||
                c.postSubType?.toLowerCase().includes(term)
            );
        }
        
        setFilteredItems(result);
    }, [search, activeTab, allContent]);

    // Dynamic Categories: useMemo to prevent re-calc on every render
    const categories = useMemo(() => {
        const set = new Set(allContent.map(c => c.postSubType).filter(Boolean));
        return ["All", ...Array.from(set)];
    }, [allContent]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0D2A1E]">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="animate-spin" color={BRAND_GOLD} size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Hydrating knowledge bank...</p>
                </div>
            </div>
        );
    }

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } };

    return (
        <main className="min-h-screen pb-32" style={{ background: 'linear-gradient(160deg, #0D2A1E 0%, #111E16 100%)' }}>
            <div className="w-full max-w-6xl mx-auto px-5 pt-12">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: 'rgba(201,168,76,0.6)' }}>Hub of Mastery</span>
                            <h1 className="text-3xl font-serif mt-1" style={{ color: '#FAF7F0' }}>Knowledge Central</h1>
                        </div>
                        <button onClick={fetchContent} className="items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-black tracking-widest uppercase hover:bg-white/10 transition-all hidden md:flex" style={{ color: BRAND_LIGHT }}>
                           <RefreshCw size={12} /> Refresh
                        </button>
                    </div>
                </motion.div>

                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={15} style={{ color: 'rgba(201,168,76,0.5)' }} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Universally search tags, titles, products..."
                        className="w-full py-5 pl-12 pr-4 rounded-3xl text-sm outline-none transition-all placeholder:text-neutral-600 shadow-2xl"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#FAF7F0' }}
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-6 mb-2 scrollbar-hide no-scrollbar">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveTab(cat)}
                            className="px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest flex-shrink-0 transition-all border"
                            style={{
                                background: activeTab === cat ? `linear-gradient(135deg, ${BRAND_GOLD}, #A8843A)` : 'transparent',
                                color: activeTab === cat ? '#0D2A1E' : 'rgba(250,247,240,0.5)',
                                borderColor: activeTab === cat ? 'transparent' : 'rgba(255,255,255,0.08)'
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="p-4 rounded-2xl mb-6 flex items-center gap-3 bg-red-400/5 border border-red-400/10 text-red-300 text-xs font-serif italic">
                        <XCircle size={16} /> {error}
                    </div>
                )}

                <motion.div 
                    variants={containerVariants} 
                    initial="hidden" 
                    animate="visible" 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4"
                >
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-24 col-span-full" style={{ color: 'rgba(250,247,240,0.25)' }}>
                            <Filter size={40} className="mx-auto mb-4 opacity-20" />
                            <p className="text-sm font-serif">Search didn't find anything in the vault</p>
                            <button onClick={() => { setSearch(""); setActiveTab("All"); }} className="mt-4 text-[9px] font-black uppercase tracking-widest" style={{ color: BRAND_GOLD }}>Clear filters</button>
                        </div>
                    ) : (
                        filteredItems.map((item) => {
                            const Icon = TYPE_ICONS[item.postType?.toLowerCase()] || FileText;
                            const isNew = item.id > 2000;
                            return (
                                <motion.div 
                                    key={item.id}
                                    variants={itemVariants}
                                    className="rounded-[3rem] p-8 flex flex-col gap-5 transition-all hover:bg-white/5 active:scale-[0.98] group cursor-pointer h-full relative"
                                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                                    onClick={() => {
                                        if (item.videoId) return setSelectedVideo(item.videoId);
                                        if (item.postLink) window.open(item.postLink, '_blank');
                                    }}
                                >
                                    {isNew && (
                                        <div className="absolute top-8 right-8 w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_rgba(201,168,76,0.6)]" style={{ background: BRAND_GOLD }} />
                                    )}

                                    <div className="flex items-start justify-between">
                                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105"
                                            style={{ background: 'linear-gradient(160deg, #1A3A2A, #0D2A1E)', border: '1px solid rgba(201,168,76,0.1)' }}>
                                            <Icon size={24} style={{ color: BRAND_GOLD }} className="opacity-80" />
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-1"
                                                style={{ background: `rgba(91,154,139,0.1)`, color: BRAND_LIGHT }}>
                                                {item.postSubType}
                                            </span>
                                            <span className="text-[8px] font-bold mt-1 uppercase" style={{ color: 'rgba(250,247,240,0.25)' }}>
                                                {item.postType === 'reel' ? 'Short Snippet' : (item.videoId ? 'Video Tutorial' : 'Direct Access')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-serif mb-2 leading-tight pr-4" style={{ color: '#FAF7F0' }}>{item.title}</h3>
                                        <p className="text-[11px] leading-relaxed line-clamp-3 italic opacity-60" style={{ color: 'rgba(250,247,240,0.7)' }}>
                                            {item.description || item.tags || "Access this training module to master your skill."}
                                        </p>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-1.5 mt-auto">
                                        {item.tags?.split(',').slice(0, 3).map((tag: string) => (
                                            <span key={tag} className="text-[8px] font-bold text-white/30 uppercase tracking-[0.1em]">#{tag.trim()}</span>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between pt-5 border-t border-white/5">
                                        <button className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:gap-3" style={{ color: BRAND_GOLD }}>
                                            {item.videoId ? 'Play Tutorial' : 'Open Link'} <ArrowRight size={12} />
                                        </button>
                                        <Quote size={14} className="opacity-10" color={BRAND_GOLD} />
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </motion.div>
            </div>

            {/* Universal Video Modal */}
            <AnimatePresence>
                {selectedVideo && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12 bg-black/95 backdrop-blur-3xl"
                        onClick={() => setSelectedVideo(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black border border-white/10"
                            onClick={e => e.stopPropagation()}
                        >
                            <iframe 
                                className="w-full h-full"
                                src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1&modestbranding=1&rel=0`}
                                title="Nutripreneur Education"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                            <button 
                                onClick={() => setSelectedVideo(null)}
                                className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all border border-white/10 z-10"
                            >
                                <Play size={24} style={{ transform: 'rotate(45deg)' }} color="white" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <NutripreneurNav />
        </main>
    );
}
