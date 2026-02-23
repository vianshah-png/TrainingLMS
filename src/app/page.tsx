"use client";

import {
  ArrowRight,
  Trophy,
  Clock,
  BookOpen,
  CheckCircle2,
  FileSpreadsheet,
  Sparkles,
  Target,
  User,
  Activity,
  Share2,
  Layers,
  Leaf,
  Briefcase,
  ListChecks,
  ShoppingBag,
  Globe
} from "lucide-react";
import { useRouter } from "next/navigation";
import { syllabusData } from "@/data/syllabus";
import { motion, Variants } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [userStats, setUserStats] = useState({ progress: 0, avgScore: 0, quizzes: 0 });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [trainingBuddy, setTrainingBuddy] = useState<string>("");
  const [dynamicContent, setDynamicContent] = useState<any[]>([]);

  useEffect(() => {
    const fetchPersonalStats = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      setUserName(session.user.user_metadata?.full_name || "Counsellor");

      // 0. Fetch Profile for Training Buddy
      const { data: profile } = await supabase
        .from('profiles')
        .select('training_buddy')
        .eq('id', session.user.id)
        .single();

      if (profile?.training_buddy) {
        setTrainingBuddy(profile.training_buddy);
      }

      // 1. Fetch Dynamic Content Metadata (to count total topics)
      const { data: dynContent } = await supabase
        .from('syllabus_content')
        .select('id, module_id');

      const dynamicCount = dynContent?.length || 0;
      setDynamicContent(dynContent || []);

      // 2. Fetch Assessment Scores
      const { data: assessments } = await supabase
        .from('assessment_logs')
        .select('*')
        .eq('user_id', session.user.id);

      // 3. Fetch Detailed Topic Progress
      const { data: topicProgress, error: tpError } = await supabase
        .from('mentor_progress')
        .select('topic_code')
        .eq('user_id', session.user.id);

      const completedTopicCodes = new Set(topicProgress?.map(p => p.topic_code) || []);
      const dbCompletedModules: string[] = [];
      const dynamicArray = dynContent || [];

      // Calculate which modules are done based on syllabus (static) + dynamic topics
      syllabusData.forEach(module => {
        const dynamicForModule = dynamicArray.filter(d => d.module_id === module.id);

        const staticTopicsDone = module.topics.every(t => completedTopicCodes.has(t.code));
        const dynamicTopicsDone = dynamicForModule.every(d => completedTopicCodes.has(`DYN-${d.id}`));

        const hasContent = module.topics.length > 0 || dynamicForModule.length > 0;

        if (staticTopicsDone && dynamicTopicsDone && hasContent) {
          dbCompletedModules.push(module.id);
        }
      });

      setCompletedModules(dbCompletedModules);

      // Total Topics = Static Syllabus + Dynamic Content
      const totalStaticTopics = syllabusData.reduce((acc, m) => acc + m.topics.length, 0);
      const totalTopics = totalStaticTopics + dynamicCount;

      const compositeProgress = totalTopics > 0 ? Math.round((completedTopicCodes.size / totalTopics) * 100) : 0;

      if (assessments && assessments.length > 0) {
        const avgScore = Math.round((assessments.reduce((acc: number, curr: any) => acc + (curr.score / curr.total_questions), 0) / assessments.length) * 100);

        setUserStats({
          progress: compositeProgress,
          avgScore,
          quizzes: assessments.length
        });
      } else {
        setUserStats(prev => ({ ...prev, progress: compositeProgress }));
      }

      setLoading(false);
    };
    fetchPersonalStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAFCEE]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#0E5858]/10 border-t-[#00B6C1] rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-[#0E5858]/30 uppercase tracking-[0.2em]">Synchronizing Your Dashboard...</p>
        </div>
      </div>
    );
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <main className="min-h-screen bg-[#FAFCEE] p-6 lg:p-12 relative overflow-hidden">
      {/* Premium Background Blobs */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#00B6C1]/5 rounded-full blur-[120px] -z-10"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#FFCC00]/5 rounded-full blur-[100px] -z-10"></div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto"
      >
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[#0E5858] rounded-2xl flex items-center justify-center text-white shadow-xl">
                <User size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-serif text-[#0E5858]">Welcome back, {userName}</h1>
                <p className="text-[10px] font-black text-[#00B6C1] uppercase tracking-[0.3em]">clinical proficiency track</p>
              </div>
            </div>
          </motion.div>

          {/* Top Stats Cards */}
          <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
            <div className="bg-white px-6 py-4 rounded-3xl shadow-sm border border-[#0E5858]/5 flex items-center gap-4 min-w-[170px]">
              <div className="w-10 h-10 rounded-2xl bg-[#00B6C1]/10 text-[#00B6C1] flex items-center justify-center">
                <Briefcase size={18} />
              </div>
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Mentor Buddy</p>
                <p className="text-lg font-serif text-[#0E5858] truncate max-w-[100px]">{trainingBuddy || 'Unassigned'}</p>
              </div>
            </div>
            <div className="bg-white px-6 py-4 rounded-3xl shadow-sm border border-[#0E5858]/5 flex items-center gap-4 min-w-[170px]">
              <div className="w-10 h-10 rounded-2xl bg-[#00B6C1]/10 text-[#00B6C1] flex items-center justify-center">
                <Trophy size={18} />
              </div>
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Mastery Score</p>
                <p className="text-lg font-serif text-[#0E5858]">{userStats.avgScore}%</p>
              </div>
            </div>
            <div className="bg-white px-6 py-4 rounded-3xl shadow-sm border border-[#0E5858]/5 flex items-center gap-4 min-w-[170px]">
              <div className="w-10 h-10 rounded-2xl bg-[#FFCC00]/10 text-[#FFCC00] flex items-center justify-center">
                <Activity size={18} />
              </div>
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Tests Taken</p>
                <p className="text-lg font-serif text-[#0E5858]">{userStats.quizzes}</p>
              </div>
            </div>
          </motion.div>
        </header>

        {/* Hero Section: Progress Tracking */}
        <motion.section variants={itemVariants} className="mb-16">
          <div className="relative isolate group p-8 lg:p-12 bg-[#0E5858] rounded-[3.5rem] shadow-3xl shadow-[#0E5858]/30 overflow-hidden text-white">
            <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[150%] bg-[#00B6C1]/10 rounded-full blur-[100px] -z-10 group-hover:scale-110 transition-transform duration-1000"></div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00B6C1]/20 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6">
                  <Sparkles size={12} className="text-[#00B6C1]" />
                  Session Highlight
                </div>
                <h2 className="text-5xl lg:text-6xl font-serif mb-6 leading-tight">Master the Art of <br />Clinical Consultation</h2>
                <button
                  onClick={() => router.push('/modules/module-4')}
                  className="px-8 py-4 bg-[#00B6C1] text-[#0E5858] rounded-2xl font-bold shadow-2xl hover:bg-white transition-all flex items-center gap-3 group/btn"
                >
                  Jump to Module 4
                  <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-xs font-medium text-white/60 mb-1">Current Mastery Progress</p>
                    <h3 className="text-4xl font-serif">{userStats.progress}%</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-[#00B6C1] uppercase tracking-widest">{completedModules.length}/{syllabusData.length} Modules</p>
                  </div>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-8">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${userStats.progress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-[#00B6C1] to-[#FFCC00]"
                  ></motion.div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Baseline</p>
                    <p className="text-xs font-bold text-white/80">Static 74</p>
                  </div>
                  <div className="text-center border-x border-white/10">
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Quizzes</p>
                    <p className="text-xs font-bold text-white/80">Active AI</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Growth</p>
                    <p className="text-xs font-bold text-[#00B6C1]">Dynamic</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Modules Grid */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-serif text-[#0E5858]">Expertise Modules</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Self-Paced Clinical Mastery</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {syllabusData.map((module, index) => {
              const isCompleted = completedModules.includes(module.id);
              return (
                <motion.div
                  key={module.id}
                  whileHover={{ y: -8 }}
                  onClick={() => router.push(`/modules/${module.id}`)}
                  className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-transparent hover:border-[#00B6C1]/20 transition-all cursor-pointer group flex flex-col justify-between min-h-[300px]"
                >
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 bg-[#FAFCEE] rounded-2xl flex items-center justify-center text-[#0E5858] group-hover:bg-[#0E5858] group-hover:text-white transition-all duration-500">
                        <BookOpen size={24} />
                      </div>
                      {isCompleted && (
                        <div className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-green-100 flex items-center gap-1">
                          <CheckCircle2 size={10} /> Complete
                        </div>
                      )}
                    </div>

                    <h4 className="text-[10px] font-black text-[#00B6C1] uppercase tracking-[0.3em] mb-2">Module {index + 1}</h4>
                    <h3 className="text-xl font-serif text-[#0E5858] mb-4 group-hover:text-[#00B6C1] transition-colors">{module.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{module.description}</p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[10px] font-bold text-gray-300">
                      <span className="flex items-center gap-1.5">
                        <ListChecks size={12} />
                        {module.topics.length + (dynamicContent.filter((d: any) => d.module_id === module.id).length || 0)} Sections
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-300 group-hover:bg-[#00B6C1] group-hover:border-transparent group-hover:text-white transition-all">
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Quick Links Footer */}
        <motion.section variants={itemVariants} className="mt-20 pt-12 border-t border-gray-100 grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {[
            { title: 'Content Bank', icon: ShoppingBag, url: '/content-bank' },
            { title: 'Peer Audits', icon: Share2, url: '#' },
            { title: 'Certifications', icon: Trophy, url: '#' },
            { title: 'Clinical Log', icon: FileSpreadsheet, url: '#' }
          ].map((link, i) => (
            <button
              key={i}
              onClick={() => router.push(link.url)}
              className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[#00B6C1] transition-colors">
                <link.icon size={18} />
              </div>
              <span className="text-xs font-bold text-[#0E5858] uppercase tracking-widest">{link.title}</span>
            </button>
          ))}
        </motion.section>
      </motion.div >
    </main >
  );
}
