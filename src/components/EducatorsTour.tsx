"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X, Search, Sparkles, Phone, Layers } from "lucide-react";

interface Step {
    targetId: string;
    title: string;
    description: string;
    icon: React.ElementType;
}

const TOUR_STEPS: Step[] = [
    {
        targetId: "edu-tour-search",
        title: "Smart Search",
        description: "Search by keyword, health condition, or natural language queries like 'PCOS breakfast' or 'gut health tips'.",
        icon: Search
    },
    {
        targetId: "edu-tour-health-tabs",
        title: "Health Condition Filters",
        description: "Filter all content by specific health conditions — PCOS, Diabetes, Thyroid, Cardiac, Pregnancy, and more.",
        icon: Sparkles
    },
    {
        targetId: "edu-tour-columns",
        title: "Content Categories",
        description: "Browse organized content: Videos, Gyan & Tips, Recipes, Success Stories, Podcasts, and Challenges — all mapped to health conditions.",
        icon: Layers
    },
    {
        targetId: "edu-tour-whatsapp",
        title: "Client WhatsApp Sharing",
        description: "Enter a client's WhatsApp number here and share any content card directly from the dashboard via WhatsApp.",
        icon: Phone
    }
];

export default function EducatorsTour({ onComplete }: { onComplete: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [targetBounds, setTargetBounds] = useState<DOMRect | null>(null);

    useEffect(() => {
        // Small delay to allow page to render
        const timer = setTimeout(() => setIsVisible(true), 800);
        return () => clearTimeout(timer);
    }, []);

    const updateBounds = useCallback(() => {
        if (!isVisible || currentStep >= TOUR_STEPS.length) return;
        const targetElement = document.getElementById(TOUR_STEPS[currentStep].targetId);
        if (targetElement) {
            const rect = targetElement.getBoundingClientRect();
            setTargetBounds(new DOMRect(rect.x - 10, rect.y - 10, rect.width + 20, rect.height + 20));
            if (rect.bottom > window.innerHeight || rect.top < 0) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            setTargetBounds(null);
        }
    }, [currentStep, isVisible]);

    useEffect(() => {
        updateBounds();
        window.addEventListener("resize", updateBounds);
        window.addEventListener("scroll", updateBounds, true);
        return () => {
            window.removeEventListener("resize", updateBounds);
            window.removeEventListener("scroll", updateBounds, true);
        };
    }, [updateBounds]);

    const completeTour = () => {
        localStorage.removeItem('educators_tour_pending');
        localStorage.setItem('educators_tour_completed', 'true');
        setIsVisible(false);
        onComplete();
        document.body.style.overflow = '';
    };

    const nextStep = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            completeTour();
        }
    };

    if (!isVisible) return null;

    const stepInfo = TOUR_STEPS[currentStep];
    const Icon = stepInfo.icon;

    let tooltipStyle: React.CSSProperties = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    if (targetBounds) {
        const spaceBelow = window.innerHeight - targetBounds.bottom;
        if (spaceBelow > 250) {
            tooltipStyle = { top: targetBounds.bottom + 20, left: Math.max(20, Math.min(targetBounds.left, window.innerWidth - 380)) };
        } else {
            tooltipStyle = { top: Math.max(20, targetBounds.top - 220), left: Math.max(20, Math.min(targetBounds.left, window.innerWidth - 380)) };
        }
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[120] pointer-events-none" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                {/* SVG Mask Overlay */}
                <svg width="100%" height="100%" className="absolute inset-0 pointer-events-auto transition-all duration-500">
                    <defs>
                        <mask id="edu-spotlight">
                            <rect width="100%" height="100%" fill="white" />
                            {targetBounds && (
                                <rect
                                    x={targetBounds.x}
                                    y={targetBounds.y}
                                    width={targetBounds.width}
                                    height={targetBounds.height}
                                    rx={20}
                                    fill="black"
                                    className="transition-all duration-500 ease-in-out"
                                />
                            )}
                        </mask>
                    </defs>
                    <rect width="100%" height="100%" fill="#0E5858" opacity={0.8} mask="url(#edu-spotlight)" className="backdrop-blur-sm" />
                </svg>

                {/* Focus Border */}
                {targetBounds && (
                    <motion.div
                        className="absolute border-2 border-[#00B6C1] rounded-[20px] pointer-events-none"
                        initial={false}
                        animate={{
                            top: targetBounds.y,
                            left: targetBounds.x,
                            width: targetBounds.width,
                            height: targetBounds.height
                        }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                        <div className="absolute -inset-1 border border-[#00B6C1]/30 rounded-[24px] animate-ping" />
                    </motion.div>
                )}

                {/* Tooltip */}
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute bg-white rounded-3xl p-6 shadow-2xl max-w-sm pointer-events-auto border border-[#00B6C1]/20 w-[90%] md:w-[350px]"
                    style={{ ...tooltipStyle, position: 'absolute' }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                >
                    <button
                        onClick={completeTour}
                        className="absolute top-4 right-4 text-gray-300 hover:text-[#0E5858] transition-colors"
                        title="Skip Tour"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0E5858]/10 text-[#0E5858] flex items-center justify-center">
                            <Icon size={20} />
                        </div>
                        <h4 className="text-lg font-serif font-bold text-[#0E5858] pr-6">{stepInfo.title}</h4>
                    </div>

                    <p className="text-sm text-gray-500 leading-relaxed mb-6">
                        {stepInfo.description}
                    </p>

                    <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                            {TOUR_STEPS.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-2 h-2 rounded-full transition-all ${idx === currentStep ? 'bg-[#00B6C1] w-4' : idx < currentStep ? 'bg-[#0E5858]' : 'bg-gray-200'}`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={nextStep}
                            className="bg-[#0E5858] text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#00B6C1] transition-all flex items-center gap-2 shadow-lg"
                        >
                            {currentStep === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}
                            {currentStep !== TOUR_STEPS.length - 1 && <ChevronRight size={14} />}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
