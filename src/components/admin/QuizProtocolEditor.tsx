"use client";

import { Loader2, Sparkles, XCircle, Plus, CheckCircle, BrainCircuit } from "lucide-react";

interface QuizProtocolEditorProps {
    selectedQuizTopic: string;
    setSelectedQuizTopic: (val: string) => void;
    syllabusData: any[];
    isFetchingQuiz: boolean;
    handleFetchManualQuiz: (id: string) => void;
    customAIPrompt: string;
    setCustomAIPrompt: (val: string) => void;
    handleGenerateAISuggestions: () => void;
    isGeneratingSuggestions: boolean;
    manualQuizQuestions: any[];
    setManualQuizQuestions: (val: any[] | ((prev: any[]) => any[])) => void;
    handleSaveManualQuiz: () => void;
    handleDeleteManualQuiz: () => void;
    isSavingQuiz: boolean;
    quizSuccess: string;
    quizError: string;
}

export default function QuizProtocolEditor({
    selectedQuizTopic,
    setSelectedQuizTopic,
    syllabusData,
    isFetchingQuiz,
    handleFetchManualQuiz,
    customAIPrompt,
    setCustomAIPrompt,
    handleGenerateAISuggestions,
    isGeneratingSuggestions,
    manualQuizQuestions,
    setManualQuizQuestions,
    handleSaveManualQuiz,
    handleDeleteManualQuiz,
    isSavingQuiz,
    quizSuccess,
    quizError
}: QuizProtocolEditorProps) {
    return (
        <div className="bg-white p-10 rounded-[3rem] border border-[#0E5858]/5 lg:col-span-2 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <p className="text-[10px] font-black text-[#00B6C1] uppercase tracking-[0.3em] mb-2">Protocol Architecture</p>
                    <h3 className="text-3xl font-serif text-[#0E5858]">Quiz Protocol Editor</h3>
                    <p className="text-xs text-gray-400 font-medium mt-1">Override AI-generated assessments with manual academy questions.</p>
                </div>
                <div className="flex flex-col gap-2 w-full md:w-auto">
                    <select
                        value={selectedQuizTopic}
                        onChange={(e) => {
                            setSelectedQuizTopic(e.target.value);
                            handleFetchManualQuiz(e.target.value);
                        }}
                        className="bg-gray-50 border border-[#0E5858]/10 rounded-xl py-3 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-[#00B6C1]/10 min-w-[280px]"
                    >
                        <option value="">Select Quiz to Edit (Segment or Final)</option>
                        {syllabusData.filter(m => m.topics && m.topics.length > 0).map(m => (
                            <optgroup key={m.id} label={m.title}>
                                {m.topics.map((t: any) => (
                                    <option key={t.code} value={t.code}>{t.code}: {t.title}</option>
                                ))}
                                <option value={`MODULE_${m.id}`}>⭐ {m.title.split(':')[0]} Final Quiz</option>
                            </optgroup>
                        ))}
                    </select>
                    {isFetchingQuiz && <div className="flex items-center gap-2 px-4 py-1 animate-pulse"><Loader2 size={12} className="animate-spin text-[#00B6C1]" /><span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Loading Protocol...</span></div>}
                </div>
            </div>

            {selectedQuizTopic ? (
                <div className="space-y-8">
                    <div className="space-y-6">
                        {/* AI Suggestion Bar */}
                        <div className="p-8 bg-[#00B6C1]/5 rounded-[2.5rem] border border-[#00B6C1]/10 flex flex-col md:flex-row items-center gap-6">
                            <div className="flex-1 space-y-2 w-full">
                                <label className="text-[10px] font-black text-[#00B6C1] uppercase tracking-widest ml-4">Custom AI Guidance / Manual Context</label>
                                <input
                                    type="text"
                                    value={customAIPrompt}
                                    onChange={(e) => setCustomAIPrompt(e.target.value)}
                                    placeholder="e.g. Focus on PCOS symptoms, include 2 questions on BMI and 1 on diet..."
                                    className="w-full bg-white border border-[#00B6C1]/10 rounded-2xl py-4 px-6 text-sm font-medium outline-none shadow-sm focus:ring-2 focus:ring-[#00B6C1]/20"
                                />
                            </div>
                            <button
                                onClick={handleGenerateAISuggestions}
                                disabled={isGeneratingSuggestions}
                                className="px-10 py-4 bg-[#00B6C1] text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-[#0E5858] transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#00B6C1]/20 min-w-[240px]"
                            >
                                {isGeneratingSuggestions ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <>
                                        <Sparkles size={16} />
                                        {manualQuizQuestions.length > 0 ? "Refine with AI" : "Suggest with AI"}
                                    </>
                                )}
                            </button>
                        </div>

                        {manualQuizQuestions.map((q, qIdx) => (

                            <div key={qIdx} className="p-8 bg-[#FAFCEE]/50 rounded-[2.5rem] border border-[#0E5858]/5 relative group animate-in slide-in-from-right-4">
                                <button
                                    onClick={() => setManualQuizQuestions((prev: any[]) => prev.filter((_, i) => i !== qIdx))}
                                    className="absolute top-6 right-6 p-2 text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <XCircle size={20} />
                                </button>
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-[#00B6C1] uppercase tracking-widest ml-4">Academy Question {qIdx + 1}</label>
                                        <textarea
                                            value={q.question}
                                            onChange={e => {
                                                const newList = [...manualQuizQuestions];
                                                newList[qIdx].question = e.target.value;
                                                setManualQuizQuestions(newList);
                                            }}
                                            placeholder="Enter high-stakes assessment question..."
                                            className="w-full bg-white border border-gray-100 rounded-2xl py-4 px-6 text-sm font-medium outline-none h-24 resize-none shadow-sm"
                                        />
                                    </div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <button
                                            onClick={() => {
                                                const newList = [...manualQuizQuestions];
                                                newList[qIdx].type = 'mcq';
                                                setManualQuizQuestions(newList);
                                            }}
                                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${q.type === 'text' ? 'bg-gray-100 text-gray-400' : 'bg-[#00B6C1] text-white shadow-lg shadow-[#00B6C1]/20'}`}
                                        >
                                            Multiple Choice
                                        </button>
                                        <button
                                            onClick={() => {
                                                const newList = [...manualQuizQuestions];
                                                newList[qIdx].type = 'text';
                                                setManualQuizQuestions(newList);
                                            }}
                                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${q.type === 'text' ? 'bg-[#00B6C1] text-white shadow-lg shadow-[#00B6C1]/20' : 'bg-gray-100 text-gray-400'}`}
                                        >
                                            Text Response
                                        </button>
                                    </div>

                                    {q.type === 'text' ? (
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-[#00B6C1] uppercase tracking-widest ml-4">Correct Exact Answer</label>
                                            <input
                                                type="text"
                                                value={q.correctAnswer}
                                                onChange={e => {
                                                    const newList = [...manualQuizQuestions];
                                                    newList[qIdx].correctAnswer = e.target.value;
                                                    setManualQuizQuestions(newList);
                                                }}
                                                placeholder="Enter the exact answer for validation..."
                                                className="w-full bg-white border border-gray-100 rounded-xl py-4 px-6 text-sm font-medium outline-none shadow-sm"
                                            />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {q.options.map((opt: string, optIdx: number) => (
                                                <div key={optIdx} className="relative">
                                                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${q.correctAnswer === opt && opt !== "" ? 'bg-[#00B6C1] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                        {String.fromCharCode(65 + optIdx)}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={opt}
                                                        onChange={e => {
                                                            const oldVal = opt;
                                                            const newVal = e.target.value;
                                                            const newList = [...manualQuizQuestions];
                                                            newList[qIdx].options[optIdx] = newVal;
                                                            if (newList[qIdx].correctAnswer === oldVal) {
                                                                newList[qIdx].correctAnswer = newVal;
                                                            }
                                                            setManualQuizQuestions(newList);
                                                        }}
                                                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                                        className="w-full bg-white border border-gray-100 rounded-xl py-3 pl-14 pr-4 text-xs font-semibold outline-none"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const newList = [...manualQuizQuestions];
                                                            newList[qIdx].correctAnswer = opt;
                                                            setManualQuizQuestions(newList);
                                                        }}
                                                        className={`absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase tracking-widest transition-all ${q.correctAnswer === opt && opt !== "" ? 'text-[#00B6C1]' : 'text-gray-300 hover:text-[#0E5858]'}`}
                                                    >
                                                        {q.correctAnswer === opt && opt !== "" ? 'Correct' : 'Set Correct'}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                </div>
                            </div>
                        ))}

                        <button
                            onClick={() => setManualQuizQuestions((prev: any[]) => [...prev, { type: 'mcq', question: "", options: ["", "", "", ""], correctAnswer: "", justification: "" }])}
                            className="w-full py-6 border-2 border-dashed border-gray-100 rounded-[2.5rem] text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] hover:border-[#00B6C1] hover:text-[#00B6C1] transition-all bg-gray-50/30 flex items-center justify-center gap-3"
                        >
                            <Plus size={18} /> Add Academy Assessment Question
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 pt-10 border-t border-gray-50">
                        <button
                            onClick={handleSaveManualQuiz}
                            disabled={isSavingQuiz}
                            className="flex-1 py-5 bg-[#0E5858] text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-[#00B6C1] transition-all shadow-xl shadow-[#0E5858]/10 flex items-center justify-center gap-2"
                        >
                            {isSavingQuiz ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle size={18} /> Synchronize Protocols</>}
                        </button>
                        <button
                            onClick={handleDeleteManualQuiz}
                            disabled={isSavingQuiz}
                            className="px-8 py-5 border border-red-100 text-red-400 rounded-[1.5rem] font-black text-[9px] uppercase tracking-[0.2em] hover:bg-red-50 transition-all"
                        >
                            Remove Manual Override
                        </button>
                    </div>
                    {quizSuccess && <p className="text-green-500 font-bold text-[10px] uppercase tracking-widest text-center">{quizSuccess}</p>}
                    {quizError && <p className="text-red-500 font-bold text-[10px] uppercase tracking-widest text-center">{quizError}</p>}
                </div>
            ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center opacity-20">
                    <BrainCircuit size={80} className="text-[#0E5858] mb-6" />
                    <p className="text-sm font-serif text-[#0E5858] max-w-xs">Select a syllabus topic above to begin custom protocol mapping.</p>
                </div>
            )}
        </div>
    );
}
