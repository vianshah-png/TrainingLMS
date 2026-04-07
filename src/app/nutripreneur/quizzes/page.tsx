"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Zap, Trophy, Clock, CheckCircle2, RefreshCcw, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import NutripreneurNav from "@/components/nutripreneur/NutripreneurNav";

const DUMMY_QUIZZES = [
    { 
        id: "q1", 
        title: "The Balance Method", 
        module: "Foundations", 
        quesCount: 10, 
        time: "5 min", 
        xp: 150, 
        completed: true, 
        score: 90 
    },
    { 
        id: "q2", 
        title: "Micro-Community Setup", 
        module: "Phase 2: Growth", 
        quesCount: 8, 
        time: "4 min", 
        xp: 120, 
        completed: false 
    },
    { 
        id: "q3", 
        title: "Phone Mastery Quiz", 
        module: "Skills Mastery", 
        quesCount: 12, 
        time: "6 min", 
        xp: 200, 
        completed: false 
    },
];

export default function NutripreneurQuizzes() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    const BRAND_GOLD = "#C9A84C";
    const BRAND_LIGHT = "#5B9A8B";

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push('/login'); return; }
            setLoading(false);
        };
        init();
    }, [router]);

    if (loading) return null;

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } };

    return (
        <main className="min-h-screen pb-32" style={{ background: 'linear-gradient(160deg, #0D2A1E 0%, #111E16 100%)' }}>
            <div className="w-full max-w-6xl mx-auto px-5 pt-12">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8 overflow-visible">
                    <button onClick={() => router.push('/nutripreneur')} className="p-2 -ml-2 mb-4 rounded-full hover:bg-white/5 transition-all w-max flex">
                        <ChevronLeft size={20} color={BRAND_GOLD} />
                    </button>
                    <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: 'rgba(201,168,76,0.6)' }}>Skill Verification</span>
                    <h1 className="text-3xl font-serif mt-1" style={{ color: '#FAF7F0' }}>Academy Quizzes</h1>
                    <div className="mt-4 flex gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                            <Trophy size={14} style={{ color: BRAND_GOLD }} />
                            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-none">1,240 Total XP</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                            <CheckCircle2 size={14} style={{ color: BRAND_LIGHT }} />
                            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-none">4/12 Passed</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div 
                    variants={containerVariants} 
                    initial="hidden" 
                    animate="visible" 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {DUMMY_QUIZZES.map((quiz) => (
                        <motion.div 
                            key={quiz.id}
                            variants={itemVariants}
                            className="rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl"
                            style={{ 
                                background: 'rgba(255,255,255,0.03)', 
                                border: '1px solid rgba(255,255,255,0.06)',
                                boxShadow: quiz.completed ? `0 10px 40px -10px rgba(91,154,139,0.1)` : '0 10px 40px -10px rgba(0,0,0,0.3)'
                            }}
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Zap size={80} color={BRAND_GOLD} />
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: quiz.completed ? BRAND_LIGHT : BRAND_GOLD }} />
                                    <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: quiz.completed ? BRAND_LIGHT : BRAND_GOLD }}>{quiz.module}</span>
                                </div>
                                
                                <h3 className="text-xl font-serif text-[#FAF7F0] mb-6">{quiz.title}</h3>
                                
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-white/40">
                                        <Clock size={12} /> {quiz.time}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-white/40">
                                        <CheckCircle2 size={12} /> {quiz.quesCount} Ques
                                    </div>
                                </div>

                                {quiz.completed ? (
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black uppercase text-white/30 tracking-widest mb-1">Score Achieved</span>
                                            <span className="text-2xl font-serif" style={{ color: BRAND_LIGHT }}>{quiz.score}%</span>
                                        </div>
                                        <button className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                                            <RefreshCcw size={14} color="#FAF7F0" />
                                        </button>
                                    </div>
                                ) : (
                                    <button className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 hover:gap-3"
                                        style={{ background: `linear-gradient(135deg, ${BRAND_GOLD}, #8B6E2F)`, color: '#0D2A1E' }}>
                                        Start Quiz <ArrowRight size={14} />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            <NutripreneurNav />
        </main>
    );
}
