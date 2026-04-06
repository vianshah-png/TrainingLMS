"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { ArrowRight, BookOpen, Play, Trophy, Zap, TrendingUp, Flame, Leaf, LogOut, Sparkles, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import NutripreneurNav from "@/components/nutripreneur/NutripreneurNav";

const CONTENT_HIGHLIGHTS = [
    { id: 1, title: "The Health Epidemic", tag: "Phase 1: Learn", videoId: "vJ7V_oT32AY", desc: "Understanding the crisis in modern India." },
    { id: 2, title: "Science of Microbiome", tag: "Academy Core", videoId: "v0vS2kXU8oM", desc: "Understanding gut health and its impact." },
    { id: 3, title: " The Healer's Gene", tag: "Skillset", videoId: "6O976H15c88", desc: "Leadership and empathy in health." },
];

export default function NutripreneurDashboard() {
    const router = useRouter();
    const [userName, setUserName] = useState("Nutripreneur");
    const [progress, setProgress] = useState(0);
    const [streak, setStreak] = useState(0);
    const [loading, setLoading] = useState(true);
    const [xp, setXp] = useState(0);
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        const init = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError || !session) { 
                    router.push('/nutripreneur/login'); 
                    return; 
                }

                if (!isMounted.current) return;
                setUserName(session.user.user_metadata?.full_name?.split(' ')[0] || "Nutripreneur");

                // Execute heavy DB queries in parallel to drastically cut loading times
                const [profileRes, progressRes] = await Promise.all([
                    supabase.from('profiles').select('role, full_name').eq('id', session.user.id).single(),
                    supabase.from('mentor_activity_logs').select('id, created_at').eq('user_id', session.user.id).order('created_at', { ascending: false })
                ]);

                if (profileRes.error || profileRes.data?.role !== 'nutripreneur') {
                    router.push('/login');
                    return;
                }

                if (!isMounted.current) return;
                const progressData = progressRes.data;

                if (!isMounted.current) return;
                const total = progressData?.length || 0;
                const earned = Math.min(Math.round((total / 20) * 100), 100);
                setProgress(earned);
                setXp(total * 50);

                // Streak: count consecutive days with activity
                const days = new Set((progressData || []).map(l =>
                    new Date(l.created_at).toDateString()
                ));
                setStreak(days.size);
            } catch (e) {
                console.error("Dashboard Init Error", e);
            } finally {
                if (isMounted.current) setLoading(false);
            }
        };
        init();
        return () => { isMounted.current = false; };
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0D2A1E, #1A3A2A)' }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(250,247,240,0.3)' }}>Loading your academy...</p>
                </div>
            </div>
        );
    }

    const BRAND_LIGHT = "#5B9A8B"; // Requested lighter green
    const BRAND_GOLD = "#C9A84C";
    const BRAND_DEEP = "#0D2A1E";

    const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } };

    return (
        <main className="min-h-screen pb-32" style={{ background: 'linear-gradient(160deg, #0D2A1E 0%, #111E16 100%)' }}>
            {/* Top ambient gradient */}
            <div className="fixed top-0 left-0 right-0 h-48 pointer-events-none -z-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 70%)' }} />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-6xl mx-auto px-5 pt-12 relative z-10"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="flex items-start justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C9A84C, #A8843A)' }}>
                                <Leaf size={14} style={{ color: '#0D2A1E' }} />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: 'rgba(201,168,76,0.7)' }}>Nutripreneur Academy</span>
                        </div>
                        <h1 className="text-4xl font-serif leading-tight" style={{ color: '#FAF7F0' }}>
                            Hello, <br />
                            <span style={{ background: `linear-gradient(135deg, ${BRAND_GOLD}, ${BRAND_LIGHT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{userName}</span>
                        </h1>
                        <p className="text-xs mt-1.5 font-medium italic" style={{ color: 'rgba(250,247,240,0.35)' }}>Join the mission to heal India.</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all mt-1"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        <LogOut size={16} style={{ color: 'rgba(250,247,240,0.4)' }} />
                    </button>
                </motion.div>

                {/* Stats Row */}
                <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3 mb-6">
                    {[
                        { label: "XP Earned", value: `${xp.toLocaleString()}`, icon: Zap, color: BRAND_GOLD },
                        { label: "Day Streak", value: `${streak}`, icon: Flame, color: '#FF6B35' },
                        { label: "Impact Score", value: `${progress}%`, icon: TrendingUp, color: BRAND_LIGHT },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="rounded-2xl p-4 text-center"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <Icon size={18} className="mx-auto mb-2" style={{ color }} />
                            <p className="text-xl font-serif" style={{ color: '#FAF7F0' }}>{value}</p>
                            <p className="text-[8px] font-black uppercase tracking-widest mt-0.5" style={{ color: 'rgba(250,247,240,0.3)' }}>{label}</p>
                        </div>
                    ))}
                </motion.div>

                {/* Hero: Continue Learning */}
                <motion.div variants={itemVariants} className="rounded-[2rem] p-6 mb-6 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #1A3A2A, #243D2E)', border: '1px solid rgba(201,168,76,0.2)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)', transform: 'translate(20%, -20%)' }} />

                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={12} style={{ color: BRAND_GOLD }} />
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: BRAND_GOLD }}>Latest Update</span>
                    </div>
                    <h2 className="text-2xl font-serif mb-2" style={{ color: '#FAF7F0' }}>Phase 1: Learn & Grow</h2>
                    <p className="text-xs mb-5 leading-relaxed" style={{ color: 'rgba(250,247,240,0.45)' }}>
                        Master the Balance Method and understand the health epidemic. Build your foundation to scale your impact.
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-5">
                        <div className="flex justify-between mb-1.5">
                            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'rgba(250,247,240,0.4)' }}>Overall Mastery</span>
                            <span className="text-[9px] font-black" style={{ color: '#C9A84C' }}>{progress}%</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
                                className="h-full rounded-full"
                                style={{ background: `linear-gradient(90deg, ${BRAND_GOLD}, ${BRAND_LIGHT})` }}
                            />
                        </div>
                    </div>

                    <button
                        onClick={() => router.push('/nutripreneur/content-bank')}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all group shadow-xl"
                        style={{ background: `linear-gradient(135deg, ${BRAND_GOLD}, #A8843A)`, color: '#0D2A1E', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}
                    >
                        Explore Curriculum
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>

                {/* Quick Access Grid */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mb-6">
                    {[
                        { label: "Curriculum", desc: "Browse training paths", icon: BookOpen, href: "/nutripreneur/content-bank", color: BRAND_LIGHT },
                        { label: "Quizzes", desc: "Test your knowledge", icon: Zap, href: "/nutripreneur/quizzes", color: BRAND_GOLD },
                        { label: "Impact", desc: "Stories of success", icon: Trophy, href: "/nutripreneur/progress", color: '#FF6B35' },
                        { label: "BN Media", desc: "Marketing assets", icon: Play, href: "/nutripreneur/reels", color: '#60A5FA' },
                    ].map(({ label, desc, icon: Icon, href, color }) => (
                        <div
                            key={label}
                            onClick={() => router.push(href)}
                            className="rounded-2xl p-4 cursor-pointer group transition-all"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all group-hover:scale-110"
                                style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                                <Icon size={18} style={{ color }} />
                            </div>
                            <p className="text-sm font-serif mb-1" style={{ color: '#FAF7F0' }}>{label}</p>
                            <p className="text-[9px] font-medium leading-relaxed" style={{ color: 'rgba(250,247,240,0.3)' }}>{desc}</p>
                        </div>
                    ))}
                </motion.div>

                {/* Recent Reels */}
                <motion.div variants={itemVariants} className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-serif" style={{ color: '#FAF7F0' }}>Recent Reels</h3>
                        <button onClick={() => router.push('/nutripreneur/reels')}
                            className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#C9A84C' }}>
                            View All
                        </button>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                        {CONTENT_HIGHLIGHTS.map((reel) => (
                            <div key={reel.id}
                                onClick={() => setSelectedVideo(reel.videoId)}
                                className="flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer group shadow-lg"
                                style={{ width: 160, height: 220, background: 'linear-gradient(160deg, #1A3A2A, #0D2A1E)', border: '1px solid rgba(201,168,76,0.15)', position: 'relative' }}>
                                <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/80 to-transparent">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-xl"
                                        style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}>
                                        <Play size={18} className="ml-0.5" style={{ color: BRAND_GOLD }} />
                                    </div>
                                    <span className="text-[8px] font-black uppercase tracking-widest mb-1" style={{ color: BRAND_LIGHT }}>{reel.tag}</span>
                                    <p className="text-xs font-serif leading-tight" style={{ color: '#FAF7F0' }}>{reel.title}</p>
                                    <p className="text-[7px] mt-1 line-clamp-2" style={{ color: 'rgba(250,247,240,0.4)' }}>{reel.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>

            {/* Video Modal Overlay */}
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
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <NutripreneurNav />
        </main>
    );
}
