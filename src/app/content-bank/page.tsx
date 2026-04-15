"use client";

import { motion, Variants, AnimatePresence } from "framer-motion";
import { syllabusData } from "@/data/syllabus";
import {
    FileText,
    Video,
    ExternalLink,
    Search,
    Filter,
    Share2,
    FolderOpen,
    Play,
    Clock,
    User,
    X,
    Maximize2
} from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function getYouTubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function ContentBankContent() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedVideo, setSelectedVideo] = useState<{ id: string, title: string } | null>(null);
    const searchParams = useSearchParams();

    // Extract resource bank module
    const resourceModule = syllabusData.find(m => m.type === 'resource' || m.id === 'resource-bank');

    // Manage state for dynamically loaded content
    const [dynamicResources, setDynamicResources] = useState<any[]>([]);
    const [folders, setFolders] = useState<{name: string, prefix: string}[]>([]);

    useEffect(() => {
        const fetchDynamic = async () => {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

            // Fetch content and folders in parallel
            const [contentRes, folderRes] = await Promise.all([
                supabase.from('syllabus_content').select('*').in('content_type', ['video', 'document', 'link']),
                supabase.from('syllabus_content').select('*').eq('content_type', 'folder')
            ]);

            if (contentRes.data) {
                const mapped = contentRes.data.map(d => ({
                    id: d.id,
                    code: d.topic_code || `DYN-${d.id}`,
                    title: d.title,
                    content: d.content_type === 'video' ? 'Training Session' : 'Resource Document',
                    links: [{ url: d.content, label: 'Access Resource' }],
                    isDynamic: true,
                    moduleId: d.module_id,
                    contentType: d.content_type,
                    tags: d.tags || []
                }));
                setDynamicResources(mapped);
            }

            if (folderRes.data) {
                setFolders(folderRes.data.map(d => ({ name: d.title, prefix: d.content })));
            }
        };
        fetchDynamic();
    }, []);

    useEffect(() => {
        const q = searchParams.get('search');
        if (q) {
            setSearchQuery(q);
            const matchedFolder = folders.find(f => q.includes(f.name));
            if (matchedFolder) setSelectedCategory(matchedFolder.name);
        }
        
        const shareId = searchParams.get('share');
        if (shareId && (dynamicResources.length > 0 || (resourceModule?.topics && resourceModule.topics.length > 0))) {
            const allRes = [...(resourceModule?.topics || []), ...dynamicResources];
            const resource = allRes.find((r: any) => r.id === shareId || r.code === shareId);
            
            if (resource && !selectedVideo) {
                const ytId = resource.links ? getYouTubeId(resource.links[0]?.url) : null;
                if (ytId) {
                    setSelectedVideo({ id: ytId, title: resource.title });
                } else if (resource.links && resource.links[0]?.url && resource.links[0].url !== '#') {
                    // prevent infinite loops of opening windows if they don't block popups
                }
            }
        }
    }, [searchParams, folders, dynamicResources, resourceModule, selectedVideo]);

    const DEFAULT_FOLDERS = [
        { name: 'Sales Training', prefix: 'VB' },
        { name: 'Phase 1', prefix: 'P1' },
        { name: 'Phase 2', prefix: 'P2' },
        { name: 'Program Manuals', prefix: 'RB' },
    ];

    const allFolders = [...DEFAULT_FOLDERS];
    folders.forEach(f => {
        if (!allFolders.some(df => df.prefix === f.prefix)) {
            allFolders.push(f);
        }
    });

    const allResources = [...(resourceModule?.topics || []), ...dynamicResources];

    // Filter to only non-empty folders
    const nonEmptyFolders = allFolders.filter(f => 
        allResources.some(r => 
            r.code.startsWith(f.prefix) || 
            r.title.toLowerCase().includes(f.name.toLowerCase()) ||
            (r.code.includes('P1') && f.prefix === 'P1') || 
            (r.code.includes('P2') && f.prefix === 'P2')
        )
    );

    const categories = ["All", ...nonEmptyFolders.map(f => f.name)];

    const filteredResources = allResources.filter(r => {
        // Search filter
        const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ((r as any).tags && (r as any).tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase())));

        if (!matchesSearch) return false;

        // Category filter
        if (selectedCategory === "All") {
            // "All" now shows items that ARE NOT in any defined non-empty folder
            const inAnyFolder = nonEmptyFolders.some(f => 
                r.code.startsWith(f.prefix) || 
                r.title.toLowerCase().includes(f.name.toLowerCase()) ||
                (r.code.includes('P1') && f.prefix === 'P1') ||
                (r.code.includes('P2') && f.prefix === 'P2')
            );
            return !inAnyFolder;
        }
        
        // Exact folder matching
        const folder = nonEmptyFolders.find(f => f.name === selectedCategory);
        if (folder) {
            if (folder.name === "Sales Training") return r.code.startsWith('VB');
            if (folder.name === "Phase 1") return r.code.includes('P1') || r.title.includes('Phase 1');
            if (folder.name === "Phase 2") return r.code.includes('P2') || r.title.includes('Phase 2');
            if (folder.name === "Program Manuals") return r.code.startsWith('RB') && !r.code.includes('PV');
            
            return r.code.startsWith(folder.prefix) || r.title.toLowerCase().includes(folder.name.toLowerCase());
        }

        return true;
    }) || [];

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
            className="p-8 lg:p-12 max-w-[1600px] mx-auto bg-gray-50/30 min-h-screen"
        >
            <AnimatePresence>
                {selectedVideo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-black/95 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-6xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl"
                        >
                            <button
                                onClick={() => setSelectedVideo(null)}
                                className="absolute top-6 right-6 z-[110] w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all border border-white/10"
                            >
                                <X size={24} />
                            </button>

                            <div className="absolute top-6 left-10 z-[110] pointer-events-none">
                                <h2 className="text-white text-xl font-serif bg-black/40 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">{selectedVideo.title}</h2>
                            </div>

                            <iframe
                                src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div>
                    <div className="flex items-center gap-2 text-[#00B6C1] font-bold uppercase tracking-[0.3em] text-[10px] mb-3">
                        <FolderOpen size={16} />
                        <span>Asset Central</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-serif text-[#0E5858] mb-2 tracking-tight">Nutrition Academy Bank</h1>
                    <p className="text-gray-500 font-medium tracking-tight">Refined nutrition protocols, program walkthroughs, and sales mastery sessions.</p>
                </div>

                <div className="group relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00B6C1] transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search programs (Phase 1, Phase 2...)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-[#00B6C1]/10 focus:border-[#00B6C1] transition-all font-medium text-sm"
                    />
                </div>
            </header>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-3 mb-12 overflow-x-auto pb-4 no-scrollbar">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${selectedCategory === cat
                            ? 'bg-[#0E5858] text-white shadow-xl shadow-[#0E5858]/20 ring-4 ring-[#0E5858]/5'
                            : 'bg-white text-gray-400 hover:text-[#0E5858] border border-gray-100'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {resourceModule ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                    {filteredResources.map((resource) => {
                        const ytId = resource.links ? getYouTubeId(resource.links[0]?.url) : null;

                        return (
                            <motion.div
                                key={resource.code}
                                variants={itemVariants}
                                className="group cursor-pointer flex flex-col"
                                onClick={() => {
                                    if (ytId) {
                                        setSelectedVideo({ id: ytId, title: resource.title });
                                    } else {
                                        window.open(resource.links![0].url, '_blank');
                                    }
                                }}
                            >
                                {/* Thumbnail Container */}
                                <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-[0_20px_50px_rgba(14,88,88,0.15)] transition-all duration-500 mb-6 group-hover:-translate-y-3">
                                    {ytId ? (
                                        <img
                                            src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`}
                                            alt={resource.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0E5858] via-[#0E5858] to-[#00B6C1] relative overflow-hidden">
                                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,_white_0%,_transparent_70%)]"></div>
                                            <FolderOpen size={64} className="text-white/10 group-hover:text-white/30 transition-all group-hover:scale-110" />
                                            {resource.title.includes('Folder') && (
                                                <div className="absolute bottom-4 left-0 right-0 text-center">
                                                    <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[8px] font-black text-white uppercase tracking-widest border border-white/10">Browse Assets</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Play Overlay */}
                                    <div className="absolute inset-0 bg-black/5 group-hover:bg-[#0E5858]/40 transition-all duration-500 flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-[#0E5858] shadow-2xl transform scale-75 group-hover:scale-100 transition-all duration-500">
                                            {ytId ? <Play size={24} fill="currentColor" className="ml-1" /> : <ExternalLink size={24} />}
                                        </div>
                                    </div>

                                    {/* Tagging - Only for Videos */}
                                    {ytId && (
                                        <div className="absolute top-5 left-5 flex gap-2">
                                            {(resource.content.includes('Phase 1') || resource.title.includes('Phase 1')) && (
                                                <span className="bg-[#00B6C1] text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl shadow-lg backdrop-blur-md">Phase 1</span>
                                            )}
                                            {(resource.content.includes('Phase 2') || resource.title.includes('Phase 2')) && (
                                                <span className="bg-[#0E5858] text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl shadow-lg backdrop-blur-md border border-white/10">Phase 2</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Duration Tag */}
                                    <div className="absolute bottom-5 right-5 px-4 py-2 bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-xl border border-white/10">
                                        {ytId ? 'Training Session' : 'Resource Folder'}
                                    </div>

                                    {/* Share Button */}
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const url = new URL(window.location.href);
                                            url.searchParams.set('share', (resource as any).id || resource.code);
                                            navigator.clipboard.writeText(url.toString());
                                            alert('Resource link copied to clipboard!');
                                        }}
                                        className="absolute top-5 right-5 w-8 h-8 bg-black/40 hover:bg-white text-white hover:text-[#0E5858] rounded-full flex items-center justify-center transition-all duration-300 z-10 backdrop-blur-md opacity-0 group-hover:opacity-100 border border-white/10 shadow-xl"
                                        title="Copy Share Link"
                                    >
                                        <Share2 size={12} />
                                    </button>
                                </div>

                                {/* Content Meta */}
                                <div className="flex gap-5 px-3">
                                    <div className="shrink-0 pt-1">
                                        <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-[#00B6C1] group-hover:bg-[#00B6C1] group-hover:text-white transition-all transform group-hover:rotate-6 duration-500">
                                            {ytId ? <Video size={20} /> : <FolderOpen size={20} />}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-serif font-bold text-[#0E5858] leading-tight mb-2 line-clamp-2 group-hover:text-[#00B6C1] transition-colors tracking-tight">
                                            {resource.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-black uppercase tracking-[0.1em]">
                                            <span>{resource.code}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                                            <span className="text-[#00B6C1]/60">
                                                {allFolders.find(f => resource.code.includes(f.prefix))?.name || 'Resource Bank'}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-xs text-gray-400 leading-relaxed line-clamp-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                                            {resource.content}
                                        </p>
                                        {(resource as any).tags && (resource as any).tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-3">
                                               {(resource as any).tags.map((t: string, i: number) => (
                                                   <span key={i} className="px-2 py-0.5 bg-[#FAFCEE] border border-[#00B6C1]/20 text-[#0E5858] text-[8px] font-bold uppercase tracking-widest rounded-md">{t}</span>
                                               ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="premium-card p-20 text-center flex flex-col items-center border-dashed border-2">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6">
                        <FolderOpen size={32} />
                    </div>
                    <h2 className="text-2xl font-serif text-[#0E5858] mb-2 tracking-tight">Vault Population in Progress</h2>
                    <p className="text-gray-400 max-w-sm">We are currently migrating refined academy manuals and video protocols to the Asset Central.</p>
                </div>
            )}
        </motion.main>
    );
}

export default function ContentBankPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center font-serif text-[#0E5858] text-xl">Initializing Asset Central...</div>}>
            <ContentBankContent />
        </Suspense>
    );
}
