"use client";

import { useRouter, usePathname } from "next/navigation";
import { Home, BookOpen, Zap, Play, TrendingUp } from "lucide-react";

const NAV_ITEMS = [
    { label: "Home", icon: Home, href: "/nutripreneur" },
    { label: "Learn", icon: BookOpen, href: "/nutripreneur/content-bank" },
    { label: "Quizzes", icon: Zap, href: "/nutripreneur/quizzes" },
    { label: "Media", icon: Play, href: "/nutripreneur/reels" },
    { label: "Impact", icon: TrendingUp, href: "/nutripreneur/progress" },
];

export default function NutripreneurNav() {
    const router = useRouter();
    const pathname = usePathname();

    const BRAND_GOLD = "#C9A84C";
    const BRAND_LIGHT = "#5B9A8B";

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-5 pt-2"
            style={{ background: 'linear-gradient(0deg, #0D2A1E 80%, transparent)' }}
        >
            <div
                className="max-w-lg mx-auto flex items-center justify-around rounded-[2rem] px-2 py-2"
                style={{
                    background: 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 -10px 40px rgba(0,0,0,0.3)'
                }}
            >
                {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
                    const isActive = pathname === href;
                    return (
                        <button
                            key={label}
                            onClick={() => router.push(href)}
                            className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all"
                            style={{
                                background: isActive ? `rgba(201,168,76,0.12)` : 'transparent',
                                minWidth: 56
                            }}
                        >
                            <Icon
                                size={20}
                                style={{ color: isActive ? BRAND_GOLD : 'rgba(250,247,240,0.3)', transition: 'color 0.25s' }}
                            />
                            <span
                                className="text-[8px] font-black uppercase tracking-widest"
                                style={{ color: isActive ? BRAND_GOLD : 'rgba(250,247,240,0.25)' }}
                            >
                                {label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
