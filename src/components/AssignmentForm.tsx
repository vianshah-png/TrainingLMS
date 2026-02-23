"use client";

import { useState, useEffect } from "react";
import { Send, CheckCircle2, Loader2, ClipboardList, User, Building2, ArrowRight, UserCircle2, BrainCircuit, Sparkles, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

interface AssignmentFormProps {
    topicCode: string;
    questions: string[];
    persona?: { story: string; goal: string };
    onComplete?: () => void;
    userId?: string;
}

type FormStep = "persona" | "define-persona" | "selection" | "questions";

export default function AssignmentForm({ topicCode, questions, persona, onComplete, userId }: AssignmentFormProps) {
    const [step, setStep] = useState<FormStep>(persona ? "persona" : "questions");
    const [userPersona, setUserPersona] = useState({ story: "", goal: "" });
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    // matrix: [questionIndex][0=BN, 1=Peer1, 2=Peer2]
    const [answers, setAnswers] = useState<string[][]>(
        new Array(questions.length).fill(null).map(() => new Array(3).fill(""))
    );
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [caughtError, setCaughtError] = useState<string | null>(null);
    const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
    const [selectedDieticians, setSelectedDieticians] = useState<string[]>([]);

    // Persistence Logic
    useEffect(() => {
        if (!userId) return;
        const key = `bn-draft-${userId}-${topicCode}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                const draft = JSON.parse(saved);
                if (draft.answers && draft.answers.length === questions.length) {
                    setAnswers(draft.answers);
                }
                if (draft.userPersona) setUserPersona(draft.userPersona);
                if (draft.selectedCompanies) setSelectedCompanies(draft.selectedCompanies);
                if (draft.selectedDieticians) setSelectedDieticians(draft.selectedDieticians);
            } catch (e) { console.error("Draft load error:", e); }
        }
    }, [userId, topicCode, questions.length]);

    useEffect(() => {
        if (!userId || submitted) return;
        const key = `bn-draft-${userId}-${topicCode}`;
        localStorage.setItem(key, JSON.stringify({
            answers,
            userPersona,
            selectedCompanies,
            selectedDieticians
        }));
    }, [answers, userPersona, selectedCompanies, selectedDieticians, userId, topicCode, submitted]);

    const competitors = ["Healthify Me", "Sugar Fit", "Fitelo", "Fittr", "Fitterfly", "Livofy"];
    const dieticians = ["Anjali Mukherjee", "Rashi Chaudhary", "Neha Ranglani", "Nisha Malhotra", "Pooja Makhija", "Shikha Sharma"];

    const toggleSelection = (item: string, list: string[], setter: (val: string[]) => void) => {
        if (list.includes(item)) {
            setter(list.filter(i => i !== item));
        } else if (list.length < 2) {
            setter([...list, item]);
        }
    };

    const isQuestionComplete = (idx: number) => {
        if (!answers[idx]) return false;
        return answers[idx].every(ans => ans && ans.trim() !== "");
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleSubmit = async () => {
        if (answers.some(row => row.some(cell => !cell || cell.trim() === ""))) {
            alert("Please provide analytical findings for all audit points before submitting.");
            return;
        }

        setLoading(true);
        setCaughtError(null);
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) throw sessionError;

            if (session) {
                console.log("Submitting as user:", session.user.id);

                // Admin-level Profile Sync via API to bypass RLS and satisfy FK constraint
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

                const submissionData = {
                    user_id: session.user.id,
                    topic_code: topicCode,
                    summary_text: JSON.stringify({
                        answers,
                        questions,
                        metadata: {
                            companies: ["Balance Nutrition", ...selectedCompanies],
                            dieticians: ["Khyati Rupani", ...selectedDieticians],
                            user_persona: userPersona,
                            assigned_example_persona: persona
                        }
                    }),
                    ai_feedback: "AWAITING_REVIEW",
                    score: 0
                };

                const { error: insertError } = await supabase
                    .from('summary_audits')
                    .insert([submissionData]);

                if (insertError) {
                    console.error("Audit Insert Error:", insertError);
                    throw insertError;
                }

                setSubmitted(true);
                if (userId) localStorage.removeItem(`bn-draft-${userId}-${topicCode}`);
                if (onComplete) onComplete();
            } else {
                setCaughtError("Your session has expired. Please log in again.");
            }
        } catch (error: any) {
            console.error("Error submitting assignment:", error);
            setCaughtError(error.message || "A secure connection error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="p-8 bg-green-50 rounded-[2rem] border-2 border-green-200 text-center animate-in zoom-in duration-500">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <CheckCircle2 size={32} className="text-green-500" />
                </div>
                <h3 className="text-2xl font-serif text-[#0E5858] mb-2">Peer Audit Logged</h3>
                <p className="text-sm text-gray-500 mb-6">Your comprehensive research has been submitted for review.</p>
                <div className="inline-block px-6 py-2 bg-[#0E5858] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest opacity-50 cursor-default">
                    Audit Locked
                </div>
            </div>
        );
    }

    const isDieticianStep = step === 'questions' && currentQuestionIndex >= 9;

    const columnHeaders = step === 'questions' ? (
        isDieticianStep ? [
            { brand: "Khyati Rupani", person: "Founder" },
            { brand: selectedDieticians[0] || "Dietician 1", person: "Competitor" },
            { brand: selectedDieticians[1] || "Dietician 2", person: "Competitor" }
        ] : [
            { brand: "Balance Nutrition", person: "The Standard" },
            { brand: selectedCompanies[0] || "Peer 1", person: "Competitor" },
            { brand: selectedCompanies[1] || "Peer 2", person: "Competitor" }
        ]
    ) : [];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FAFCEE] rounded-xl flex items-center justify-center text-[#00B6C1] border border-[#00B6C1]/10">
                        {step === 'persona' ? <UserCircle2 size={20} /> : step === 'selection' ? <Building2 size={20} /> : <ClipboardList size={20} />}
                    </div>
                    <div>
                        <h3 className="text-lg font-serif text-[#0E5858]">
                            {step === 'persona' ? 'Audit Persona' : step === 'define-persona' ? 'Create Your Persona' : step === 'selection' ? 'Audit Selection' : 'Peer Audit'}
                        </h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">
                            {step === 'questions' ? `Audit Point ${currentQuestionIndex + 1} of ${questions.length}` : 'Step-by-step setup'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {["persona", "define-persona", "selection", "questions"].map((s) => (
                        <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${step === s ? 'w-8 bg-[#00B6C1]' : 'w-2 bg-gray-100'}`} />
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {step === "persona" && persona && (
                    <motion.div key="persona" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div className="p-8 bg-[#FAFCEE] rounded-[3rem] border border-[#0E5858]/10 text-[#0E5858] relative overflow-hidden group">
                            <span className="inline-block px-3 py-1 bg-[#0E5858]/5 rounded-lg text-[9px] font-bold uppercase tracking-[0.2em] mb-4">Example Persona</span>
                            <h4 className="text-xl font-serif mb-4 leading-snug italic opacity-70">"{persona.story}"</h4>
                            <p className="text-xs font-bold uppercase tracking-widest text-[#00B6C1]">Goal: {persona.goal}</p>
                        </div>
                        <button
                            onClick={() => setStep("define-persona")}
                            className="w-full py-5 bg-[#0E5858] text-white rounded-2xl text-[11px] font-bold uppercase tracking-[0.25em] flex items-center justify-center gap-3 shadow-xl shadow-[#0E5858]/20"
                        >
                            Continue to Create Mine
                            <ArrowRight size={18} />
                        </button>
                    </motion.div>
                )}

                {step === "define-persona" && (
                    <motion.div key="define-persona" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type Your Audit Persona</label>
                            <textarea
                                value={userPersona.story}
                                onChange={(e) => setUserPersona({ ...userPersona, story: e.target.value })}
                                placeholder="I am [Age] years old, [Height] tall, and weigh [Weight]. My health history is..."
                                className="w-full p-6 bg-white border border-gray-100 rounded-3xl text-sm min-h-[120px] focus:ring-2 focus:ring-[#00B6C1]/20 focus:border-[#00B6C1] outline-none"
                            />
                            <input
                                type="text"
                                value={userPersona.goal}
                                onChange={(e) => setUserPersona({ ...userPersona, goal: e.target.value })}
                                placeholder="Your health goal (e.g. Lose 10kg, PCOS management)"
                                className="w-full p-6 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-[#00B6C1]/20 focus:border-[#00B6C1] outline-none"
                            />
                        </div>
                        <button
                            onClick={() => setStep("selection")}
                            disabled={!userPersona.story || !userPersona.goal}
                            className={`w-full py-5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.25em] flex items-center justify-center gap-3 transition-all ${!userPersona.story || !userPersona.goal ? 'bg-gray-50 text-gray-300' : 'bg-[#0E5858] text-white'}`}
                        >
                            Lock Persona & Select Peers
                            <ArrowRight size={18} />
                        </button>
                    </motion.div>
                )}

                {step === "selection" && (
                    <motion.div key="selection" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select 2 Peer Companies</label>
                                    <span className="text-[9px] font-bold text-[#00B6C1]">{selectedCompanies.length}/2 Selected</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-4 rounded-2xl border-2 border-[#00B6C1] bg-[#FAFCEE] opacity-50 cursor-not-allowed">
                                        <p className="text-xs font-bold text-[#0E5858]">Balance Nutrition (Default)</p>
                                    </div>
                                    {competitors.map(comp => (
                                        <button
                                            key={comp}
                                            onClick={() => toggleSelection(comp, selectedCompanies, setSelectedCompanies)}
                                            className={`p-4 rounded-2xl text-left border-2 transition-all ${selectedCompanies.includes(comp) ? 'border-[#00B6C1] bg-[#FAFCEE] text-[#0E5858]' : 'border-gray-50 bg-white text-gray-400'}`}
                                        >
                                            <p className="text-xs font-bold">{comp}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select 2 Peer Dieticians</label>
                                    <span className="text-[9px] font-bold text-[#00B6C1]">{selectedDieticians.length}/2 Selected</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-4 rounded-2xl border-2 border-[#00B6C1] bg-[#FAFCEE] opacity-50 cursor-not-allowed">
                                        <p className="text-xs font-bold text-[#0E5858]">Khyati Rupani (Default)</p>
                                    </div>
                                    {dieticians.map(diet => (
                                        <button
                                            key={diet}
                                            onClick={() => toggleSelection(diet, selectedDieticians, setSelectedDieticians)}
                                            className={`p-4 rounded-2xl text-left border-2 transition-all ${selectedDieticians.includes(diet) ? 'border-[#00B6C1] bg-[#FAFCEE] text-[#0E5858]' : 'border-gray-50 bg-white text-gray-400'}`}
                                        >
                                            <p className="text-xs font-bold">{diet}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setStep("questions")}
                            disabled={selectedCompanies.length < 2 || selectedDieticians.length < 2}
                            className={`w-full py-5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.25em] flex items-center justify-center gap-3 transition-all ${selectedCompanies.length < 2 || selectedDieticians.length < 2 ? 'bg-gray-50 text-gray-300' : 'bg-[#0E5858] text-white shadow-xl'}`}
                        >
                            Initialize Audit Matrix
                            <ArrowRight size={18} />
                        </button>
                    </motion.div>
                )}

                {step === "questions" && (
                    <motion.div key="questions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[#0E5858] text-white flex items-center justify-center text-xs font-bold shrink-0">
                                        {currentQuestionIndex + 1}
                                    </div>
                                    <h4 className="text-xl font-serif text-[#0E5858] leading-tight font-medium">
                                        {questions[currentQuestionIndex]}
                                    </h4>
                                </div>
                                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${isDieticianStep ? 'bg-[#00B6C1]/5 text-[#00B6C1] border-[#00B6C1]/20' : 'bg-[#0E5858]/5 text-[#0E5858] border-[#0E5858]/20'}`}>
                                    {isDieticianStep ? 'Digital Presence Audit' : 'Commercial & Comparative Audit'}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {columnHeaders.map((header, entityIdx) => (
                                    <div key={entityIdx} className="space-y-3">
                                        <div className="flex items-center gap-2 px-4 py-3 bg-[#FAFCEE] rounded-2xl border border-[#0E5858]/5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#00B6C1]"></div>
                                            <div>
                                                <p className="text-[10px] font-black text-[#0E5858] uppercase tracking-widest">{header.brand}</p>
                                                <p className="text-[8px] font-extrabold text-[#00B6C1] uppercase tracking-wider">{header.person}</p>
                                            </div>
                                        </div>
                                        <textarea
                                            value={answers[currentQuestionIndex][entityIdx]}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setAnswers(prev => {
                                                    const next = prev.map((row, rIdx) => {
                                                        if (rIdx === currentQuestionIndex) {
                                                            const newRow = [...row];
                                                            newRow[entityIdx] = val;
                                                            return newRow;
                                                        }
                                                        return row;
                                                    });
                                                    return next;
                                                });
                                            }}
                                            className="w-full p-5 bg-white border border-gray-100 rounded-[2rem] text-[12px] min-h-[160px] focus:ring-4 focus:ring-[#00B6C1]/5 focus:border-[#00B6C1] outline-none transition-all placeholder:text-gray-200 resize-none leading-relaxed shadow-sm"
                                            placeholder={`Findings for ${header.brand}...`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            {caughtError && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold"
                                >
                                    <AlertCircle size={16} />
                                    {caughtError}
                                </motion.div>
                            )}

                            <div className="flex gap-4">
                                {currentQuestionIndex > 0 && (
                                    <button
                                        onClick={handlePrev}
                                        className="flex-1 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] bg-gray-50 text-gray-400 hover:bg-gray-100 transition-all flex items-center justify-center gap-3"
                                    >
                                        Previous
                                    </button>
                                )}

                                {currentQuestionIndex < questions.length - 1 ? (
                                    <button
                                        onClick={handleNext}
                                        disabled={!isQuestionComplete(currentQuestionIndex)}
                                        className={`flex-[2] py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${isQuestionComplete(currentQuestionIndex)
                                            ? 'bg-[#00B6C1] text-white hover:translate-x-1'
                                            : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                            }`}
                                    >
                                        Next Audit Point
                                        <ArrowRight size={18} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading || !isQuestionComplete(currentQuestionIndex) || answers.some(row => row.some(cell => cell.trim() === ""))}
                                        className={`flex-[2] py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] flex items-center justify-center gap-4 shadow-2xl transition-all ${loading || !isQuestionComplete(currentQuestionIndex) || answers.some(row => row.some(cell => cell.trim() === ""))
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-[#0E5858] text-white hover:bg-[#00B6C1] hover:-translate-y-1 shadow-[#0E5858]/20'
                                            }`}
                                    >
                                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={18} />}
                                        {loading ? 'Submitting Report...' : 'Finalize Audit Report'}
                                    </button>
                                )}
                            </div>

                            {/* Progress Dots */}
                            <div className="flex justify-center gap-2">
                                {questions.map((_, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => isQuestionComplete(idx) || idx <= currentQuestionIndex ? setCurrentQuestionIndex(idx) : null}
                                        className={`h-1.5 rounded-full cursor-pointer transition-all duration-300 ${idx === currentQuestionIndex ? 'w-8 bg-[#0E5858]' : isQuestionComplete(idx) ? 'w-4 bg-[#00B6C1]' : 'w-2 bg-gray-100'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
