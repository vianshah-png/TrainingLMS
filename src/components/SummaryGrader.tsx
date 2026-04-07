"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Sparkles, Loader2, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activity";

export default function SummaryGrader({ topicTitle, topicContent, topicCode }: { topicTitle: string, topicContent: string, topicCode: string }) {
    const [summary, setSummary] = useState("");
    const [feedback, setFeedback] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [score, setScore] = useState<number | null>(null);

    const gradeSummary = async () => {
        if (!summary.trim()) return;
        setLoading(true);
        logActivity('start_quiz', { topicCode, contentTitle: topicTitle + ' (Summary)' });
        try {
            const response = await fetch("/api/grade-summary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ summary, topicTitle, topicContent }),
            });
            const data = await response.json();
            setFeedback(data.feedback);
            setScore(data.score);

            // Save to Supabase
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // Admin-level Profile Sync via API
                try {
                    await fetch('/api/auth/sync-profile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: session.user.id,
                            email: session.user.email,
                            fullName: session.user.user_metadata?.full_name
                        })
                    });
                } catch (pe) {
                    console.error("Critical Profile Sync Failure:", pe);
                }

                await supabase.from('summary_audits').insert([{
                    user_id: session.user.id,
                    topic_code: topicCode,
                    summary_text: summary,
                    ai_feedback: data.feedback,
                    score: data.score
                }]);

                // Log to activity trail
                await logActivity('complete_quiz', {
                    topicCode,
                    contentTitle: topicTitle,
                    score: data.score
                });
            }
        } catch (error) {
            console.error("Error grading summary:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            {!feedback && !loading && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-[#0E5858]/40 uppercase tracking-widest px-1">
                        <FileText size={12} />
                        Submit Manual Summary for AI Audit
                    </div>
                    <textarea
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        placeholder="Paste your learning summary here..."
                        className="w-full h-32 bg-[#FAFCEE]/50 border border-[#0E5858]/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B6C1]/20 focus:border-[#00B6C1] transition-all resize-none"
                    />
                    <button
                        onClick={gradeSummary}
                        disabled={!summary.trim()}
                        className="flex items-center gap-3 px-6 py-3 bg-[#FAFCEE] border border-[#0E5858]/10 text-[#0E5858] rounded-2xl text-xs font-bold hover:bg-[#0E5858] hover:text-white transition-all disabled:opacity-50"
                    >
                        Analyze Learning Depth
                        <Sparkles size={14} className="text-[#00B6C1]" />
                    </button>
                </div>
            )}

            {loading && (
                <div className="flex flex-col items-center gap-4 p-10 bg-[#FAFCEE] rounded-3xl border border-[#0E5858]/5">
                    <Loader2 className="animate-spin text-[#00B6C1]" size={32} />
                    <p className="text-sm font-bold text-[#0E5858]/40 uppercase tracking-widest">AI is auditing your summary...</p>
                </div>
            )}

            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-8 bg-white rounded-3xl border border-[#00B6C1]/10 shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${score && score >= 7 ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                    {score && score >= 7 ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI Audit Score</p>
                                    <p className="text-xl font-serif text-[#0E5858]">{score}/10</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setFeedback(null); setSummary(""); }}
                                className="text-xs font-bold text-[#00B6C1] hover:underline"
                            >
                                Re-submit
                            </button>
                        </div>

                        <div className="prose prose-sm prose-teal max-w-none">
                            <p className="text-sm text-gray-500 leading-relaxed italic">
                                "{feedback}"
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
