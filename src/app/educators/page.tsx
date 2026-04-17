"use client";

import { motion, Variants } from "framer-motion";
import {
  Search, Users, Activity, Target, Droplets, Leaf, Heart, Sparkles,
  Video, Trophy, ClipboardList, Phone, Flame, Baby, Stethoscope,
  Lightbulb, BookOpen, Mic, TrendingUp, Dumbbell
} from "lucide-react";
import { useState, useMemo, useCallback, useEffect } from "react";
import { CLEAN_POSTS, CleanPost, ContentCategory } from "@/data/social_content_clean";
import ContentCard from "@/components/ContentCard";
import ContentModal from "@/components/ContentModal";
import EducatorsTour from "@/components/EducatorsTour";

// ── Health Filter Tabs — 8 official conditions + All ────────────────────────
const HEALTH_CONDITIONS: { id: string; label: string; icon: React.ElementType; maps: string[] }[] = [
  { id: "all", label: "All Content", icon: Users, maps: [] },
  { id: "wellness", label: "General Wellness", icon: Sparkles, maps: ["General"] },
  { id: "transformation", label: "Body Transformation", icon: TrendingUp, maps: [] },
  { id: "sculpting", label: "Body Sculpting", icon: Dumbbell, maps: [] },
  { id: "pcos", label: "PCOS", icon: Droplets, maps: ["PCOS"] },
  { id: "pregnancy", label: "Pregnancy", icon: Baby, maps: ["Pregnancy"] },
  { id: "menopause", label: "Menopause", icon: Flame, maps: ["Menopause"] },
  { id: "diabetes", label: "Diabetes", icon: Target, maps: ["Diabetes"] },
  { id: "thyroid", label: "Thyroid", icon: Activity, maps: ["Thyroid"] },
  { id: "cardiac", label: "Cardiac", icon: Heart, maps: ["Cardiac"] },
  { id: "gut", label: "Gut & GI", icon: Leaf, maps: ["Gut Health"] },
  { id: "child", label: "Child Nutrition", icon: Stethoscope, maps: ["Child Nutrition"] },
];

// ── Kanban Column Definitions (mapped to PostSubType) ─────────────────────
type ColumnId = "videos" | "gyan" | "recipes" | "success" | "podcasts" | "challenges";

const KANBAN_COLUMNS: {
  id: ColumnId;
  title: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  description: string;
  filter: (p: CleanPost) => boolean;
}[] = [
    {
      id: "videos",
      title: "Videos & Reads",
      icon: Video,
      color: "text-blue-500",
      bg: "bg-blue-50",
      description: "Video reels, YouTube & articles",
      filter: (p) => (p.mediaType === "reel" && p.videoType === "cloudinary") || p.videoType === "youtube",
    },
    {
      id: "gyan",
      title: "Gyan & Tips",
      icon: Lightbulb,
      color: "text-amber-500",
      bg: "bg-amber-50",
      description: "Gyans, Did You Know, Tips",
      filter: (p) => p.subType === "Gyan" || p.subType === "Tips",
    },
    {
      id: "recipes",
      title: "Recipes",
      icon: BookOpen,
      color: "text-green-500",
      bg: "bg-green-50",
      description: "Healthy Recipes & What I Eat",
      filter: (p) => p.subType === "Recipe",
    },
    {
      id: "success",
      title: "Success Stories",
      icon: Trophy,
      color: "text-yellow-500",
      bg: "bg-yellow-50",
      description: "Transformations & Feedback",
      filter: (p) => p.subType === "Success Story",
    },
    {
      id: "podcasts",
      title: "Podcasts",
      icon: Mic,
      color: "text-purple-500",
      bg: "bg-purple-50",
      description: "Podcast Snippets & Episodes",
      filter: (p) => p.subType === "Podcast",
    },
    {
      id: "challenges",
      title: "Challenges",
      icon: ClipboardList,
      color: "text-[#0E5858]",
      bg: "bg-[#0E5858]/10",
      description: "Day-by-day challenges",
      filter: (p) => p.subType === "Challenge",
    },
  ];

