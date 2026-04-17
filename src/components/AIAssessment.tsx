"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, CheckCircle2, ChevronRight, Loader2, Lock, Clock, GraduationCap, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { syllabusData } from "@/data/syllabus";
import { getAccessibleModuleIds } from "@/lib/moduleAccess";
import { logActivity } from "@/lib/activity";
import TrainingCertificate from "@/components/TrainingCertificate";

interface Question {
    question: string;
    options: string[];
    correctAnswer: string;
    type?: string;
}

interface AIAssessmentProps {
    topicTitle: string;
    topicContent: string;
    topicCode: string;
    onComplete?: () => void;
    onClose?: () => void;
}

export default function AIAssessment({ topicTitle, topicContent, topicCode, onComplete, onClose }: AIAssessmentProps) {
    const [questions, setQuestions] = useState<Question[] | null>(null);
    const [answerToken, setAnswerToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const [textAnswer, setTextAnswer] = useState("");
    const [showResult, setShowResult] = useState(false);
    const [finalScoreStats, setFinalScoreStats] = useState<{ score: number, total: number, results?: any[] } | null>(null);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes default
    const [isTrainingComplete, setIsTrainingComplete] = useState(false);
    const [certificateData, setCertificateData] = useState<{ userName: string; completionDate: string; certificateId: string } | null>(null);
    const [emailSent, setEmailSent] = useState(false);
    const router = useRouter();

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
                body: JSON.stringify({ topicTitle, topicContent, topicCode, topicLinks: "" }),
            });
            const data = await response.json();
            setQuestions(data.questions);
            setAnswerToken(data.answerToken);
            setCurrentStep(0);
            setAnswers([]);
            setTextAnswer("");
            setShowResult(false);
            setTimeLeft(600); // Reset timer
            
            // Log activity
            logActivity('start_quiz', { topicCode: topicCode, contentTitle: topicTitle });
        } catch (error) {
            console.error("Error generating test:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = async (option: string) => {
        const newAnswers = [...answers, option];
        setAnswers(newAnswers);
        setTextAnswer("");

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
            if (!session) throw new Error("Session required to grade exam");

            if (questions) {
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

                // ─── Mark Topic as Completed in mentor_progress ───
                // This ensures the dashboard progress bars reflect the quiz completion
                const { error: progressError } = await supabase
                    .from('mentor_progress')
                    .upsert({ 
                        user_id: session.user.id, 
                        topic_code: topicCode,
                        completed_at: new Date().toISOString()
                    }, { onConflict: 'user_id, topic_code' });

                if (progressError) console.error("Progress upsert failed:", progressError.message);

                // Log activity
                logActivity('complete_quiz', { 
                    topicCode: topicCode, 
                    contentTitle: topicTitle,
                    score: finalScore,
                    metadata: { total: gradeData.total, percent: (finalScore / gradeData.total) * 100 }
                });
            }

            setShowResult(true);
            if (onComplete) {
                onComplete();
            }

            // ─── Training Completion Check ───────────────────────────────
            // After saving the quiz, check if ALL accessible modules are now done
            try {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('role, allowed_modules')
                    .eq('id', session.user.id)
                    .single();

                const role = profileData?.role || 'counsellor';
                const allowedMods = profileData?.allowed_modules || [];
                const accessIds = getAccessibleModuleIds(role, allowedMods);

                // Fetch all completed topic codes
                const { data: progress } = await supabase
                    .from('mentor_progress')
                    .select('topic_code')
                    .eq('user_id', session.user.id);

                const completedCodes = new Set(progress?.map(p => p.topic_code) || []);

                // Calculate total accessible topics vs completed
                const accessibleModules = syllabusData.filter(m => m.id !== 'resource-bank' && accessIds.includes(m.id));
                const totalAccessibleTopics = accessibleModules.reduce((acc, m) => acc + m.topics.length, 0);
                
                const completedAccessibleTopics = accessibleModules.reduce((acc, m) => {
                    const completedInModule = m.topics.filter(t => completedCodes.has(t.code)).length;
                    return acc + completedInModule;
                }, 0);

                const progressPercentage = totalAccessibleTopics > 0 ? (completedAccessibleTopics / totalAccessibleTopics) : 0;

                // Trigger if >= 80% complete
                if (progressPercentage >= 0.8) {
                    localStorage.setItem('educators_discovery_pending', 'true');
                    setIsTrainingComplete(true);

                    // Generate certificate data
                    const userName = session.user.user_metadata?.full_name || 'Counsellor';
                    const now = new Date();
                    const completionDate = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                    const certId = `BN-${now.getFullYear()}-${session.user.id.substring(0, 8).toUpperCase()}`;
                    
                    setCertificateData({ userName, completionDate, certificateId: certId });

                    // Send certificate email automatically
                    try {
                        const emailRes = await fetch('/api/send-certificate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId: session.user.id,
                                userName,
                                userEmail: session.user.email,
                                completionDate,
                                certificateId: certId
                            })
                        });
                        if (emailRes.ok) setEmailSent(true);
                    } catch (emailErr) {
                        console.warn('Certificate email dispatch failed:', emailErr);
                    }
                }
            } catch (e) {
                // Non-critical — don't block quiz results
                console.warn('Training completion check failed:', e);
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
                            {questions[currentStep].type === 'text' ? (
                                <div className="space-y-4">
                                    <textarea
                                        value={textAnswer}
                                        onChange={(e) => setTextAnswer(e.target.value)}
                                        placeholder="Type your answer here..."
                                        className="w-full p-4 text-sm bg-[#FAFCEE]/50 border border-[#0E5858]/10 rounded-xl focus:border-[#00B6C1] outline-none min-h-[120px] transition-all"
                                    />
                                    <button
                                        onClick={() => handleAnswer(textAnswer)}
                                        disabled={!textAnswer.trim()}
                                        className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${!textAnswer.trim() ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#0E5858] text-white hover:bg-[#00B6C1] shadow-md hover:-translate-y-0.5'}`}
                                    >
                                        Submit Answer <ChevronRight size={16} />
                                    </button>
                                </div>
                            ) : (
                                questions[currentStep].options?.map((option, i) => (
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
                                ))
                            )}
                        </div>
                    </motion.div>
                )}

                {showResult && (
                    /* Full-screen modal overlay — stays until user clicks close */
                    <motion.div
                        key="result-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-[#0E5858]/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="relative bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl my-8"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => {
                                    setShowResult(false);
                                    if (onClose) onClose();
                                }}
                                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all z-10"
                                title="Close Results"
                            >
                                <Lock size={16} />
                            </button>

                            <div className="p-8">
                                {/* Score Header */}
                                <div className="text-center mb-8">
                                    <p className="text-[10px] font-black text-[#00B6C1] uppercase tracking-[0.3em] mb-4">Assessment Complete</p>
                                    <div className="w-28 h-28 mx-auto mb-6 relative">
                                        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="42" fill="none" stroke="#0E5858" strokeWidth="6" opacity="0.1" />
                                            <circle
                                                cx="50" cy="50" r="42" fill="none"
                                                stroke={finalScoreStats && (finalScoreStats.score / finalScoreStats.total) >= 0.7 ? '#00B6C1' : (finalScoreStats && (finalScoreStats.score / finalScoreStats.total) >= 0.4 ? '#F59E0B' : '#EF4444')}
                                                strokeWidth="6"
                                                strokeLinecap="round"
                                                strokeDasharray={`${((finalScoreStats?.score || 0) / (finalScoreStats?.total || 1)) * 264} 264`}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-3xl font-black text-[#0E5858]">{finalScoreStats?.score || 0}</span>
                                            <span className="text-[9px] font-bold text-gray-400 uppercase">/ {finalScoreStats?.total || 0}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-serif text-[#0E5858] mb-2">
                                        {finalScoreStats && (finalScoreStats.score / finalScoreStats.total) >= 0.7
                                            ? '🎉 Excellent Work!'
                                            : finalScoreStats && (finalScoreStats.score / finalScoreStats.total) >= 0.4
                                            ? '📚 Keep Practicing!'
                                            : '⚡ Needs Improvement'}
                                    </h3>
                                    <p className="text-[10px] font-black text-[#00B6C1] uppercase tracking-[0.3em]">
                                        {finalScoreStats ? Math.round((finalScoreStats.score / finalScoreStats.total) * 100) : 0}% Score · Logged to Dashboard
                                    </p>
                                </div>

                                {/* Answer Key */}
                                {finalScoreStats?.results && finalScoreStats.results.length > 0 && (
                                    <div className="space-y-3 mb-8 max-h-[380px] overflow-y-auto pr-1">
                                        <h4 className="text-[10px] font-black text-[#0E5858] uppercase tracking-[0.2em] flex items-center gap-2 sticky top-0 bg-white py-1">
                                            <Sparkles size={12} className="text-[#00B6C1]" />
                                            Answer Review
                                        </h4>
                                        {finalScoreStats.results.map((result: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className={`p-4 rounded-2xl border-2 ${result.isCorrect ? 'bg-green-50/50 border-green-200/50' : 'bg-red-50/50 border-red-200/50'}`}
                                            >
                                                <div className="flex items-start gap-3 mb-2">
                                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${result.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                                                        {result.isCorrect ? <CheckCircle2 size={13} /> : <span className="text-xs font-black">✗</span>}
                                                    </div>
                                                    <p className="text-xs font-bold text-[#0E5858] leading-snug">Q{idx + 1}. {result.question}</p>
                                                </div>
                                                <div className="ml-9 space-y-1">
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest shrink-0 w-16">Your Ans.</span>
                                                        <span className={`text-xs leading-relaxed ${result.isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                                                            {result.providedAnswer || '(No answer)'}
                                                        </span>
                                                    </div>
                                                    {!result.isCorrect && (
                                                        <div className="flex items-start gap-2">
                                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest shrink-0 w-16">Correct</span>
                                                            <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-md">
                                                                {result.correctAnswer}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {result.aiFeedback && (
                                                        <div className="flex items-start gap-2">
                                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest shrink-0 w-16">AI Note</span>
                                                            <span className="text-[11px] text-gray-500 italic">{result.aiFeedback}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Close / Dashboard button */}
                                {isTrainingComplete && certificateData ? (
                                    <div className="space-y-4">
                                        {/* Congratulations Banner */}
                                        <div className="p-5 bg-gradient-to-br from-[#0E5858] to-[#00B6C1] rounded-2xl text-white text-center">
                                            <GraduationCap size={32} className="mx-auto mb-2" />
                                            <p className="text-sm font-black uppercase tracking-widest mb-1">🎉 Congratulations on completing the training!</p>
                                            <p className="text-xs font-medium opacity-80">You've finished all your assigned modules. Your certificate is ready below.</p>
                                            {emailSent && (
                                                <p className="text-[10px] font-medium opacity-60 mt-2">📧 A copy has been sent to your registered email.</p>
                                            )}
                                        </div>

                                        {/* Certificate Component */}
                                        <TrainingCertificate
                                            userName={certificateData.userName}
                                            completionDate={certificateData.completionDate}
                                            certificateId={certificateData.certificateId}
                                        />

                                        {/* Explore Educators CTA */}
                                        <button
                                            onClick={() => {
                                                setShowResult(false);
                                                router.push('/');
                                            }}
                                            className="w-full py-4 bg-[#0E5858] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-2 hover:bg-[#00B6C1] transition-all shadow-lg"
                                        >
                                            Explore Now <ArrowRight size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setShowResult(false);
                                            if (onClose) onClose();
                                        }}
                                        className="w-full py-4 bg-[#0E5858] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-2 hover:bg-[#00B6C1] transition-all shadow-lg"
                                    >
                                        <CheckCircle2 size={16} />
                                        Close Results
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
