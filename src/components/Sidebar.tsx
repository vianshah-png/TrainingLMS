"use client";

import React from 'react';
import Link from 'next/link';
import {
    LayoutDashboard,
    GraduationCap,
    Info,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Bell,
    BarChart3,
    Award,
    CheckCircle2,
    UserPlus,
    ClipboardList,
    Shield
} from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Training Modules', href: '/training', icon: GraduationCap },
    { name: 'Content Bank', href: '/content-bank', icon: BarChart3 },
    { name: 'Program Info', href: '/program-info', icon: Info },
];

const adminNavItems = [
    { name: 'Dashboard Hub', href: '/admin?tab=hub', icon: Shield },
    { name: 'Training Modules', href: '/training', icon: GraduationCap },
    { name: 'Content Bank', href: '/content-bank', icon: BarChart3 },
    { name: 'Provision Keys', href: '/admin?tab=provisioning', icon: UserPlus },
    { name: 'Content Architect', href: '/admin?tab=architect', icon: LayoutDashboard },
    { name: 'Counsellor Registry', href: '/admin?tab=registry', icon: ClipboardList },
];

function getInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export default function Sidebar({ isCollapsed, setIsCollapsed, userName, userEmail, userRole }: {
    isCollapsed: boolean,
    setIsCollapsed: (v: boolean) => void,
    userName: string,
    userEmail: string,
    userRole: string
}) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const initials = getInitials(userName || 'M');

    // Use admin specific items if role is admin, trainer buddy, or moderator
    let currentNavItems = (userRole === 'admin' || userRole === 'trainer buddy' || userRole === 'moderator') ? adminNavItems : navItems;

    // Filter out restricted items for trainer buddies
    if (userRole === 'trainer buddy') {
        currentNavItems = currentNavItems.filter(item =>
            !item.href.includes('tab=provisioning') && !item.href.includes('tab=architect')
        );
    }

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 88 : 280 }}
            className="fixed left-0 top-0 h-screen bg-[#0E5858] text-white z-50 flex flex-col shadow-[10px_0_40px_rgba(14,88,88,0.2)]"
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

            {/* Toggle Button Inside */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-12 bg-[#00B6C1] text-white rounded-full p-1.5 shadow-xl border-2 border-[#FAFCEE] active:scale-95 transition-all z-50 hover:bg-[#0E5858]"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Logo Section */}
            <div className={`pt-10 pb-8 px-6 flex items-center shrink-0 ${isCollapsed ? 'justify-center' : 'justify-start gap-3'}`}>
                <div className="relative group shrink-0">
                    <div className="absolute inset-0 bg-[#00B6C1] rounded-[1.25rem] blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative w-14 h-14 flex items-center justify-center">
                        <img
                            src="/assets/BN_Logo-BlueBG-Square-HD.png"
                            alt="BN"
                            className="w-full h-full object-contain rounded-2xl shadow-2xl relative z-10"
                        />
                    </div>
                </div>
                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col"
                    >
                        <span className="font-serif font-bold text-xl leading-none">
                            Balance <span className="text-[#00B6C1]">Nutrition</span>
                        </span>
                        <span className="text-[10px] text-[#00B6C1] font-bold tracking-[0.2em] uppercase mt-1 opacity-70">Counsellor Academy</span>
                    </motion.div>
                )}
            </div>

            {/* Status Badge */}
            {!isCollapsed && (
                <div className="px-6 mb-6">
                    <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-4 flex items-center justify-between group hover:bg-white/10 transition-all cursor-default overflow-hidden relative">
                        <div>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Account Status</p>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={18} className="text-green-400" />
                                <span className="text-base font-bold font-serif">Active</span>
                            </div>
                        </div>
                        <div className="bg-green-500/20 p-2 rounded-full">
                            <Bell size={16} className="text-green-400" />
                        </div>
                    </div>
                </div>
            )}

            {isCollapsed && (
                <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-green-400 border border-white/10">
                        <CheckCircle2 size={24} />
                    </div>
                </div>
            )}

            {/* Nav Items */}
            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
                {currentNavItems.map((item) => {
                    const isActive = pathname === item.href || (item.href.includes('?') ? pathname === item.href.split('?')[0] : pathname === item.href);

                    // Better tab detection using useSearchParams
                    const tabParam = item.href.split('tab=')[1];
                    const currentTab = searchParams.get('tab');
                    const isTabActive = tabParam && currentTab === tabParam;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative ${isActive || isTabActive
                                ? 'bg-gradient-to-r from-[#00B6C1] to-[#00B6C1]/80 text-white shadow-[0_10px_20px_-5px_rgba(0,182,193,0.4)]'
                                : 'text-[#FAFCEE]/40 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            {(isActive || isTabActive) && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute left-0 w-1.5 h-6 bg-white rounded-r-full"
                                />
                            )}
                            <item.icon size={22} className={`shrink-0 transition-transform duration-500 ${(isActive || isTabActive) ? 'scale-110' : 'group-hover:scale-110'}`} />
                            {!isCollapsed && (
                                <span className={`font-medium transition-all ${(isActive || isTabActive) ? 'text-white' : ''}`}>
                                    {item.name}
                                </span>
                            )}

                            {isCollapsed && (
                                <div className="absolute left-24 bg-[#0E5858] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap border border-white/10 z-[100]">
                                    {item.name}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile - Real User */}
            <div className={`p-6 border-t border-white/5 bg-black/5 mt-auto group cursor-pointer`}>
                <div className={`flex items-center gap-4 ${isCollapsed ? 'justify-center pr-2' : ''}`}>
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#FFCC00] blur-md opacity-20 group-hover:opacity-60 transition-opacity"></div>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFCC00] to-[#E5B800] flex items-center justify-center text-[#0E5858] font-bold shrink-0 shadow-lg relative z-10 text-lg">
                            {initials}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#0E5858] rounded-full z-20"></div>
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0 pr-4">
                            <h4 className="font-serif font-bold truncate text-sm">{userName || 'Counsellor'}</h4>
                            <p className="text-[10px] text-white/40 truncate font-medium">{userEmail || 'academy@balancenutrition.in'}</p>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className={`p-2 bg-white/5 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all ${isCollapsed ? 'hidden' : ''}`}
                    >
                        <LogOut size={18} />
                    </button>
                    {isCollapsed && (
                        <button
                            onClick={handleLogout}
                            className={`absolute hidden group-hover:flex items-center justify-center p-2 bg-red-500 text-white rounded-xl left-24 shadow-2xl z-[100]`}
                        >
                            <LogOut size={16} />
                        </button>
                    )}
                </div>
            </div>
        </motion.aside>
    );
}
