"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, User, Loader2, Sparkles, Zap, Flame, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activity";

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; icon: React.ElementType; color: string; bg: string; tagline: string }> = {
    easy: { label: 'Easy', icon: Shield, color: 'text-green-600', bg: 'bg-green-50 border-green-200', tagline: 'Friendly & Curious Client' },
    medium: { label: 'Medium', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', tagline: 'Skeptical & Price-Conscious' },
    hard: { label: 'Hard', icon: Flame, color: 'text-red-600', bg: 'bg-red-50 border-red-200', tagline: 'Aggressive & Demanding' }
};

export default function AcademySimulator({ topicTitle, topicContent, topicCode }: { topicTitle: string, topicContent: string, topicCode: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [showDifficultyPicker, setShowDifficultyPicker] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const [adminReview, setAdminReview] = useState<{ rating: number, feedback: string } | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data } = await supabase
                    .from('simulation_logs')
                    .select('chat_history, rating, admin_feedback')
                    .eq('user_id', session.user.id)
                    .eq('topic_code', topicCode)
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (data && data.length > 0) {
                    setMessages(data[0].chat_history);
                    if (data[0].rating || data[0].admin_feedback) {
                        setAdminReview({ rating: data[0].rating || 0, feedback: data[0].admin_feedback || "" });
                    }
                }
            }
        };
        fetchHistory();
    }, [topicCode]);

    const startSimulation = () => {
        setIsOpen(true);
        logActivity('start_simulation', { topicCode, contentTitle: topicTitle });
        if (messages.length === 0) {
            // Show difficulty picker first
            setShowDifficultyPicker(true);
        }
    };

    const selectDifficulty = (level: Difficulty) => {
        setDifficulty(level);
        setShowDifficultyPicker(false);

        const openerMap: Record<Difficulty, string> = {
            easy: "Hi! I saw your Instagram reels about Balance Nutrition and they look really good. I've been wanting to lose some weight and eat healthier. Can you tell me more about your programs? I'm quite open to trying something new!",
            medium: "Hey, so I found your page online. I've tried a lot of diets before — keto, intermittent fasting — and nothing really stuck. I'm not sure if another nutrition program is worth my money. What makes yours different? And how much does it cost?",
            hard: "Look, I'll be straight with you — I've wasted money on three different diet programs already and none of them worked. My friend told me to try Balance Nutrition but honestly I'm not convinced. I don't have time for complicated meal plans, I don't want to give up eating out, and I'm not paying more than ₹5000. So tell me, why should I even bother with this?"
        };

        setMessages([{
            role: 'assistant',
            content: openerMap[level]
        }]);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user' as const, content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch("/api/simulate-call", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: newMessages,
                    topicTitle,
                    topicContent,
                    difficulty: difficulty || 'medium'
                }),
            });
            const data = await response.json();
            const finalMessages = [...newMessages, { role: 'assistant' as const, content: data.content }];
            setMessages(finalMessages);

            // Save to Supabase for Admin/Buddy Review
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: existingLog } = await supabase
                    .from('simulation_logs')
                    .select('id')
                    .eq('user_id', session.user.id)
                    .eq('topic_code', topicCode)
                    .limit(1)
                    .single();

                if (existingLog) {
                    await supabase.from('simulation_logs')
                        .update({ chat_history: finalMessages })
                        .eq('id', existingLog.id);
                } else {
                    await supabase.from('simulation_logs')
                        .insert([{
                            user_id: session.user.id,
                            topic_code: topicCode,
                            chat_history: finalMessages
                        }]);
                }
            }
        } catch (error) {
            console.error("Simulation error:", error);
        } finally {
            setLoading(false);
        }
    };

    const resetSimulation = () => {
        setMessages([]);
        setDifficulty(null);
        setShowDifficultyPicker(true);
    };

    const currentConfig = difficulty ? DIFFICULTY_CONFIG[difficulty] : null;
    const DiffIcon = currentConfig?.icon || Zap;

    return (
        <div className="w-full">
            <button
                onClick={startSimulation}
                className="flex items-center gap-3 px-6 py-3 bg-[#0E5858] text-white rounded-xl text-sm font-bold hover:bg-[#00B6C1] transition-all shadow-md hover:scale-105 active:scale-95"
            >
                <MessageSquare size={16} />
                Simulated Client Chat
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-12 bg-[#0E5858]/95 backdrop-blur-xl"
                        onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 24 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 24 }}
                            transition={{ type: "spring", damping: 22, stiffness: 220 }}
                            className="w-full max-w-2xl h-[76vh] bg-white rounded-[3rem] flex flex-col overflow-hidden shadow-2xl border border-[#00B6C1]/20"
                        >
                            {/* Header */}
                            <div className="px-8 py-5 bg-[#0E5858] text-white flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[#00B6C1] flex items-center justify-center shadow-lg flex-shrink-0">
                                        <User size={22} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-lg font-serif leading-tight">Simulated Client</span>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#00B6C1] animate-pulse" />
                                            <span className="text-[10px] font-bold text-[#00B6C1] uppercase tracking-widest">
                                                {currentConfig ? `${currentConfig.label} Mode` : 'Live Practice Session'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {difficulty && (
                                        <button
                                            onClick={resetSimulation}
                                            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/10 hover:bg-white/20 transition-colors"
                                        >
                                            <DiffIcon size={10} className={currentConfig?.color || 'text-[#00B6C1]'} />
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-white/60">Change Level</span>
                                        </button>
                                    )}
                                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/10">
                                        <Sparkles size={10} className="text-[#00B6C1]" />
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/60">AI Client</span>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors border border-white/10"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6 space-y-5 bg-[#FAFCEE]/40">
                                {/* Difficulty Picker */}
                                {showDifficultyPicker && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex flex-col items-center gap-6 py-8"
                                    >
                                        <div className="text-center">
                                            <h3 className="text-2xl font-serif text-[#0E5858] mb-2">Choose Difficulty</h3>
                                            <p className="text-sm text-gray-400 font-medium">Select the type of client you'd like to practice with</p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg">
                                            {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, typeof DIFFICULTY_CONFIG['easy']][]).map(([key, config]) => {
                                                const Icon = config.icon;
                                                return (
                                                    <motion.button
                                                        key={key}
                                                        whileHover={{ y: -4, scale: 1.02 }}
                                                        whileTap={{ scale: 0.97 }}
                                                        onClick={() => selectDifficulty(key)}
                                                        className={`p-5 rounded-2xl border-2 ${config.bg} flex flex-col items-center gap-3 transition-all hover:shadow-lg cursor-pointer`}
                                                    >
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.color} bg-white shadow-sm`}>
                                                            <Icon size={24} />
                                                        </div>
                                                        <div className="text-center">
                                                            <h4 className={`text-sm font-bold ${config.color}`}>{config.label}</h4>
                                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{config.tagline}</p>
                                                        </div>
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}

                                {!showDifficultyPicker && (
                                    <>
                                        <div className="flex flex-col gap-4">
                                            <div className="flex justify-center">
                                                <div className="px-4 py-2 bg-white border border-[#0E5858]/10 rounded-full text-[9px] uppercase font-bold text-[#0E5858]/40 tracking-widest flex items-center gap-2 shadow-sm">
                                                    <Sparkles size={9} />
                                                    Respond as you would on a real consultation call
                                                </div>
                                            </div>

                                            {/* Difficulty Badge */}
                                            {currentConfig && (
                                                <div className="flex justify-center">
                                                    <div className={`px-4 py-1.5 rounded-full border text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 ${currentConfig.bg} ${currentConfig.color}`}>
                                                        <DiffIcon size={10} />
                                                        {currentConfig.label} · {currentConfig.tagline}
                                                    </div>
                                                </div>
                                            )}

                                            {adminReview && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="p-6 bg-[#0E5858] text-white rounded-[2rem] shadow-xl border border-white/10"
                                                >
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="flex items-center gap-0.5">
                                                            {[1, 2, 3, 4, 5].map(star => (
                                                                <Sparkles key={star} size={12} className={adminReview.rating >= star ? 'text-[#B8E218]' : 'text-white/20'} fill={adminReview.rating >= star ? "currentColor" : "none"} />
                                                            ))}
                                                        </div>
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Trainer Performance Rating</span>
                                                    </div>
                                                    <p className="text-sm font-medium italic leading-relaxed">"{adminReview.feedback}"</p>
                                                    <p className="text-[8px] font-black text-[#00B6C1] uppercase tracking-widest mt-4">Note from Founders / Academy Admin</p>
                                                </motion.div>
                                            )}
                                        </div>
                                        {messages.map((msg, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: msg.role === 'user' ? 16 : -16 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                {msg.role === 'assistant' && (
                                                    <div className="w-8 h-8 rounded-full bg-[#00B6C1]/10 border border-[#00B6C1]/20 flex items-center justify-center text-[#00B6C1] flex-shrink-0 mb-0.5">
                                                        <User size={14} />
                                                    </div>
                                                )}
                                                <div className={`max-w-[74%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                                    ? 'bg-[#0E5858] text-white rounded-br-sm'
                                                    : 'bg-white text-[#0E5858] border border-[#0E5858]/6 rounded-bl-sm'
                                                    }`}>
                                                    {msg.content}
                                                </div>
                                            </motion.div>
                                        ))}
                                        {loading && (
                                            <div className="flex justify-start items-end gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#00B6C1]/10 border border-[#00B6C1]/20 flex items-center justify-center text-[#00B6C1] flex-shrink-0">
                                                    <User size={14} />
                                                </div>
                                                <div className="bg-white border border-[#0E5858]/6 px-5 py-3.5 rounded-2xl rounded-bl-sm flex items-center gap-2.5 shadow-sm">
                                                    <Loader2 size={14} className="animate-spin text-[#00B6C1]" />
                                                    <span className="text-sm font-medium text-gray-400">Client is typing...</span>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Input Area */}
                            {!showDifficultyPicker && (
                                <form onSubmit={handleSend} className="px-6 py-4 bg-white border-t border-gray-100 flex items-center gap-3 flex-shrink-0">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Respond as the counsellor..."
                                        className="flex-1 bg-[#FAFCEE] border border-[#0E5858]/10 rounded-2xl py-3.5 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B6C1]/20 focus:border-[#00B6C1] transition-all"
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        disabled={!input.trim() || loading}
                                        className="w-12 h-12 bg-[#0E5858] text-white rounded-2xl flex items-center justify-center hover:bg-[#00B6C1] transition-all disabled:opacity-40 shadow-md flex-shrink-0"
                                    >
                                        <Send size={18} />
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
