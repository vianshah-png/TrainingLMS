"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Trophy, Star, Zap, Flame, CheckCircle2, Lock, Sparkles, Award } from "lucide-react";
import { supabase } from "@/lib/supabase";
import NutripreneurNav from "@/components/nutripreneur/NutripreneurNav";

const LEVELS = [
    { name: "Learning Stage", minXp: 0, maxXp: 500, color: '#6EE7B7' },
    { name: "Growth Advocate", minXp: 500, maxXp: 1500, color: '#60A5FA' },
    { name: "Community Leader", minXp: 1500, maxXp: 3000, color: '#5B9A8B' },
    { name: "Impact Specialist", minXp: 3000, maxXp: 5000, color: '#A78BFA' },
    { name: "Elite Nutripreneur", minXp: 5000, maxXp: 8000, color: '#FF6B35' },
    { name: "Master of Mission", minXp: 8000, maxXp: 99999, color: '#C9A84C' },
];

const BADGES = [
    { id: "b1", name: "Join the Mission", desc: "Complete your induction", icon: Star, xpRequired: 0, color: '#6EE7B7' },
    { id: "b2", name: "Content Pioneer", desc: "Access 5 program tutorials", icon: Zap, xpRequired: 250, color: '#60A5FA' },
    { id: "b3", name: "Streak Starter", desc: "Log in 3 days in a row", icon: Flame, xpRequired: 350, color: '#FF6B35' },
    { id: "b4", name: "Impact Beginner", desc: "Start Phase 1 module", icon: Trophy, xpRequired: 500, color: '#5B9A8B' },
    { id: "b5", name: "Skill Master", desc: "Complete basic influencer training", icon: Award, xpRequired: 1000, color: '#A78BFA' },
    { id: "b6", name: "Phase 1 Ace", desc: "Master 'Learn & Grow' curriculum", icon: CheckCircle2, xpRequired: 1500, color: '#FBBF24' },
    { id: "b7", name: "Mission Gold", desc: "Reach Community Leader level", icon: Star, xpRequired: 1500, color: '#C9A84C' },
    { id: "b8", name: "The Healer", desc: "Deliver 10 community impact stories", icon: Sparkles, xpRequired: 5000, color: '#5B9A8B' },
];

// SVG Progress Ring Component
function ProgressRing({ percent, size = 120, strokeWidth = 8, color = '#C9A84C' }: {
    percent: number; size?: number; strokeWidth?: number; color?: string;
}) {
    const r = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={strokeWidth}
                stroke="rgba(255,255,255,0.06)" />
            <motion.circle
                cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={strokeWidth}
                stroke={color}
                strokeLinecap="round"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
            />
        </svg>
    );
}

// Calendar heatmap — last 28 days
function StreakCalendar({ activeDays }: { activeDays: Set<string> }) {
    const days = [];
    const today = new Date();
    for (let i = 27; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        days.push(d.toDateString());
    }

    return (
        <div className="grid grid-cols-7 gap-1.5">
            {days.map((day, i) => {
                const isActive = activeDays.has(day);
                const isToday = day === today.toDateString();
                return (
                    <motion.div
                        key={day}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.01 }}
                        className="w-full aspect-square rounded-md"
                        style={{
                            background: isActive
                                ? 'linear-gradient(135deg, #C9A84C, #A8843A)'
                                : 'rgba(255,255,255,0.05)',
                            border: isToday ? '1px solid rgba(201,168,76,0.6)' : '1px solid transparent',
                            boxShadow: isActive ? '0 0 8px rgba(201,168,76,0.3)' : 'none'
                        }}
                    />
                );
            })}
        </div>
    );
}

