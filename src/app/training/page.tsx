"use client";

import { motion, Variants } from "framer-motion";
import { syllabusData } from "@/data/syllabus";
import { BookOpen, ArrowRight, Play, Clock, CheckCircle2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getAccessibleModuleIds, canAccessModule } from "@/lib/moduleAccess";

export default function TrainingPage() {
    const router = useRouter();
    const [accessibleIds, setAccessibleIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAccess = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { setLoading(false); return; }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role, allowed_modules')
                .eq('id', session.user.id)
                .single();

            const role = profile?.role || 'counsellor';
            const modules = profile?.allowed_modules || [];
            setAccessibleIds(getAccessibleModuleIds(role, modules));
            setLoading(false);
        };
        fetchAccess();
    }, []);

    // Filter for training modules only
    const trainingModules = syllabusData.filter(m => m.type === 'module' || m.type === 'pre-joining');

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#FAFCEE]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#0E5858]/10 border-t-[#00B6C1] rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-[#0E5858]/30 uppercase tracking-[0.2em]">Loading Modules...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.main
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="p-8 lg:p-12 max-w-7xl mx-auto"
        >
            <header className="mb-16">
                <h1 className="text-5xl font-serif text-[#0E5858] mb-4">Counselor Training Academy</h1>
                <p className="text-xl text-gray-500 max-w-2xl">
                    Complete the following modules to master the Balance Nutrition counselling standards and onboarding processes.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-8">
                {trainingModules.map((module, index) => {
                    const hasAccess = accessibleIds.includes(module.id);

                    return (
                        <motion.div
                            key={module.id}
                            variants={itemVariants}
                            onClick={() => hasAccess && router.push(`/modules/${module.id}`)}
                            className={`premium-card p-6 group transition-all ${
                                hasAccess 
                                    ? 'cursor-pointer hover:border-[#00B6C1]/30' 
                                    : 'opacity-60 cursor-not-allowed'
                            }`}
                        >
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                                    hasAccess 
                                        ? 'bg-[#FAFCEE] text-[#00B6C1] group-hover:bg-[#00B6C1] group-hover:text-white'
                                        : 'bg-gray-100 text-gray-300'
                                }`}>
                                    {hasAccess ? <BookOpen size={24} /> : <Lock size={24} />}
                                </div>

                                <div className="flex-1 text-center md:text-left">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1.5">
                                        <span className="badge-teal">{module.type}</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{module.topics.length} Topics</span>
                                        {!hasAccess && (
                                            <span className="text-[8px] font-black text-orange-500 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                                                <Lock size={8} /> Access Required
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-2xl font-serif text-[#0E5858] mb-1">{module.title}</h2>
                                    <p className="text-sm text-gray-500 font-medium">{module.subtitle || module.description}</p>
                                </div>

                                <div className="flex flex-col items-center md:items-end gap-3 min-w-[180px]">
                                    {hasAccess ? (
                                        <>
                                            <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-[#0E5858] to-[#00B6C1]"
                                                    style={{ width: `${module.progress}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center gap-5">
                                                <button className="flex items-center gap-2 text-[#00B6C1] text-sm font-bold group-hover:translate-x-1 transition-all">
                                                    <span>{module.progress === 100 ? 'Review' : 'Continue'}</span>
                                                    <ArrowRight size={16} />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center">
                                            Contact admin for access
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.main>
    );
}
