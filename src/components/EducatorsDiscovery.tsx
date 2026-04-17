"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles, Search, BookOpen, Brain, ArrowRight,
    ChevronRight, X, GraduationCap, Layers, Zap, CheckCircle2
} from "lucide-react";

interface EducatorsDiscoveryProps {
    onDismiss: () => void;
    onExplore: () => void;
}

const slides = [
    {
        id: "congrats",
        icon: GraduationCap,
        iconColor: "#FFCC00",
        iconBg: "from-[#FFCC00]/20 to-[#FFCC00]/5",
        label: "Training Complete",
        title: "You've Mastered\nAll Your Modules!",
        subtitle: "Congratulations — you've completed every training module assigned to your track.",
        body: "A new door is now open. Introducing a powerful module designed to take your expertise to the next level.",
    },
    {
        id: "features",
        icon: Sparkles,
        iconColor: "#00B6C1",
        iconBg: "from-[#00B6C1]/20 to-[#00B6C1]/5",
        label: "What's Inside",
        title: "The Educators\nModule",
        subtitle: "A semantic intelligence layer built for health educators.",
        features: [
            { icon: Search, label: "Semantic RAG Search", desc: "Search across all videos, blogs, and protocols using natural language." },
            { icon: Brain, label: "Condition Mapping", desc: "Instantly surface content mapped to specific health conditions." },
            { icon: Layers, label: "Resource Library", desc: "Access curated success stories, content audits, and educational assets." },
            { icon: Zap, label: "AI-Powered Insights", desc: "Discover patterns and recommendations from the Balance Nutrition knowledge base." },
        ]
    },
    {
        id: "howto",
        icon: BookOpen,
        iconColor: "#0E5858",
        iconBg: "from-[#0E5858]/20 to-[#0E5858]/5",
        label: "How to Access",
        title: "Start Exploring\nRight Now",
        subtitle: "The Educators Module is live and ready in your dashboard.",
        steps: [
            { num: "01", label: "Dashboard", desc: "Find the Educators Module card on your main dashboard grid." },
            { num: "02", label: "Sidebar", desc: "Access it anytime via the sidebar navigation in your portal." },
            { num: "03", label: "Search Anything", desc: "Type any health condition, topic, or keyword and get instant results." },
        ]
    }
];