export default function NutripreneurProgress() {
    const router = useRouter();
    const [xp, setXp] = useState(0);
    const [level, setLevel] = useState(LEVELS[0]);
    const [levelProgress, setLevelProgress] = useState(0);
    const [streak, setStreak] = useState(0);
    const [activeDays, setActiveDays] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [showConfetti, setShowConfetti] = useState(false);
    const [userName, setUserName] = useState("Nutripreneur");

    useEffect(() => {
        const init = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError || !session) { 
                    router.push('/login'); 
                    return; 
                }

                setUserName(session.user.user_metadata?.full_name?.split(' ')[0] || "Nutripreneur");

                const { data: logs, error: logsError } = await supabase
                    .from('mentor_activity_logs')
                    .select('id, created_at')
                    .eq('user_id', session.user.id)
                    .order('created_at', { ascending: false });

                if (logsError) throw logsError;

                const total = logs?.length || 0;
                const earnedXp = total * 50;
                setXp(earnedXp);

                // Determine level
                const currentLevel = LEVELS.findLast(l => earnedXp >= l.minXp) || LEVELS[0];
                setLevel(currentLevel);

                const range = currentLevel.maxXp - currentLevel.minXp;
                const withinLevel = earnedXp - currentLevel.minXp;
                setLevelProgress(Math.min(Math.round((withinLevel / range) * 100), 100));

                // Active days
                const days = new Set((logs || []).map(l => new Date(l.created_at).toDateString()));
                setActiveDays(days);
                setStreak(days.size);

                // Confetti on first visit if good progress
                if (earnedXp > 100) {
                    setTimeout(() => setShowConfetti(true), 800);
                    setTimeout(() => setShowConfetti(false), 3000);
                }
            } catch (e) {
                console.error("Progress Init Error:", e);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D2A1E' }}>
                <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
            </div>
        );
    }

    const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
    const itemVariants: Variants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

    return (
        <main className="min-h-screen pb-32 relative" style={{ background: 'linear-gradient(160deg, #0D2A1E 0%, #111E16 100%)' }}>
            {/* Confetti burst */}
            <AnimatePresence>
                {showConfetti && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
                    >
                        {Array.from({ length: 30 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 rounded-full"
                                style={{
                                    background: ['#C9A84C', '#4ADE80', '#60A5FA', '#A78BFA'][i % 4],
                                    left: `${Math.random() * 100}%`,
                                    top: '-10px'
                                }}
                                animate={{ y: '110vh', rotate: Math.random() * 720, x: (Math.random() - 0.5) * 200 }}
                                transition={{ duration: 2.5 + Math.random(), ease: "easeIn" }}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-6xl mx-auto px-5 pt-12"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="mb-8">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: 'rgba(201,168,76,0.6)' }}>Your Mission Statistics</span>
                    <h1 className="text-3xl font-serif mt-1" style={{ color: '#FAF7F0' }}>Impact Score</h1>
                </motion.div>

                {/* XP Ring + Level Card */}
                <motion.div variants={itemVariants} className="rounded-[2rem] p-6 mb-5 relative overflow-hidden flex items-center gap-6"
                    style={{ background: 'linear-gradient(135deg, #1A3A2A, #243D2E)', border: '1px solid rgba(201,168,76,0.2)' }}>
                    <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)', transform: 'translate(20%, -20%)' }} />

                    {/* Ring */}
                    <div className="relative flex-shrink-0">
                        <ProgressRing percent={levelProgress} size={110} strokeWidth={7} color={level.color} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-serif font-bold" style={{ color: '#FAF7F0' }}>{xp.toLocaleString()}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: level.color }}>XP</span>
                        </div>
                    </div>

                    {/* Level info */}
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-2"
                            style={{ background: `${level.color}20`, border: `1px solid ${level.color}40` }}>
                            <Sparkles size={9} style={{ color: level.color }} />
                            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: level.color }}>Current Level</span>
                        </div>
                        <h3 className="text-xl font-serif mb-2" style={{ color: '#FAF7F0' }}>{level.name}</h3>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${levelProgress}%` }}
                                transition={{ duration: 1.3, ease: "easeOut", delay: 0.6 }}
                                className="h-full rounded-full"
                                style={{ background: `linear-gradient(90deg, ${level.color}, rgba(255,255,255,0.8))` }}
                            />
                        </div>
                        <p className="text-[9px] mt-1.5 font-medium" style={{ color: 'rgba(250,247,240,0.3)' }}>
                            {levelProgress}% to next level
                        </p>
                    </div>
                </motion.div>

                {/* Stats Row */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mb-5">
                    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <Flame size={20} className="mb-2" style={{ color: '#FF6B35' }} />
                        <p className="text-3xl font-serif" style={{ color: '#FAF7F0' }}>{streak}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest mt-0.5" style={{ color: 'rgba(250,247,240,0.3)' }}>Active Days</p>
                    </div>
                    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <Trophy size={20} className="mb-2" style={{ color: '#C9A84C' }} />
                        <p className="text-3xl font-serif" style={{ color: '#FAF7F0' }}>
                            {BADGES.filter(b => xp >= b.xpRequired).length}
                        </p>
                        <p className="text-[9px] font-black uppercase tracking-widest mt-0.5" style={{ color: 'rgba(250,247,240,0.3)' }}>Badges Earned</p>
                    </div>
                </motion.div>

                {/* Activity Heatmap */}
                <motion.div variants={itemVariants} className="rounded-[2rem] p-5 mb-5"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2 mb-4">
                        <Flame size={14} style={{ color: '#FF6B35' }} />
                        <h3 className="text-sm font-serif" style={{ color: '#FAF7F0' }}>Activity Heatmap</h3>
                        <span className="ml-auto text-[9px] font-black uppercase tracking-widest" style={{ color: 'rgba(250,247,240,0.3)' }}>Last 28 Days</span>
                    </div>
                    <StreakCalendar activeDays={activeDays} />
                </motion.div>

                {/* Badges */}
                <motion.div variants={itemVariants} className="mb-5">
                    <h3 className="text-lg font-serif mb-4" style={{ color: '#FAF7F0' }}>Achievement Badges</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {BADGES.map((badge, i) => {
                            const earned = xp >= badge.xpRequired;
                            const Icon = badge.icon;
                            return (
                                <motion.div
                                    key={badge.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 + i * 0.06 }}
                                    className="rounded-2xl p-4 relative overflow-hidden"
                                    style={{
                                        background: earned
                                            ? `linear-gradient(135deg, ${badge.color}18, ${badge.color}08)`
                                            : 'rgba(255,255,255,0.02)',
                                        border: earned
                                            ? `1px solid ${badge.color}35`
                                            : '1px solid rgba(255,255,255,0.05)',
                                        opacity: earned ? 1 : 0.5
                                    }}
                                >
                                    {earned && (
                                        <div className="absolute top-2 right-2">
                                            <CheckCircle2 size={12} style={{ color: badge.color }} />
                                        </div>
                                    )}
                                    {!earned && (
                                        <div className="absolute top-2 right-2">
                                            <Lock size={10} style={{ color: 'rgba(250,247,240,0.2)' }} />
                                        </div>
                                    )}
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                                        style={{ background: `${badge.color}20` }}>
                                        <Icon size={18} style={{ color: earned ? badge.color : 'rgba(250,247,240,0.3)' }} />
                                    </div>
                                    <p className="text-xs font-serif mb-1 pr-4" style={{ color: earned ? '#FAF7F0' : 'rgba(250,247,240,0.4)' }}>
                                        {badge.name}
                                    </p>
                                    <p className="text-[9px] leading-relaxed" style={{ color: 'rgba(250,247,240,0.25)' }}>
                                        {badge.desc}
                                    </p>
                                    {!earned && (
                                        <p className="text-[8px] font-black mt-2 uppercase tracking-widest" style={{ color: badge.color + '60' }}>
                                            {badge.xpRequired} XP needed
                                        </p>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Level Roadmap */}
                <motion.div variants={itemVariants} className="mb-5">
                    <h3 className="text-lg font-serif mb-4" style={{ color: '#FAF7F0' }}>Level Roadmap</h3>
                    <div className="space-y-2">
                        {LEVELS.map((lvl, i) => {
                            const reached = xp >= lvl.minXp;
                            const isCurrent = level.name === lvl.name;
                            return (
                                <div key={lvl.name} className="flex items-center gap-3 p-3 rounded-xl transition-all"
                                    style={{ background: isCurrent ? `${lvl.color}12` : 'rgba(255,255,255,0.02)', border: isCurrent ? `1px solid ${lvl.color}30` : '1px solid transparent' }}>
                                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ background: reached ? lvl.color : 'rgba(255,255,255,0.1)' }} />
                                    <div className="flex-1">
                                        <p className="text-sm font-serif" style={{ color: reached ? '#FAF7F0' : 'rgba(250,247,240,0.3)' }}>
                                            {lvl.name}
                                        </p>
                                        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: lvl.color + (reached ? '' : '60') }}>
                                            {lvl.minXp.toLocaleString()} XP
                                        </p>
                                    </div>
                                    {isCurrent && (
                                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full"
                                            style={{ background: `${lvl.color}20`, color: lvl.color }}>
                                            Current
                                        </span>
                                    )}
                                    {reached && !isCurrent && (
                                        <CheckCircle2 size={14} style={{ color: lvl.color }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </motion.div>

            <NutripreneurNav />
        </main>
    );
}
