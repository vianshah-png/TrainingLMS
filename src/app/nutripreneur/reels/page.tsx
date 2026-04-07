"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ChevronLeft, 
    Play, 
    Volume2, 
    VolumeX, 
    Bookmark, 
    Share2, 
    MoreVertical,
    Clock,
    RefreshCw
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchSocialPosts, SocialPost } from "@/lib/bn-crm";

const LOCAL_REELS = [
    { 
        id: "l1", 
        title: "The Health Epidemic in India", 
        postSubType: "Mission Foundations", 
        duration: "0:45", 
        videoId: "vJ7V_oT32AY",
        gradient: "linear-gradient(160deg, #1A3A2A 0%, #0D2A1E 100%)",
        desc: "A deep dive into why India's health is at a tipping point."
    },
    { 
        id: "l2", 
        title: "The Science of Gut Health", 
        postSubType: "Health Science", 
        duration: "0:50", 
        videoId: "v0vS2kXU8oM",
        gradient: "linear-gradient(160deg, #2A1A1A 0%, #1A0D0D 100%)",
        desc: "Essential nutrition science for every Nutripreneur."
    },
];

export default function NutripreneurReels() {
    const router = useRouter();
    const [reels, setReels] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [bookmarked, setBookmarked] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(true);

    const BRAND_GOLD = "#C9A84C";
    const BRAND_LIGHT = "#5B9A8B";

    const loadData = async () => {
        setLoading(true);
        try {
            const apiData = await fetchSocialPosts();
            const apiReels = apiData.filter(r => r.postType === 'reel' && r.videoId);
            const combined = [...LOCAL_REELS, ...apiReels];
            setReels(combined);
        } catch (e) {
            setReels(LOCAL_REELS);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push('/login'); return; }
            loadData();
        };
        checkAuth();
    }, [router]);

    // Simple progress simulation
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying && reels.length > 0) {
            interval = setInterval(() => {
                setProgress(p => {
                    if (p >= 100) return 0;
                    return p + 0.5;
                });
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isPlaying, currentIndex, reels]);

    const goToReel = (index: number) => {
        if (index >= 0 && index < reels.length) {
            setCurrentIndex(index);
            setProgress(0);
            setIsPlaying(true);
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-full bg-black flex items-center justify-center">
                <RefreshCw className="animate-spin" color={BRAND_GOLD} size={30} />
            </div>
        );
    }

    if (reels.length === 0) return null;

    const current = reels[currentIndex];

    return (
        <main className="h-screen w-full bg-black overflow-hidden flex flex-col items-center justify-center">
            <div className="relative w-full h-full max-w-sm mx-auto overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.9)] border-x border-white/5">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current.id || currentIndex}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        className="absolute inset-0"
                        style={{ background: current.gradient || 'linear-gradient(160deg, #1A1A1A 0%, #000 100%)' }}
                    >
                        {/* Video Mock/Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-[2.5rem]">
                            {isPlaying ? (
                                <iframe 
                                    className="w-full h-full object-cover scale-[1.5]"
                                    src={`https://www.youtube.com/embed/${current.videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&modestbranding=1&loop=1&playlist=${current.videoId}`}
                                    title={current.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                ></iframe>
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    <Play size={80} style={{ color: BRAND_GOLD }} className="opacity-10" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Paused</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                        </div>

                        {/* Top Bar */}
                        <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-20"
                            style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)' }}>
                            <button onClick={() => router.push('/nutripreneur')} className="w-10 h-10 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md border border-white/10">
                                <ChevronLeft size={20} color="#FAF7F0" />
                            </button>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border border-white/20 text-white"
                                    style={{ background: 'rgba(91,154,139,0.2)' }}>
                                    {current.postSubType || current.tag}
                                </span>
                            </div>
                        </div>

                        {/* Interaction Overlay */}
                        <div className="absolute inset-0 z-10" onClick={() => setIsPlaying(!isPlaying)} />

                        {/* Right Sidebar Actions */}
                        <div className="absolute right-4 bottom-40 flex flex-col gap-6 items-center z-20">
                            {[
                                { icon: isMuted ? VolumeX : Volume2, label: isMuted ? "Unmute" : "Mute", action: () => setIsMuted(!isMuted) },
                                { 
                                    icon: Bookmark, 
                                    label: "Save", 
                                    active: bookmarked.includes(current.id),
                                    action: () => setBookmarked(prev => prev.includes(current.id) ? prev.filter(id => id !== current.id) : [...prev, current.id])
                                },
                                { icon: Share2, label: "Share", action: () => {} },
                                { icon: MoreVertical, label: "More", action: () => {} },
                            ].map((btn, i) => (
                                <div key={i} className="flex flex-col items-center">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); btn.action(); }}
                                        className="w-12 h-12 rounded-full flex items-center justify-center transition-all bg-black/30 backdrop-blur-sm border border-white/10"
                                        style={{ color: btn.active ? BRAND_GOLD : '#FAF7F0' }}
                                    >
                                        <btn.icon size={22} fill={btn.active ? BRAND_GOLD : 'none'} />
                                    </button>
                                    <span className="text-[9px] mt-1 font-bold uppercase tracking-tighter text-white/60">{btn.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Bottom Info Section */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 pb-12 z-20"
                            style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)' }}>
                            
                            {/* Progress Ring / Bar */}
                            <div className="w-full h-1 bg-white/10 rounded-full mb-6 overflow-hidden">
                                <motion.div 
                                    className="h-full" 
                                    style={{ width: `${progress}%`, background: BRAND_GOLD }} 
                                />
                            </div>

                            <div className="flex flex-col gap-1 max-w-[80%]">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-1 h-4 rounded-full" style={{ background: BRAND_GOLD }} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50 flex items-center gap-1">
                                        <Clock size={10} /> 30s
                                    </span>
                                </div>
                                <h2 className="text-2xl font-serif text-[#FAF7F0] leading-tight mb-2 uppercase">{current.title}</h2>
                                <p className="text-[11px] text-white/60 leading-relaxed font-medium line-clamp-2 italic">
                                    "{current.description || current.desc}"
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Vertical Navigation Area */}
                <div className="absolute inset-y-0 right-0 w-16 z-30 pointer-events-none flex flex-col justify-center gap-4 pr-1">
                    {reels.map((_, i) => (
                        <div key={i} 
                            onClick={() => goToReel(i)}
                            className="pointer-events-auto h-8 w-1 cursor-pointer transition-all rounded-full"
                            style={{ 
                                background: i === currentIndex ? BRAND_GOLD : 'rgba(255,255,255,0.2)',
                                transform: i === currentIndex ? 'scaleX(2.5)' : 'none'
                            }}
                        />
                    ))}
                </div>
            </div>
        </main>
    );
}
