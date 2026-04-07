"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Award,
    CheckCircle2,
    ChevronRight,
    FileText,
    History,
    ShieldCheck,
    Sparkles,
    AlertCircle,
    Brain,
    Clock,
    Send
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const sections = [
    {
        title: "BN History & Culture",
        id: "history",
        questions: [
            { id: "q1", question: "When was Balance Nutrition founded?", type: "text" },
            { id: "q2", question: "Who are the founders of Balance Nutrition?", type: "text" },
            { id: "q3", question: "Name 3 awards or recognitions BN has received.", type: "text" },
            { id: "q4", question: "In which year was the official BN application launched?", type: "text" }
        ]
    },
    {
        title: "Nutrition & Program Knowledge",
        id: "academy",
        questions: [
            { id: "q5", question: "Describe what an E-kit is and its purpose.", type: "text" },
            { id: "q6", question: "Which program is specifically designed for child obesity in the website?", type: "text" },
            { id: "q7", question: "Define Health Score and how it helps a counsellor.", type: "text" },
            { id: "q8", question: "What does ICL stand for and what is its use?", type: "text" },
            { id: "q9", question: "Name 3 cleanse plans offered by BN.", type: "text" },
            { id: "q10", question: "What are the fasting window options in the Intermittent Fasting program?", type: "text" }
        ]
    },
    {
        title: "Operational & HR Protocol",
        id: "operations",
        questions: [
            { id: "q11", question: "What are the three basic requirements for getting Work From Home sanctioned?", type: "text" },
            { id: "q12", question: "How many paid leaves are granted to an employee annually?", type: "text" },
            { id: "q13", question: "How many days in advance must a planned leave be applied for?", type: "text" }
        ]
    },
    {
        title: "Sales & MIS Intelligence",
        id: "sales_mis",
        questions: [
            { id: "q14", question: "How many lead categories/stages do we have?", type: "text" },
            { id: "q15", question: "What is the difference between Fresh Leads (FL) and Relevant Leads (RL)?", type: "text" },
            { id: "q16", question: "What is the benchmark ratio for Lead to Consultation (L:C)?", type: "text" },
            { id: "q17", question: "Define a 'Lead Funnel' and its primary contents.", type: "text" },
            { id: "q18", question: "What happens when a 'Hot Lead' status is not downgraded or converted within 6 days?", type: "text" }
        ]
    }
];

