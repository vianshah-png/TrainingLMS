"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X, UserCheck, Sparkles, BookOpen } from "lucide-react";

interface Step {
    targetId: string;
    title: string;
    description: string;
    icon: React.ElementType;
}

const TOUR_STEPS: Step[] = [
    {
        targetId: "tour-stats",
        title: "Your Mastery Area",
        description: "Keep track of your training progress, average score, and total tests taken here.",
        icon: Sparkles
    },
    {
        targetId: "tour-buddy",
        title: "Training Support",
        description: "Reach out to your assigned Training Buddy anytime via WhatsApp or Email if you're stuck.",
        icon: UserCheck
    },
    {
        targetId: "tour-modules",
        title: "Training Syllabus",
        description: "Access all your training modules, videos, and quizzes. Start with Module 1 and work your way down.",
        icon: BookOpen
    }
];

export default function DashboardTour({ userId, onComplete }: { userId: string, onComplete: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [targetBounds, setTargetBounds] = useState<DOMRect | null>(null);

    useEffect(() => {
        // Check if user has seen it
        const hasSeen = localStorage.getItem(`bn_tour_completed_${userId}`);
        if (!hasSeen) {
            // Small delay to allow dashboard to render completely
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        } else {
            onComplete();
        }
    }, [userId, onComplete]);

    const updateBounds = useCallback(() => {
        if (!isVisible || currentStep >= TOUR_STEPS.length) return;
        const targetElement = document.getElementById(TOUR_STEPS[currentStep].targetId);
        if (targetElement) {
            // Add a little padding around the actual element
            const rect = targetElement.getBoundingClientRect();
            setTargetBounds(new DOMRect(rect.x - 10, rect.y - 10, rect.width + 20, rect.height + 20));
            // Scroll into view safely if it's off-screen
            if (rect.bottom > window.innerHeight || rect.top < 0) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            // If element not found, just skip step
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
        localStorage.setItem(`bn_tour_completed_${userId}`, "true");
        setIsVisible(false);
        onComplete();
        // Remove padding from last element to reset layout
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

    // Determine tooltip position relative to target
    let tooltipStyle: React.CSSProperties = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    if (targetBounds) {
        // Place below if there's room, else above
        const spaceBelow = window.innerHeight - targetBounds.bottom;
        if (spaceBelow > 250) {
            tooltipStyle = { top: targetBounds.bottom + 20, left: Math.max(20, targetBounds.left) };
        } else {
            tooltipStyle = { top: targetBounds.top - 200, left: Math.max(20, targetBounds.left) };
        }
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[120] pointer-events-none" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                {/* SVG Mask Overlay for the spotlight effect */}
                <svg width="100%" height="100%" className="absolute inset-0 pointer-events-auto transition-all duration-500">
                    <defs>
                        <mask id="spotlight">
                            <rect width="100%" height="100%" fill="white" />
                            {targetBounds && (
                                <rect
                                    x={targetBounds.x}
                                    y={targetBounds.y}
                                    width={targetBounds.width}
                                    height={targetBounds.height}
                                    rx={24}
                                    fill="black"
                                    className="transition-all duration-500 ease-in-out"
                                />
                            )}
                        </mask>
                    </defs>
                    <rect width="100%" height="100%" fill="#0E5858" opacity={0.8} mask="url(#spotlight)" className="backdrop-blur-sm" />
                </svg>

                {/* Focus indicator border */}
                {targetBounds && (
                    <motion.div
                        className="absolute border-2 border-[#00B6C1] rounded-[24px] pointer-events-none"
                        initial={false}
                        animate={{
                            top: targetBounds.y,
                            left: targetBounds.x,
                            width: targetBounds.width,
                            height: targetBounds.height
                        }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                        <div className="absolute -inset-1 border border-[#00B6C1]/30 rounded-[28px] animate-ping" />
                    </motion.div>
                )}

                {/* Tooltip Content */}
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
                                    className={`w-2 h-2 rounded-full transition-all ${idx === currentStep ? 'bg-[#00B6C1] w-4' : 'bg-gray-200'}`}
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
