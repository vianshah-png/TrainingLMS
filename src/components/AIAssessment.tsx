"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, CheckCircle2, ChevronRight, Loader2, Lock, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Question {
    question: string;
    options: string[];
    correctAnswer: string;
}

interface AIAssessmentProps {
    topicTitle: string;
    topicContent: string;
    topicCode: string;
    onComplete?: () => void;
}

export default function AIAssessment({ topicTitle, topicContent, topicCode, onComplete }: AIAssessmentProps) {
    const [questions, setQuestions] = useState<Question[] | null>(null);
    const [answerToken, setAnswerToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const [showResult, setShowResult] = useState(false);
    const [finalScoreStats, setFinalScoreStats] = useState<{ score: number, total: number, results?: any[] } | null>(null);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes default

    useEffect(() => {
        if (!questions || showResult) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [questions, showResult]);

    const handleAutoSubmit = () => {
        // Fill remaining answers with empty string and submit
        const unansweredCount = (questions?.length || 0) - answers.length;
        const finalAnswers = [...answers, ...Array(unansweredCount).fill("")];
        submitAudit(finalAnswers);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const generateTest = async () => {
        setLoading(true);
        try {
            // Find links related to this topic from syllabusData if possible. Since we don't have direct access here easily,
            // we will just pull it based on topicCode if we import syllabusData, but it's okay to just pass what we have
            const response = await fetch("/api/generate-test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topicTitle, topicContent, topicLinks: "" }),
            });
            const data = await response.json();
            setQuestions(data.questions);
            setAnswerToken(data.answerToken);
            setCurrentStep(0);
            setAnswers([]);
            setShowResult(false);
            setTimeLeft(600); // Reset timer
        } catch (error) {
            console.error("Error generating test:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = async (option: string) => {
        const newAnswers = [...answers, option];
        setAnswers(newAnswers);

        if (currentStep < (questions?.length || 0) - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            submitAudit(newAnswers);
        }
    };

    const submitAudit = async (finalAnswers: string[]) => {
        setLoading(true);
        try {
            // Secure Grading via Backend
            const gradeResponse = await fetch("/api/grade-exam", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answerToken, userAnswers: finalAnswers })
            });

            const gradeData = await gradeResponse.json();
            if (gradeData.error) throw new Error(gradeData.error);

            const finalScore = gradeData.score;
            setFinalScoreStats({ score: finalScore, total: gradeData.total, results: gradeData.results });

            // Save to Supabase
            const { data: { session } } = await supabase.auth.getSession();
            if (session && questions) {
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

                const { error: insertError } = await supabase.from('assessment_logs').insert([{
                    user_id: session.user.id,
                    topic_code: topicCode,
                    score: finalScore,
                    total_questions: gradeData.total,
                    raw_data: { questions, answers: finalAnswers, gradedResults: gradeData.results, time_spent: 600 - timeLeft }
                }]);

                if (insertError) throw new Error(`Database save failed: ${insertError.message}`);
            }

            setShowResult(true);
            if (onComplete) {
                onComplete();
            }
        } catch (error) {
            console.error("Failed to submit and grade audit:", error);
            alert("Failed to grade the assessment. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            {!questions && !loading && !showResult && (
                <button
                    onClick={generateTest}
                    disabled={loading}
                    className="group w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-[#FAFCEE] border border-[#00B6C1]/20 text-[#0E5858] rounded-xl text-[11px] font-bold hover:bg-[#00B6C1] hover:text-white transition-all shadow-sm"
                >
                    <Brain size={16} className="text-[#00B6C1] group-hover:text-white transition-colors" />
                    Start Retention Check
                    <Sparkles size={14} className="animate-pulse" />
                </button>
            )}

            {loading && (
                <div className="flex flex-col items-center justify-center gap-3 p-6 bg-[#FAFCEE] rounded-2xl border border-[#00B6C1]/10 text-center">
                    <Loader2 className="animate-spin text-[#00B6C1]" size={24} />
                    <p className="text-[10px] font-bold text-[#0E5858]/60 uppercase tracking-widest">Generating Scenarios...</p>
                </div>
            )}

            <AnimatePresence mode="wait">
                {questions && !showResult && (
                    <motion.div
                        key="question"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-5 bg-white rounded-2xl shadow-xl border border-[#00B6C1]/10 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-5">
                            <Brain size={60} />
                        </div>

                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="badge-teal text-[9px] mb-1">Question {currentStep + 1} of {questions.length}</span>
                                <div className="flex items-center gap-2 text-[#0E5858]/40 font-bold text-[10px]">
                                    <Clock size={12} className={timeLeft < 60 ? 'text-red-500 animate-pulse' : ''} />
                                    <span className={timeLeft < 60 ? 'text-red-500' : ''}>{formatTime(timeLeft)} Remaining</span>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                {questions.map((_, i) => (
                                    <div key={i} className={`w-6 h-1 rounded-full ${i <= currentStep ? 'bg-[#00B6C1]' : 'bg-gray-100'}`}></div>
                                ))}
                            </div>
                        </div>

                        <h4 className="text-base font-serif text-[#0E5858] mb-4 leading-snug">{questions[currentStep].question}</h4>

                        <div className="space-y-2.5">
                            {questions[currentStep].options.map((option, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(option)}
                                    className="w-full p-3.5 text-left bg-[#FAFCEE]/50 border border-[#0E5858]/5 rounded-xl hover:border-[#00B6C1] hover:bg-white transition-all text-xs font-medium group flex items-start gap-2.5"
                                >
                                    <div className="shrink-0 w-5 h-5 rounded-lg bg-white border border-[#0E5858]/10 flex items-center justify-center text-[9px] font-bold text-[#00B6C1] group-hover:bg-[#00B6C1] group-hover:text-white transition-all mt-0.5">
                                        {String.fromCharCode(65 + i)}
                                    </div>
                                    <span className="text-gray-600 group-hover:text-[#0E5858] leading-tight">{option}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {showResult && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-8 bg-[#FAFCEE] rounded-[2.5rem] border-2 border-[#00B6C1]/20 shadow-xl"
                    >
                        {/* Score Header */}
                        <div className="text-center mb-8">
                            <div className="w-24 h-24 mx-auto mb-6 relative">
                                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="#0E5858" strokeWidth="6" opacity="0.1" />
                                    <circle
                                        cx="50" cy="50" r="42" fill="none"
                                        stroke={finalScoreStats && (finalScoreStats.score / finalScoreStats.total) >= 0.7 ? '#00B6C1' : (finalScoreStats && (finalScoreStats.score / finalScoreStats.total) >= 0.4 ? '#FFCC00' : '#FF5733')}
                                        strokeWidth="6"
                                        strokeLinecap="round"
                                        strokeDasharray={`${((finalScoreStats?.score || 0) / (finalScoreStats?.total || 1)) * 264} 264`}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-black text-[#0E5858]">{finalScoreStats?.score || 0}</span>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">/ {finalScoreStats?.total || 0}</span>
                                </div>
                            </div>
                            <h3 className="text-2xl font-serif text-[#0E5858] mb-2">
                                {finalScoreStats && (finalScoreStats.score / finalScoreStats.total) >= 0.7 ? 'Excellent Work!' : (finalScoreStats && (finalScoreStats.score / finalScoreStats.total) >= 0.4 ? 'Keep Practicing!' : 'Needs Improvement')}
                            </h3>
                            <p className="text-[10px] font-black text-[#00B6C1] uppercase tracking-[0.3em]">
                                {finalScoreStats ? Math.round((finalScoreStats.score / finalScoreStats.total) * 100) : 0}% Score · Assessment Logged
                            </p>
                        </div>

                        {/* Answer Key */}
                        {finalScoreStats?.results && finalScoreStats.results.length > 0 && (
                            <div className="space-y-4 mb-8">
                                <h4 className="text-[10px] font-black text-[#0E5858] uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Sparkles size={12} className="text-[#00B6C1]" />
                                    Answer Key & Review
                                </h4>
                                {finalScoreStats.results.map((result: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className={`p-5 rounded-2xl border-2 transition-all ${result.isCorrect
                                            ? 'bg-green-50/50 border-green-200/50'
                                            : 'bg-red-50/50 border-red-200/50'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${result.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                                                {result.isCorrect ? <CheckCircle2 size={14} /> : <span className="text-xs font-black">✗</span>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-[#0E5858] leading-snug mb-1">Q{idx + 1}. {result.question}</p>
                                                <div className="text-[9px] font-bold uppercase tracking-widest mb-2">
                                                    <span className={result.isCorrect ? 'text-green-600' : 'text-red-500'}>
                                                        {result.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="ml-10 space-y-2">
                                            {/* User's Answer */}
                                            <div className="flex items-start gap-2">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest shrink-0 mt-0.5 w-20">Your Answer</span>
                                                <span className={`text-xs font-medium leading-relaxed ${result.isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                                                    {result.providedAnswer || '(No answer provided)'}
                                                </span>
                                            </div>

                                            {/* Correct Answer (only show if wrong) */}
                                            {!result.isCorrect && (
                                                <div className="flex items-start gap-2">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest shrink-0 mt-0.5 w-20">Correct</span>
                                                    <span className="text-xs font-semibold text-green-700 leading-relaxed bg-green-50 px-2 py-0.5 rounded-md">
                                                        {result.correctAnswer}
                                                    </span>
                                                </div>
                                            )}

                                            {/* AI Feedback for text answers */}
                                            {result.aiFeedback && (
                                                <div className="flex items-start gap-2 mt-1">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest shrink-0 mt-0.5 w-20">AI Note</span>
                                                    <span className="text-[11px] text-gray-500 italic leading-relaxed">
                                                        {result.aiFeedback}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Footer */}
                        <div className="text-center">
                            <div className="inline-flex items-center gap-3 px-8 py-3 bg-[#0E5858] text-white rounded-[1.2rem] text-xs font-bold shadow-2xl cursor-default">
                                <CheckCircle2 size={14} className="text-[#00B6C1]" />
                                Synced with Admin Dashboard
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