export default function EducatorsDiscovery({ onDismiss, onExplore }: EducatorsDiscoveryProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [direction, setDirection] = useState(1);

    const slide = slides[currentSlide];
    const isLast = currentSlide === slides.length - 1;

    const goNext = () => {
        if (isLast) { onExplore(); return; }
        setDirection(1);
        setCurrentSlide(prev => prev + 1);
    };

    const goPrev = () => {
        if (currentSlide === 0) return;
        setDirection(-1);
        setCurrentSlide(prev => prev - 1);
    };

    const variants = {
        enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
        center: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
        exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60, transition: { duration: 0.3 } }),
    };

    const IconComp = slide.icon;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#0E5858]/70 backdrop-blur-xl"
                onClick={onDismiss}
            />

            {/* Panel */}
            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-2xl bg-white rounded-[3rem] overflow-hidden shadow-2xl shadow-[#0E5858]/30"
            >
                {/* Top gradient stripe */}
                <div className="h-1.5 w-full bg-gradient-to-r from-[#0E5858] via-[#00B6C1] to-[#FFCC00]" />

                {/* Dismiss button */}
                <button
                    onClick={onDismiss}
                    className="absolute top-6 right-6 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-[#0E5858] transition-all z-10"
                >
                    <X size={16} />
                </button>

                {/* Slide Content */}
                <div className="p-10 sm:p-14 pb-8 min-h-[480px] flex flex-col">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={currentSlide}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="flex-1 flex flex-col"
                        >
                            {/* Slide 0: Congrats */}
                            {slide.id === "congrats" && (
                                <div className="flex flex-col items-center text-center gap-6 flex-1 justify-center py-4">
                                    <motion.div
                                        initial={{ scale: 0.6, rotate: -10 }}
                                        animate={{ scale: 1, rotate: 0, transition: { type: "spring", stiffness: 200, damping: 12 } }}
                                        className={`w-24 h-24 rounded-[2rem] bg-gradient-to-br ${slide.iconBg} flex items-center justify-center shadow-xl`}
                                    >
                                        <IconComp size={44} color={slide.iconColor} strokeWidth={1.5} />
                                    </motion.div>

                                    <div>
                                        <p className="text-[10px] font-black text-[#00B6C1] uppercase tracking-[0.3em] mb-3">{slide.label}</p>
                                        <h2 className="text-4xl sm:text-5xl font-serif text-[#0E5858] leading-tight mb-4 whitespace-pre-line">
                                            {slide.title}
                                        </h2>
                                        <p className="text-gray-500 font-medium text-sm leading-relaxed max-w-md mx-auto mb-3">
                                            {slide.subtitle}
                                        </p>
                                        <p className="text-[#0E5858] font-bold text-sm leading-relaxed max-w-md mx-auto">
                                            {slide.body}
                                        </p>
                                    </div>

                                    {/* Confetti dots */}
                                    <div className="flex gap-2 mt-2">
                                        {["bg-[#FFCC00]", "bg-[#00B6C1]", "bg-[#0E5858]", "bg-[#FFCC00]", "bg-[#00B6C1]"].map((c, i) => (
                                            <motion.div
                                                key={i}
                                                className={`w-2 h-2 rounded-full ${c}`}
                                                animate={{ y: [0, -6, 0] }}
                                                transition={{ delay: i * 0.12, duration: 0.8, repeat: Infinity, repeatDelay: 1 }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Slide 1: Features */}
                            {slide.id === "features" && (
                                <div className="flex flex-col gap-6 flex-1">
                                    <div className="flex items-start gap-5">
                                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${slide.iconBg} flex items-center justify-center shrink-0`}>
                                            <IconComp size={32} color={slide.iconColor} strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-[#00B6C1] uppercase tracking-[0.3em] mb-1">{slide.label}</p>
                                            <h2 className="text-3xl sm:text-4xl font-serif text-[#0E5858] leading-tight whitespace-pre-line">{slide.title}</h2>
                                            <p className="text-gray-400 font-medium text-sm mt-1">{slide.subtitle}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                        {slide.features?.map((feat, i) => {
                                            const FeatIcon = feat.icon;
                                            return (
                                                <motion.div
                                                    key={feat.label}
                                                    initial={{ opacity: 0, y: 12 }}
                                                    animate={{ opacity: 1, y: 0, transition: { delay: 0.1 + i * 0.08 } }}
                                                    className="flex gap-4 p-4 bg-[#FAFCEE] rounded-2xl border border-[#0E5858]/5"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#00B6C1] shadow-sm shrink-0">
                                                        <FeatIcon size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-[#0E5858] mb-0.5">{feat.label}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium leading-snug">{feat.desc}</p>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Slide 2: How to Access */}
                            {slide.id === "howto" && (
                                <div className="flex flex-col gap-6 flex-1">
                                    <div className="flex items-start gap-5">
                                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${slide.iconBg} flex items-center justify-center shrink-0`}>
                                            <IconComp size={32} color={slide.iconColor} strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-[#00B6C1] uppercase tracking-[0.3em] mb-1">{slide.label}</p>
                                            <h2 className="text-3xl sm:text-4xl font-serif text-[#0E5858] leading-tight whitespace-pre-line">{slide.title}</h2>
                                            <p className="text-gray-400 font-medium text-sm mt-1">{slide.subtitle}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4 mt-2">
                                        {slide.steps?.map((step, i) => (
                                            <motion.div
                                                key={step.num}
                                                initial={{ opacity: 0, x: -16 }}
                                                animate={{ opacity: 1, x: 0, transition: { delay: 0.1 + i * 0.1 } }}
                                                className="flex items-center gap-5 p-5 bg-[#FAFCEE] rounded-2xl border border-[#0E5858]/5"
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-[#0E5858] text-white flex items-center justify-center font-black text-sm shrink-0">
                                                    {step.num}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-[#0E5858] mb-0.5">{step.label}</p>
                                                    <p className="text-[11px] text-gray-400 font-medium leading-snug">{step.desc}</p>
                                                </div>
                                                <CheckCircle2 size={18} className="text-[#00B6C1] ml-auto shrink-0" />
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-50">
                        {/* Progress dots */}
                        <div className="flex gap-2">
                            {slides.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setDirection(i > currentSlide ? 1 : -1); setCurrentSlide(i); }}
                                    className={`rounded-full transition-all duration-300 ${
                                        i === currentSlide
                                            ? 'w-6 h-2 bg-[#0E5858]'
                                            : 'w-2 h-2 bg-gray-200 hover:bg-[#00B6C1]'
                                    }`}
                                />
                            ))}
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center gap-3">
                            {currentSlide > 0 && (
                                <button
                                    onClick={goPrev}
                                    className="px-5 py-2.5 bg-gray-50 text-[#0E5858] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                                >
                                    Back
                                </button>
                            )}
                            <button
                                onClick={goNext}
                                className="px-7 py-3 bg-[#0E5858] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00B6C1] transition-all flex items-center gap-2 shadow-lg shadow-[#0E5858]/20"
                            >
                                {isLast ? (
                                    <>Explore Now <Sparkles size={12} /></>
                                ) : (
                                    <>Next <ChevronRight size={14} /></>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Dismiss link */}
                    <button
                        onClick={onDismiss}
                        className="text-center text-[9px] font-bold text-gray-300 hover:text-gray-400 uppercase tracking-widest mt-4 transition-colors"
                    >
                        Remind me later
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
