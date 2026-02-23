"use client";

import { motion, Variants } from "framer-motion";
import { Info, Target, Award, Users, ShieldCheck, Heart } from "lucide-react";

export default function ProgramInfoPage() {
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <motion.main
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="p-8 lg:p-12 max-w-7xl mx-auto"
        >
            <header className="mb-20 text-center max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FAFCEE] border border-[#00B6C1]/20 rounded-full text-[#00B6C1] text-xs font-bold uppercase tracking-widest mb-6">
                    <Info size={14} />
                    <span>Academy Overview</span>
                </div>
                <h1 className="text-5xl lg:text-7xl font-serif text-[#0E5858] mb-8 leading-tight">
                    The Balance Nutrition <span className="text-[#00B6C1]">Standard</span>
                </h1>
                <p className="text-xl text-gray-500 leading-relaxed italic">
                    "Expertise in counselling practice, empathy in client care, and excellence in onboarding protocols."
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-20">
                {[
                    { title: 'Our Mission', text: 'To empower counselors with scientific precision and compassionate counselling skills.', icon: Target },
                    { title: 'Quality Framework', text: 'Every consultation follows the 32-point global nutrition standard verified by BN.', icon: ShieldCheck },
                    { title: 'Counsellor Growth', text: 'A pathway designed to take you from specialized trainee to Senior Counselling Lead.', icon: Award },
                ].map((item, i) => (
                    <motion.div key={i} variants={itemVariants} className="premium-card p-10 group">
                        <div className="w-16 h-16 bg-[#0E5858] text-[#00B6C1] rounded-[1.5rem] flex items-center justify-center mb-8 shadow-xl group-hover:rotate-6 transition-all">
                            <item.icon size={28} />
                        </div>
                        <h3 className="text-2xl font-bold text-[#0E5858] mb-4">{item.title}</h3>
                        <p className="text-gray-500 font-medium leading-relaxed">{item.text}</p>
                    </motion.div>
                ))}
            </div>

            <section className="bg-[#0E5858] rounded-[3rem] p-12 lg:p-20 text-white relative overflow-hidden shadow-3xl">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white opacity-[0.03] rounded-full blur-3xl -mr-[200px] -mt-[200px]"></div>
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div>
                        <h2 className="text-4xl lg:text-5xl font-serif mb-8 leading-tight">The Ecosystem of <br /><span className="text-[#00B6C1]">Success</span></h2>
                        <div className="space-y-8">
                            <div className="flex gap-6">
                                <div className="shrink-0 w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-[#00B6C1]"><Users size={24} /></div>
                                <div>
                                    <h4 className="font-bold text-xl mb-2">Counselor Community</h4>
                                    <p className="text-white/60 font-medium">Join 200+ elite dieticians sharing industry insights daily.</p>
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <div className="shrink-0 w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-[#00B6C1]"><Heart size={24} /></div>
                                <div>
                                    <h4 className="font-bold text-xl mb-2">Patient First Approach</h4>
                                    <p className="text-white/60 font-medium">Our technology exists only to serve the human connection.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10">
                        <p className="text-lg font-serif italic text-white/80 leading-relaxed mb-8">
                            "At Balance Nutrition, we don't just provide diets. We provide life transformations through scientific coaching and deep psychological understanding of patient behavior."
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#00B6C1] to-[#0E5858]"></div>
                            <div>
                                <p className="font-bold">Khyati Rupani</p>
                                <p className="text-[10px] text-[#00B6C1] font-bold uppercase tracking-widest">Founder & Lead</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </motion.main>
    );
}
