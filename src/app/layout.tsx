"use client";

import { Playfair_Display, Outfit } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import "./globals.css";
import { useState, useEffect, useRef } from "react";
import { Bell, LogOut, Loader2, Inbox } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Analytics } from "@vercel/analytics/react";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("Counsellor");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("interviewee");

  // Notification state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setIsAuthenticated(true);
        const name = session.user.user_metadata?.full_name || 'Counsellor';
        const role = session.user.user_metadata?.role || 'interviewee';
        setUserName(name);
        setUserEmail(session.user.email || '');
        setUserRole(role);

        // Safe Profile Sync: Only insert if missing to prevent overwriting admin-set data (phone, buddy)
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, role, full_name')
          .eq('id', session.user.id)
          .single();

        let finalRole = role; // Default to metadata role
        if (existingProfile) {
          finalRole = existingProfile.role || role;
          setUserRole(finalRole);
          if (existingProfile.full_name) setUserName(existingProfile.full_name);
        }

        if (!existingProfile) {
          await supabase.from('profiles').insert({
            id: session.user.id,
            email: session.user.email,
            full_name: name,
            role: role
          });
        }

        // Fetch notifications
        const { data: notifs } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        setNotifications(notifs || []);

        if (isLoginPage) {
          if (finalRole === 'admin' || finalRole === 'trainer buddy' || finalRole === 'moderator') {
            router.push("/admin");
          } else {
            router.push("/");
          }
        } else if (pathname.startsWith('/admin') && finalRole !== 'admin' && finalRole !== 'trainer buddy' && finalRole !== 'moderator') {
          router.push("/");
        }
      } else if (!isLoginPage) {
        router.push("/login");
      }
      setIsAuthChecked(true);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        const name = session.user.user_metadata?.full_name || 'Counsellor';
        const role = session.user.user_metadata?.role || 'counsellor';
        setUserName(name);
        setUserEmail(session.user.email || '');
        setUserRole(role);

        // Fetch notifications on sign in
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .then(({ data }) => setNotifications(data || []));

        if (isLoginPage) {
          if (role === 'admin' || role === 'trainer buddy' || role === 'moderator') {
            router.push("/admin");
          } else {
            router.push("/");
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUserName("Counsellor");
        setUserEmail("");
        setUserRole("interviewee");
        setNotifications([]);
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [isLoginPage, router, pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserRole("interviewee");
    router.push("/login");
  };

  const markNotificationRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Show nothing until auth is checked to prevent flickering
  if (!isAuthChecked) {
    return (
      <html lang="en">
        <body className="bg-[#FAFCEE] flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-[#00B6C1]" size={40} />
            <p className="text-[10px] font-bold text-[#0E5858]/40 uppercase tracking-[0.2em]">Verifying Session...</p>
          </div>
          <Analytics />
        </body>
      </html>
    );
  }

  // Pure login page without app shell
  if (isLoginPage) {
    return (
      <html lang="en">
        <body className={`${playfair.variable} ${outfit.variable} font-sans text-[#0E5858] bg-[#FAFCEE] antialiased overflow-x-hidden`}>
          {children}
          <Analytics />
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <title>Balance Nutrition | Counsellor LMS Premium</title>
        <meta name="description" content="The world's most trusted Indian health ecosystem counsellor portal." />
      </head>
      <body className={`${playfair.variable} ${outfit.variable} font-sans text-[#0E5858] bg-[#FAFCEE] antialiased overflow-x-hidden`}>
        <div className="flex min-h-screen">
          <Sidebar
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            userName={userName}
            userEmail={userEmail}
            userRole={userRole}
          />

          <div
            className={`flex-1 transition-all duration-500 ease-in-out ${isCollapsed ? 'ml-[88px]' : 'ml-[280px]'
              } relative overflow-hidden`}
          >
            {/* Top Bar */}
            <header className="sticky top-0 z-40 bg-[#FAFCEE]/80 backdrop-blur-xl border-b border-[#0E5858]/5 px-8 lg:px-12 py-6 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                  <span className="text-[10px] font-bold text-[#0E5858]/40 uppercase tracking-[0.2em]">Live Connection</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* Notification Bell with Dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`relative p-2 transition-colors ${showNotifications ? 'text-[#00B6C1]' : 'text-[#0E5858]/60 hover:text-[#0E5858]'}`}
                  >
                    <Bell size={22} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 rounded-full ring-2 ring-[#FAFCEE] flex items-center justify-center">
                        <span className="text-[8px] font-black text-white leading-none">{unreadCount > 9 ? '9+' : unreadCount}</span>
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute top-12 right-0 w-[360px] bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                      <div className="p-5 border-b border-gray-50 flex justify-between items-center">
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#0E5858]">Notifications</h4>
                        <div className="flex items-center gap-2">
                          {unreadCount > 0 && (
                            <span className="text-[8px] font-black uppercase tracking-widest text-[#00B6C1] bg-[#00B6C1]/10 px-2 py-0.5 rounded-full">{unreadCount} new</span>
                          )}
                          <Inbox size={14} className="text-gray-300" />
                        </div>
                      </div>

                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map(notify => (
                            <div
                              key={notify.id}
                              onClick={() => !notify.is_read && markNotificationRead(notify.id)}
                              className={`px-5 py-4 border-b border-gray-50 transition-all cursor-pointer hover:bg-gray-50/50 ${!notify.is_read
                                ? `border-l-4 ${notify.type === 'alert' ? 'border-l-red-500 bg-red-50/20' :
                                  notify.type === 'warning' ? 'border-l-orange-400 bg-orange-50/20' :
                                    'border-l-[#00B6C1] bg-[#00B6C1]/5'
                                }`
                                : ''
                                }`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <h5 className="text-[11px] font-bold text-[#0E5858] leading-tight pr-2">{notify.title}</h5>
                                <p className="text-[7px] font-black text-gray-300 uppercase shrink-0">
                                  {new Date(notify.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                              <p className="text-[10px] text-gray-500 leading-relaxed font-medium">{notify.message}</p>
                              {!notify.is_read && <div className="mt-2 w-1.5 h-1.5 rounded-full bg-[#00B6C1]"></div>}
                            </div>
                          ))
                        ) : (
                          <div className="py-16 text-center">
                            <Inbox size={32} className="text-gray-200 mx-auto mb-4" />
                            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">All caught up!</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-[#0E5858]/40 hover:text-red-500 transition-colors group relative"
                  title="Logout"
                >
                  <LogOut size={22} />
                  <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl pointer-events-none">Sign Out</span>
                </button>
              </div>
            </header>

            <main className="relative z-0 min-h-[calc(100vh-89px)]">
              {children}
            </main>

            {/* Subtle Gradient Background Blobs */}
            <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#00B6C1]/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
            <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FFCC00]/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          </div>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