// ── Main Page ──────────────────────────────────────────────────────────────
export default function EducatorsModulePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedPost, setSelectedPost] = useState<CleanPost | null>(null);
  const [clientPhone, setClientPhone] = useState("");
  const [tempPhone, setTempPhone] = useState("");
  const [showTour, setShowTour] = useState(false);

  // Check if educators tour should be shown
  useEffect(() => {
    const pending = localStorage.getItem('educators_tour_pending');
    const completed = localStorage.getItem('educators_tour_completed');
    if (pending && !completed) {
      setShowTour(true);
    }
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  // ── Active category filter mapping ───────────────────────────────────────
  const activeCondition = HEALTH_CONDITIONS.find((c) => c.id === activeTab)!;

  // ── Filtered posts: health tab + search ─────────────────────────────────
  const filteredPosts = useMemo(() => {
    let posts = CLEAN_POSTS;

    if (activeCondition.id !== "all") {
      posts = posts.filter((p) => {
        // Direct category map match
        if (activeCondition.maps.length > 0 && activeCondition.maps.includes(p.category)) {
          return true;
        }

        // Special Semantic matches for the new tabs
        const searchText = `${p.title} ${p.descriptionPlain} ${p.tags.join(" ")}`.toLowerCase();

        if (activeCondition.id === "transformation") {
          return p.subType === "Success Story" || searchText.includes("transformation") || searchText.includes("lost");
        }
        if (activeCondition.id === "sculpting") {
          return searchText.includes("sculpt") || searchText.includes("toning") || searchText.includes("inch loss") || searchText.includes("muscle");
        }
        if (activeCondition.id === "wellness") {
          return p.category === "General" || searchText.includes("wellness") || searchText.includes("habit") || searchText.includes("lifestyle");
        }

        return false;
      });
    }

    // 2. Search filter (Enhanced Natural Language Search)
    if (searchQuery.trim().length >= 2) {
      const q = searchQuery.toLowerCase();

      // Stop words to ignore in conversational queries
      const stopWords = new Set(["i", "need", "want", "to", "something", "looking", "for", "a", "the", "in", "on", "at", "my", "me", "is", "and", "or", "some", "can", "you", "give", "show", "tell"]);
      const rawTokens = q.split(/[\s.,!?]+/).filter(t => t.length > 1 && !stopWords.has(t));

      // Basic synonym expansion for common health/nutrition queries
      const synMap: Record<string, string[]> = {
        "morning": ["breakfast", "morning", "wake", "tea", "coffee"],
        "eat": ["food", "recipe", "snack", "meal", "hunger", "hungry", "eat", "dinner", "lunch", "breakfast"],
        "hungry": ["food", "recipe", "snack", "meal", "hunger", "hungry", "eat"],
        "night": ["dinner", "night", "sleep", "bed"],
        "evening": ["dinner", "snack", "evening"],
        "weight": ["weight", "fat", "inches", "lose"],
        "fat": ["weight", "fat", "inches", "lose"],
        "sweet": ["sweet", "sugar", "craving", "dessert"],
        "drink": ["juice", "water", "drink", "beverage", "tea", "coffee"],
        "gut": ["gut", "acidity", "bloating", "digestion", "gastric", "constipation"],
        "heart": ["heart", "cardiac", "cholesterol", "blood pressure", "hypertension", "bp"],
        "sugar": ["sugar", "diabetes", "diabetic", "blood sugar", "insulin"],
        "hormone": ["hormone", "thyroid", "pcos", "menopause", "pregnancy"],
      };

      posts = posts.filter((p) => {
        const fullText = `${p.title} ${p.descriptionPlain} ${p.category} ${p.subType} ${p.tags.join(" ")}`.toLowerCase();

        // 1. Direct substring match (if they typed an exact title phrase)
        if (fullText.includes(q)) return true;

        // 2. Semantic token match (Every non-stop word must match either directly or via a synonym)
        if (rawTokens.length > 0) {
          return rawTokens.every(token => {
            const termsToCheck = [token, ...(synMap[token] || [])];
            return termsToCheck.some(term => fullText.includes(term));
          });
        }

        return false;
      });
    }

    return posts;
  }, [activeTab, searchQuery, activeCondition]);

  // ── Posts per Kanban column ──────────────────────────────────────────────
  const getColumnPosts = useCallback(
    (col: (typeof KANBAN_COLUMNS)[0]) => filteredPosts.filter(col.filter),
    [filteredPosts]
  );

  const totalCount = filteredPosts.length;

  return (
    <>
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-6 lg:p-10 max-w-[1800px] mx-auto min-h-screen flex flex-col gap-8"
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <motion.header variants={itemVariants} className="text-center max-w-4xl mx-auto shrink-0">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FAFCEE] border border-[#00B6C1]/20 rounded-full text-[#00B6C1] text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles size={14} />
            <span>Educators Module</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-serif text-[#0E5858] mb-6 leading-tight">
            Content <span className="text-[#00B6C1]">CRM Library</span>
          </h1>
          <p className="text-gray-400 text-sm font-medium mb-8 max-w-xl mx-auto">
            {totalCount} posts ready to use · Search, filter by health condition and share with clients.
          </p>

          {/* Search */}
          <div id="edu-tour-search" className="relative group max-w-3xl mx-auto mb-6">
            <div className="absolute inset-0 bg-[#00B6C1]/20 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-white border border-[#0E5858]/10 rounded-[2.5rem] shadow-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-[#FAFCEE] rounded-full flex items-center justify-center text-[#0E5858] shrink-0">
                <Search size={20} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, keyword, condition — e.g. 'PCOS breakfast'"
                className="flex-1 bg-transparent border-none outline-none text-[#0E5858] font-medium placeholder:text-gray-400 text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-gray-300 hover:text-gray-500 text-xs font-bold shrink-0"
                >
                  ✕ Clear
                </button>
              )}
              <button className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-[#0E5858] text-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-[#00B6C1] transition-all shrink-0">
                <Sparkles size={12} /> AI Search
              </button>
            </div>
          </div>

          {/* Health condition tabs */}
          <div id="edu-tour-health-tabs" className="flex flex-wrap justify-center gap-2.5 mb-8">
            {HEALTH_CONDITIONS.map((condition) => {
              const isActive = activeTab === condition.id;
              const Icon = condition.icon;
              return (
                <button
                  key={condition.id}
                  onClick={() => setActiveTab(condition.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-medium ${isActive
                      ? "bg-[#0E5858] text-white border-[#0E5858] shadow-lg"
                      : "bg-white text-gray-500 border-gray-200 hover:border-[#00B6C1]/50 hover:text-[#0E5858]"
                    }`}
                >
                  <Icon size={14} className={isActive ? "text-[#00B6C1]" : "opacity-60"} />
                  {condition.label}
                </button>
              );
            })}
          </div>

          {/* Client WhatsApp Number Input Bar */}
          <div id="edu-tour-whatsapp" className="max-w-2xl mx-auto bg-white border border-[#0E5858]/10 rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-4 justify-center">
            <div className="flex items-center gap-2 text-[#0E5858] font-bold text-sm">
              <Phone size={16} className="text-[#00B6C1]" />
              Client WhatsApp Number:
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 font-semibold">+91</span>
              <input
                type="text"
                value={tempPhone}
                onChange={(e) => setTempPhone(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
                placeholder="Enter 10-digit number"
                className="w-40 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#00B6C1] transition-all"
              />
              <button
                onClick={() => setClientPhone(tempPhone)}
                className="bg-[#00B6C1] hover:bg-[#0E5858] text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-all"
              >
                Set
              </button>
            </div>
            {clientPhone && clientPhone.length >= 10 && (
              <div className="w-full text-center mt-2 text-xs text-green-600 font-medium">
                Currently sending to: +91 {clientPhone}
              </div>
            )}
          </div>
        </motion.header>

        {/* ── Kanban Board ──────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} id="edu-tour-columns" className="flex-1 overflow-x-auto pb-8">
          <div className="flex gap-5 min-h-[600px] items-start w-max lg:w-full">
            {KANBAN_COLUMNS.map((col) => {
              const posts = getColumnPosts(col);
              const ColIcon = col.icon;

              return (
                <div
                  key={col.id}
                  className="w-[300px] shrink-0 bg-white/60 backdrop-blur-md border border-[#0E5858]/8 rounded-[2rem] flex flex-col overflow-hidden"
                >
                  {/* Column header */}
                  <div className="p-5 border-b border-[#0E5858]/5 flex items-center gap-3 bg-white/50 shrink-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${col.bg} ${col.color}`}>
                      <ColIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-[#0E5858] truncate">{col.title}</h3>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                        {posts.length} {posts.length === 1 ? "item" : "items"} · {col.description}
                      </p>
                    </div>
                  </div>

                  {/* Column cards */}
                  <div className="p-3 flex-1 overflow-y-auto space-y-3 max-h-[72vh]" style={{ scrollbarWidth: "thin" }}>
                    {posts.length === 0 ? (
                      <div className="h-48 flex flex-col items-center justify-center text-center p-4 opacity-40">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 text-gray-300">
                          <Search size={20} />
                        </div>
                        <p className="text-[11px] font-bold text-[#0E5858] uppercase tracking-widest mb-1">
                          {searchQuery ? "No matches" : "No content"}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                          {searchQuery
                            ? "Try a different keyword or clear the search."
                            : `No ${col.title.toLowerCase()} in this category.`}
                        </p>
                      </div>
                    ) : (
                      posts.map((post) => (
                        <ContentCard
                          key={post.id}
                          post={post}
                          clientPhone={clientPhone}
                          onClick={setSelectedPost}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.main>

      {/* ── Educators Walkthrough Tour ───────────────────────────────── */}
      {showTour && (
        <EducatorsTour onComplete={() => setShowTour(false)} />
      )}

      {/* ── Content Modal ──────────────────────────────────────────────── */}
      {selectedPost && (
        <ContentModal
          post={selectedPost}
          clientPhone={clientPhone}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </>
  );
}