export default function CertificationPage() {
    const router = useRouter();
    const [started, setStarted] = useState(false);
    const [currentSection, setCurrentSection] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [feedback, setFeedback] = useState<any>(null);

    const handleAnswerChange = (qId: string, value: string) => {
        setAnswers(prev => ({ ...prev, [qId]: value }));
    };

    const nextSection = () => {
        if (currentSection < sections.length - 1) {
            setCurrentSection(currentSection + 1);
            window.scrollTo(0, 0);
        } else {
            submitExam();
        }
    };

    const submitExam = async () => {
        setSubmitting(true);
        try {
            // Prepare payload for AI grading
            const examData = {
                candidateAnswers: answers,
                sections: sections
            };

            const response = await fetch('/api/grade-exam', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(examData)
            });

            const result = await response.json();
            setFeedback(result);

            // Save to Supabase (Custom Table for Certification)
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                await supabase.from('certification_attempts').insert([{
                    user_id: session.user.id,
                    score: result.totalScore,
                    full_feedback: result.feedback,
                    answers: answers,
                    status: result.totalScore >= 70 ? 'passed' : 'failed'
                }]);
            }

            setSubmitted(true);
        } catch (error) {
            console.error("Exam submission error:", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <main className="p-8 lg:p-12 xl:p-20 max-w-4xl mx-auto min-h-screen">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="premium-card bg-white p-12 text-center flex flex-col items-center"
                >
                    <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl ${feedback.totalScore >= 70 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                        {feedback.totalScore >= 70 ? <Award size={48} /> : <AlertCircle size={48} />}
                    </div>

                    <h1 className="text-4xl font-serif text-[#0E5858] mb-4">
                        {feedback.totalScore >= 70 ? "Certification Achieved!" : "Audit Under Review"}
                    </h1>

                    <div className="flex items-center gap-6 mb-10">
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Final Score</p>
                            <p className="text-5xl font-serif text-[#0E5858]">{feedback.totalScore}%</p>
                        </div>
                        <div className="h-12 w-px bg-gray-100"></div>
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                            <p className={`text-xl font-bold uppercase tracking-wider ${feedback.totalScore >= 70 ? 'text-green-500' : 'text-red-500'}`}>
                                {feedback.totalScore >= 70 ? "Expert" : "Needs Revision"}
                            </p>
                        </div>
                    </div>

                    <div className="w-full text-left bg-[#FAFCEE] p-8 rounded-3xl border border-[#0E5858]/5 mb-8">
                        <h3 className="text-xs font-bold text-[#0E5858] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Sparkles size={14} className="text-[#00B6C1]" />
                            Expert Auditor Feedback
                        </h3>
                        <div className="prose prose-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {feedback.feedback}
                        </div>
                    </div>

                    <button
                        onClick={() => router.push('/')}
                        className="px-10 py-4 bg-[#0E5858] text-white font-bold rounded-2xl shadow-xl hover:bg-[#00B6C1] transition-all"
                    >
                        Return to Dashboard
                    </button>
                </motion.div>
            </main>
        );
    }

    if (!started) {
        return (
            <main className="p-8 lg:p-12 xl:p-20 max-w-5xl mx-auto min-h-screen">
                <header className="mb-16 text-center">
                    <div className="inline-flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-[#0E5858]/10 shadow-sm mb-6">
                        <Award className="text-[#FFCC00]" size={20} />
                        <span className="text-[10px] font-bold text-[#0E5858] uppercase tracking-[0.2em]">Academy Master Certification</span>
                    </div>
                    <h1 className="text-6xl font-serif text-[#0E5858] tracking-tight leading-tight">
                        The Final <span className="text-[#00B6C1]">Audit</span>
                    </h1>
                    <p className="text-gray-400 mt-6 max-w-2xl mx-auto text-lg">
                        This is the comprehensive assessment for Balance Nutrition Counselors. We will evaluate your knowledge of culture, nutrition protocols, and operations.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {[
                        { icon: FileText, title: "45 Questions", desc: "Covers History, Nutrition & MIS" },
                        { icon: Clock, title: "Un-timed", desc: "Take your time for quality depth" },
                        { icon: Brain, title: "AI Graded", desc: "Real-time auditing of your logic" }
                    ].map((idx, i) => (
                        <div key={i} className="premium-card bg-white p-8 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-[#FAFCEE] flex items-center justify-center text-[#0E5858] mb-6">
                                <idx.icon size={28} />
                            </div>
                            <h3 className="text-lg font-bold text-[#0E5858] mb-2">{idx.title}</h3>
                            <p className="text-xs text-gray-400 leading-relaxed">{idx.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={() => setStarted(true)}
                        className="group relative px-12 py-5 bg-[#0E5858] text-white font-bold rounded-[2rem] shadow-2xl hover:bg-[#00B6C1] transition-all duration-500 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <span className="relative z-10 flex items-center gap-3">
                            Initialize Certification <ChevronRight size={18} />
                        </span>
                    </button>
                </div>
            </main>
        );
    }

    const currentSectionData = sections[currentSection];

    return (
        <main className="p-8 lg:p-12 xl:p-20 max-w-4xl mx-auto min-h-screen">
            <div className="mb-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#0E5858] flex items-center justify-center text-white shadow-xl">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Section {currentSection + 1} of {sections.length}</p>
                            <h2 className="text-2xl font-serif text-[#0E5858]">{currentSectionData.title}</h2>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-[#0E5858]/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
                        className="h-full bg-gradient-to-r from-[#00B6C1] to-[#0E5858]"
                    />
                </div>
            </div>

            <div className="space-y-12 mb-16">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSection}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-10"
                    >
                        {currentSectionData.questions.map((q, idx) => (
                            <div key={q.id} className="premium-card bg-white p-10 hover:shadow-2xl transition-all border border-transparent hover:border-[#00B6C1]/20">
                                <div className="flex items-start gap-6">
                                    <div className="w-10 h-10 rounded-xl bg-[#FAFCEE] flex items-center justify-center text-[#0E5858] font-bold text-sm shrink-0">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-lg text-[#0E5858] font-medium mb-6 leading-relaxed">
                                            {q.question}
                                        </h4>
                                        <textarea
                                            value={answers[q.id] || ""}
                                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                            placeholder="Provide your professional detailed answer here..."
                                            className="w-full h-32 bg-[#FAFCEE]/30 border border-[#0E5858]/5 rounded-2xl p-6 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B6C1]/20 focus:border-[#00B6C1] transition-all resize-none placeholder:text-gray-300"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="flex items-center justify-between pt-10 border-t border-[#0E5858]/5">
                <div className="flex items-center gap-3 text-gray-400">
                    <ShieldCheck size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Secure Certification Session</span>
                </div>

                <button
                    onClick={nextSection}
                    disabled={submitting}
                    className="px-10 py-4 bg-[#0E5858] text-white font-bold rounded-2xl shadow-xl hover:bg-[#00B6C1] transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Auditing Answers...</span>
                        </>
                    ) : (
                        <>
                            {currentSection === sections.length - 1 ? "Complete Final Audit" : "Save & Next Section"}
                            <ChevronRight size={18} />
                        </>
                    )}
                </button>
            </div>
        </main>
    );
}
