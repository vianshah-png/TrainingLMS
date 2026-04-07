"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, ChevronRight, Sparkles, User, Leaf } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function NutripreneurLoginPage() {
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
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();
                if (profile?.role === 'nutripreneur') {
                    router.push("/nutripreneur");
                }
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

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.session.user.id)
            .single();

        if (profile?.role === 'nutripreneur') {
            router.push("/nutripreneur");
        } else {
            setError("This portal is exclusively for Nutripreneurs. Please use the correct login.");
            await supabase.auth.signOut();
            setLoading(false);
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
            const response = await fetch('/api/auth/nutripreneur-signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, fullName: fullName.trim() }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Signup failed');

            setSuccess("Welcome to the Nutripreneur Academy! You may now sign in.");
            setMode('login');
            setPassword("");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const BRAND_LIGHT = "#5B9A8B";
    const BRAND_GOLD = "#C9A84C";
    const BRAND_DEEP = "#0D2A1E";

    return (
        <main className="min-h-screen flex items-center justify-center p-6" style={{ background: `radial-gradient(circle at top left, #1A3A2A 0%, ${BRAND_DEEP} 100%)` }}>
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px]" style={{ background: BRAND_GOLD }} />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px]" style={{ background: BRAND_LIGHT }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="w-full max-w-md relative"
            >
                {/* Logo & Branding */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <motion.div
                        initial={{ scale: 0.7, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.2 }}
                        className="w-20 h-20 mb-6 flex items-center justify-center rounded-[1.75rem] shadow-2xl relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #1A3A2A, #2D5A3D)', border: '1px solid rgba(201,168,76,0.3)' }}
                    >
                        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,168,76,0.2), transparent 60%)' }} />
                        <Leaf size={36} className="relative z-10" style={{ color: '#C9A84C' }} />
                    </motion.div>

                    <div className="mb-2">
                        <h1 className="text-3xl font-serif mb-1" style={{ color: '#FAF7F0', letterSpacing: '-0.02em' }}>Nutripreneur Academy</h1>
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-2" style={{ color: '#C9A84C' }}>
                            <Sparkles size={10} className="animate-pulse" />
                            Elite Training Portal
                        </p>
                    </div>
                </div>

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="rounded-[2rem] p-8 relative overflow-hidden"
                    style={{
                        background: 'rgba(255,255,255,0.04)',
                        backdropFilter: 'blur(40px)',
                        border: '1px solid rgba(201,168,76,0.15)',
                        boxShadow: '0 40px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
                    }}
                >
                    {/* Mode Toggle */}
                    <div className="flex rounded-xl p-1 mb-8" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {(['login', 'signup'] as const).map((m) => (
                            <button
                                key={m}
                                onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                                className="flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                                style={mode === m
                                    ? { background: 'linear-gradient(135deg, #C9A84C, #A8843A)', color: '#0D2A1E', boxShadow: '0 4px 16px rgba(201,168,76,0.3)' }
                                    : { color: 'rgba(250,247,240,0.4)' }
                                }
                            >
                                {m === 'login' ? 'Sign In' : 'Join'}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.form
                            key={mode}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.25 }}
                            onSubmit={mode === 'login' ? handleLogin : handleSignup}
                            className="space-y-4"
                        >
                            {mode === 'signup' && (
                                <div>
                                    <label className="block text-[9px] font-bold uppercase tracking-[0.2em] mb-2 ml-1" style={{ color: 'rgba(250,247,240,0.4)' }}>Full Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors" size={15} style={{ color: 'rgba(201,168,76,0.5)' }} />
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Your full name"
                                            className="w-full rounded-xl py-3.5 pl-11 pr-4 text-xs font-medium outline-none transition-all"
                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,168,76,0.15)', color: '#FAF7F0' }}
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-[9px] font-bold uppercase tracking-[0.2em] mb-2 ml-1" style={{ color: 'rgba(250,247,240,0.4)' }}>Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2" size={15} style={{ color: 'rgba(201,168,76,0.5)' }} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@nutripreneur.com"
                                        className="w-full rounded-xl py-3.5 pl-11 pr-4 text-xs font-medium outline-none transition-all"
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,168,76,0.15)', color: '#FAF7F0' }}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[9px] font-bold uppercase tracking-[0.2em] mb-2 ml-1" style={{ color: 'rgba(250,247,240,0.4)' }}>Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2" size={15} style={{ color: 'rgba(201,168,76,0.5)' }} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Your password"
                                        className="w-full rounded-xl py-3.5 pl-11 pr-4 text-xs font-medium outline-none transition-all"
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,168,76,0.15)', color: '#FAF7F0' }}
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="text-[10px] font-bold text-red-400 rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="text-[10px] font-bold rounded-xl p-3" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: '#C9A84C' }}>
                                    {success}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 group transition-all mt-2"
                                style={{ background: 'linear-gradient(135deg, #C9A84C, #A8843A)', color: '#0D2A1E', boxShadow: '0 8px 24px rgba(201,168,76,0.25)' }}
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span className="uppercase tracking-widest text-[10px]">
                                            {mode === 'login' ? 'Enter Academy' : 'Begin Journey'}
                                        </span>
                                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </motion.form>
                    </AnimatePresence>
                </motion.div>

                {/* Back Link */}
                <p className="mt-6 text-center">
                    <button
                        onClick={() => router.push('/login')}
                        className="text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 mx-auto"
                        style={{ color: 'rgba(250,247,240,0.25)' }}
                    >
                        <ChevronRight size={12} className="rotate-180" />
                        Back to Portal Selection
                    </button>
                </p>

                <p className="mt-8 text-center text-[10px] italic" style={{ color: 'rgba(250,247,240,0.2)', lineHeight: 1.8 }}>
                    "Empowering nutrition entrepreneurs to build <br />a healthier world, one client at a time."
                </p>
            </motion.div>
        </main>
    );
}
