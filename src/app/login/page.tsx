"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, ChevronRight, Sparkles, UserCheck, User, ShieldCheck, Briefcase, Leaf } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
    const [view, setView] = useState<'selection' | 'form'>('selection');
    const [selectedRole, setSelectedRole] = useState<'interviewee' | 'admin' | 'nutripreneur'>('interviewee');
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.push("/");
            }
        };
        checkUser();
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        const { error: authError, data } = await supabase.auth.signInWithPassword({ email, password });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        // Fetch profile to determine correct destination
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.session.user.id)
            .single();

        const role = profile?.role;

        if (role === 'nutripreneur') {
            router.push('/nutripreneur');
        } else if (role === 'admin' || role === 'moderator') {
            router.push('/admin');
        } else {
            router.push('/');
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        if (!fullName.trim()) {
            setError("Please enter your full name.");
            setLoading(false);
            return;
        }

        try {
            // Route signup to the correct API based on selected portal
            const endpoint = selectedRole === 'nutripreneur'
                ? '/api/auth/nutripreneur-signup'
                : '/api/auth/signup';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, fullName: fullName.trim() }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Signup failed');

            setSuccess(
                selectedRole === 'nutripreneur'
                    ? 'Welcome to the Nutripreneur Academy! You can now sign in.'
                    : 'Account created successfully! You can now log in.'
            );
            setMode('login');
            setPassword("");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const enterForm = (role: 'interviewee' | 'admin' | 'nutripreneur') => {
        setSelectedRole(role);
        // Admin-only: no signup for security
        if (role === 'admin') {
            setMode('login');
        }
        setView('form');
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#FAFCEE]">
            {/* Premium Background Blobs */}
            <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#00B6C1]/5 rounded-full blur-[120px] -z-10 animate-pulse"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#FFCC00]/5 rounded-full blur-[100px] -z-10"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-4xl relative"
            >
                <div className="flex flex-col items-center mb-12 text-center">
                    <motion.div
                        initial={{ scale: 0.8, rotate: -5 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="w-20 h-20 mb-6 flex items-center justify-center bg-[#0E5858] rounded-[2rem] shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#00B6C1]/20 to-transparent"></div>
                        <img src="/assets/BN_Logo-BlueBG-Square-HD.png" alt="BN Logo" className="w-full h-full object-contain p-3 rounded-xl group-hover:scale-110 transition-transform duration-500 relative z-10" />
                    </motion.div>

                    <h1 className="text-4xl font-serif text-[#0E5858] mb-2 tracking-tight">Balance Nutrition LMS</h1>
                    <p className="text-[10px] font-bold text-[#00B6C1] uppercase tracking-[0.4em] flex items-center gap-2">
                        <Sparkles size={12} className="animate-pulse" />
                        clinical mastery portal
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {view === 'selection' ? (
                        <motion.div
                            key="selection"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-6"
                        >
                            {/* Path 1: Counsellors */}
                            <div
                                onClick={() => enterForm('interviewee')}
                                className="premium-card p-10 bg-white/70 backdrop-blur-2xl border border-white hover:border-[#00B6C1]/30 transition-all cursor-pointer group"
                            >
                                <div className="w-16 h-16 bg-[#FAFCEE] rounded-2xl flex items-center justify-center text-[#00B6C1] mb-6 group-hover:bg-[#00B6C1] group-hover:text-white transition-all">
                                    <UserCheck size={32} />
                                </div>
                                <h2 className="text-2xl font-serif text-[#0E5858] mb-3">LMS For Counsellors</h2>
                                <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed">
                                    Specialized training environment for new interviewees and upcoming clinical counsellors.
                                </p>
                                <button className="flex items-center gap-2 text-[#00B6C1] text-xs font-bold uppercase tracking-widest group-hover:translate-x-2 transition-all">
                                    Enter Pathway <ChevronRight size={16} />
                                </button>
                            </div>

                            {/* Path 2: Nutripreneur Academy */}
                            <div
                                onClick={() => enterForm('nutripreneur')}
                                className="premium-card p-10 border border-white cursor-pointer group flex flex-col transition-all overflow-hidden relative"
                                style={{ background: 'linear-gradient(135deg, #0D2A1E, #1A3A2A)', borderColor: 'rgba(201,168,76,0.25)' }}
                            >
                                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle at top right, #C9A84C, transparent 60%)' }} />
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl relative z-10 transition-all group-hover:scale-110"
                                    style={{ background: 'linear-gradient(135deg, #C9A84C, #A8843A)' }}>
                                    <Leaf size={32} style={{ color: '#0D2A1E' }} />
                                </div>
                                <h2 className="text-2xl font-serif mb-3 relative z-10" style={{ color: '#FAF7F0' }}>Nutripreneur Academy</h2>
                                <p className="text-sm font-medium mb-8 leading-relaxed relative z-10" style={{ color: 'rgba(250,247,240,0.5)' }}>
                                    Elite entrepreneurial training for health educators building India's nutrition economy.
                                </p>
                                <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest group-hover:translate-x-2 transition-all relative z-10" style={{ color: '#C9A84C' }}>
                                    Enter Academy <ChevronRight size={16} />
                                </button>
                            </div>

                            {/* Path 3: Admin Portal */}
                            <div
                                onClick={() => enterForm('admin')}
                                className="premium-card p-10 bg-white/40 border border-white hover:border-[#00B6C1]/30 transition-all cursor-pointer group flex flex-col items-center justify-center text-center gap-4"
                            >
                                <div className="w-16 h-16 bg-[#0E5858] text-white rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                    <ShieldCheck size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-serif text-[#0E5858] mb-2">Admin Portal</h3>
                                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                        System control, user management, and global oversight.
                                    </p>
                                </div>
                                <button className="flex items-center gap-2 text-[#00B6C1] text-xs font-bold uppercase tracking-widest mt-4">
                                    Access Control <ChevronRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-md mx-auto"
                        >
                            <div className="premium-card p-10 bg-white/70 backdrop-blur-2xl border border-white relative isolate">
                                <button
                                    onClick={() => setView('selection')}
                                    className="absolute top-6 left-6 text-[#0E5858]/40 hover:text-[#0E5858] transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                                >
                                    <ChevronRight size={14} className="rotate-180" /> Back
                                </button>

                                <div className="text-center mt-4 mb-8">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FAFCEE] border border-[#0E5858]/5 rounded-full mb-4">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#00B6C1]"></span>
                                        <span className="text-[9px] font-bold text-[#0E5858] uppercase tracking-widest">
                                            {selectedRole === 'interviewee' ? 'Counsellor' : selectedRole === 'nutripreneur' ? 'Nutripreneur Academy' : 'Admin'} Session
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-serif text-[#0E5858]">
                                        {mode === 'login' ? 'Welcome Back' : 'Get Started'}
                                    </h2>
                                </div>

                                {(selectedRole === 'interviewee' || selectedRole === 'nutripreneur') && (
                                    <div className="flex rounded-2xl p-1 mb-8 border"
                                        style={selectedRole === 'nutripreneur'
                                            ? { background: 'rgba(201,168,76,0.08)', borderColor: 'rgba(201,168,76,0.2)' }
                                            : { background: '#FAFCEE', borderColor: 'rgba(14,88,88,0.05)' }
                                        }
                                    >
                                        <button
                                            onClick={() => setMode('login')}
                                            className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'login'
                                                ? (selectedRole === 'nutripreneur' ? 'text-[#0D2A1E] shadow-lg' : 'bg-[#0E5858] text-white shadow-lg')
                                                : 'text-[#0E5858]/40'}`}
                                            style={mode === 'login' && selectedRole === 'nutripreneur' ? { background: 'linear-gradient(135deg, #C9A84C, #A8843A)' } : {}}
                                        > Log In </button>
                                        <button
                                            onClick={() => setMode('signup')}
                                            className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'signup'
                                                ? (selectedRole === 'nutripreneur' ? 'text-[#0D2A1E] shadow-lg' : 'bg-[#0E5858] text-white shadow-lg')
                                                : 'text-[#0E5858]/40'}`}
                                            style={mode === 'signup' && selectedRole === 'nutripreneur' ? { background: 'linear-gradient(135deg, #C9A84C, #A8843A)' } : {}}
                                        > Join </button>
                                    </div>
                                )}

                                <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
                                    {mode === 'signup' && (
                                        <div>
                                            <label className="block text-[9px] font-bold text-[#0E5858]/40 uppercase tracking-[0.2em] mb-2 ml-1">Full Name</label>
                                            <div className="relative group">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0E5858]/20 group-focus-within:text-[#00B6C1] transition-colors" size={16} />
                                                <input
                                                    type="text"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    placeholder="Your full name"
                                                    className="w-full bg-white border border-[#0E5858]/10 rounded-xl py-3.5 pl-11 pr-4 text-xs font-medium focus:ring-2 focus:ring-[#00B6C1]/10 focus:border-[#00B6C1] transition-all"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-[9px] font-bold text-[#0E5858]/40 uppercase tracking-[0.2em] mb-2 ml-1">Email Address</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0E5858]/20 group-focus-within:text-[#00B6C1] transition-colors" size={16} />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="you@company.com"
                                                className="w-full bg-white border border-[#0E5858]/10 rounded-xl py-3.5 pl-11 pr-4 text-xs font-medium focus:ring-2 focus:ring-[#00B6C1]/10 focus:border-[#00B6C1] transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[9px] font-bold text-[#0E5858]/40 uppercase tracking-[0.2em] mb-2 ml-1">Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0E5858]/20 group-focus-within:text-[#00B6C1] transition-colors" size={16} />
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Password"
                                                className="w-full bg-white border border-[#0E5858]/10 rounded-xl py-3.5 pl-11 pr-4 text-xs font-medium focus:ring-2 focus:ring-[#00B6C1]/10 focus:border-[#00B6C1] transition-all"
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                    </div>

                                    {error && <div className="text-[10px] font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">{error}</div>}
                                    {success && <div className="text-[10px] font-bold text-green-600 bg-green-50 p-3 rounded-xl border border-green-100">{success}</div>}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-[#0E5858] text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-[#00B6C1] transition-all flex items-center justify-center gap-2 group mt-4"
                                    >
                                        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                                            <>
                                                <span className="uppercase tracking-widest text-[10px]">{mode === 'login' ? 'Access Dashboard' : 'Join Academy'}</span>
                                                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>

                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <p className="mt-12 text-center text-[10px] text-[#0E5858]/30 font-medium tracking-[0.1em] italic leading-relaxed max-w-[280px] mx-auto">
                    "The world's most trusted Indian health ecosystem counsellor portal."
                </p>
            </motion.div>
        </main>
    );
}
