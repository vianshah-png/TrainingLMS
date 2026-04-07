"use client";

import { Playfair_Display, Outfit } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import "./globals.css";
import { useState, useEffect } from "react";
import { Bell, LogOut, Loader2 } from "lucide-react";
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

        // Sync profile
        await supabase.from('profiles').upsert({
          id: session.user.id,
          email: session.user.email,
          full_name: name,
          role: role
        });

        if (isLoginPage) {
          if (role === 'admin') {
            router.push("/admin");
          } else {
            router.push("/");
          }
        } else if (pathname.startsWith('/admin') && role !== 'admin') {
          // Access control: non-admins cannot access admin routes
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

        if (isLoginPage) {
          if (role === 'admin') {
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
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [isLoginPage, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserRole("interviewee");
    router.push("/login");
  };

  const isNutripreneurPage = pathname.startsWith("/nutripreneur");
  const isNutripreneur = userRole === "nutripreneur";

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
          {!isNutripreneurPage && (
            <Sidebar
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
              userName={userName}
              userEmail={userEmail}
              userRole={userRole}
            />
          )}

          <div
            className={`flex-1 transition-all duration-500 ease-in-out ${(isNutripreneurPage || isNutripreneur) ? 'ml-0' : (isCollapsed ? 'ml-[88px]' : 'ml-[280px]')
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
                <button className="relative p-2 text-[#0E5858]/60 hover:text-[#0E5858] transition-colors">
                  <Bell size={22} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-[#FFCC00] rounded-full ring-2 ring-[#FAFCEE]"></span>
                </button>
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
