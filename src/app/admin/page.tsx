"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import {
    Users,
    BookOpen,
    Brain,
    Phone,
    FileText,
    BarChart3,
    ChevronRight,
    Search,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ArrowUpRight,
    MessageSquare,
    Award,
    ClipboardList,
    UserPlus,
    Lock,
    Mail,
    User,
    ShieldCheck,
    Upload,
    Link as LinkIcon,
    File as FileIcon,
    Plus,
    Pencil,
    Database,
    Key as BNKeyIcon,
    Monitor,
    History,
    MoreHorizontal,
    Send,
    UserCheck,
    Briefcase,
    Loader2,
    Trash2,
    ExternalLink,
    ChevronLeft,
    BrainCircuit,
    CheckCircle,
    Star,
    Layout
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { syllabusData } from "@/data/syllabus";

interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: string;
    created_at?: string;
    training_buddy?: string;
    last_login?: string;
    temp_password?: string;
}

interface AssessmentRecord {
    id: string;
    user_id: string;
    topic_code: string;
    score: number;
    total_questions: number;
    raw_data: any;
    created_at: string;
}

interface ActivityLog {
    id: string;
    user_id: string;
    activity_type: string;
    content_title: string;
    created_at: string;
    module_id?: string;
    topic_code?: string;
}

interface SummaryAudit {
    id: string;
    user_id: string;
    topic_code: string;
    score: number;
    feedback: string;
    summary_text?: string;
    ai_feedback?: string;
    created_at: string;
}

const TOTAL_SYLLABUS_TOPICS = syllabusData.reduce((acc, mod) => acc + mod.topics.length, 0);

interface DynamicContent {
    id: string;
    module_id: string;
    title: string;
    content_type: string;
    content: string;
    created_at: string;
}

interface TopicProgress {
    user_id: string;
    topic_code: string;
    module_id: string;
    created_at: string;
}

function AdminDashboardContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'hub' | 'provisioning' | 'architect' | 'registry'>('hub');
    const [loading, setLoading] = useState(true);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
    const [activity, setActivity] = useState<ActivityLog[]>([]);
    const [audits, setAudits] = useState<SummaryAudit[]>([]);
    const [dynamicContent, setDynamicContent] = useState<DynamicContent[]>([]);
    const [progress, setProgress] = useState<TopicProgress[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Detail Views
    const [selectedQuiz, setSelectedQuiz] = useState<AssessmentRecord | null>(null);
    const [selectedAudit, setSelectedAudit] = useState<SummaryAudit | null>(null);
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

    // Form States
    const [newUser, setNewUser] = useState({
        email: "",
        password: "",
        fullName: "",
        role: "counsellor",
        buddyName: "BN Admin",
        buddyEmail: "admin@balancenutrition.in",
        buddyPhone: "0000000000"
    });
    const [creatingUser, setCreatingUser] = useState(false);
    const [userSuccess, setUserSuccess] = useState("");
    const [userError, setUserError] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [resettingUser, setResettingUser] = useState(false);
    const [adminPhone, setAdminPhone] = useState("");
    const [updatingAdmin, setUpdatingAdmin] = useState(false);
    const [currentAdmin, setCurrentAdmin] = useState<Profile | null>(null);

    const [contentForm, setContentForm] = useState({
        moduleId: "",
        topicTitle: "",
        contentType: "video",
        contentLink: "",
    });
    const [uploadingContent, setUploadingContent] = useState(false);
    const [contentSuccess, setContentSuccess] = useState("");
    const [contentError, setContentError] = useState("");

    // Audit Report Form
    const [auditForm, setAuditForm] = useState({
        score: 80,
        feedback: "",
        topicCode: "FINAL-REVIEW"
    });
    const [submittingAudit, setSubmittingAudit] = useState(false);
    const [editingBuddy, setEditingBuddy] = useState(false);
    const [buddyList, setBuddyList] = useState<{ name: string; email: string; phone: string }[]>([]);
    const [updatingBuddy, setUpdatingBuddy] = useState(false);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['hub', 'provisioning', 'architect', 'registry'].includes(tab)) {
            setActiveTab(tab as any);
        }
    }, [searchParams]);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }
            await refreshData();

            // Fetch current admin profile to pre-fill their contact info
            const { data: aProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            if (aProfile) {
                setCurrentAdmin(aProfile);
                setAdminPhone(aProfile.phone || "");
            }

            setLoading(false);
        };
        checkAuth();
    }, [router]);

    const refreshData = async () => {
        try {
            const [
                { data: pData },
                { data: aData },
                { data: actData },
                { data: audData },
                { data: cData },
                { data: prData }
            ] = await Promise.all([
                supabase.from('profiles').select('*').order('created_at', { ascending: false }),
                supabase.from('assessment_logs').select('*').order('created_at', { ascending: false }),
                supabase.from('mentor_activity_logs').select('*').order('created_at', { ascending: false }),
                supabase.from('summary_audits').select('*').order('created_at', { ascending: false }),
                supabase.from('syllabus_content').select('*').order('module_id', { ascending: true }),
                supabase.from('mentor_progress').select('*')
            ]);

            setProfiles(pData || []);
            setAssessments(aData || []);
            setActivity(actData || []);
            setAudits(audData || []);
            setDynamicContent(cData || []);
            setProgress(prData || []);
        } catch (err) {
            console.error("Master Sync Error:", err);
        }
    };

    const counsellors = useMemo(() => profiles.filter(p => p.role === 'counsellor'), [profiles]);
    const buddies = useMemo(() => profiles.filter(p => p.role === 'moderator' || p.role === 'admin'), [profiles]);

    const filteredRegistry = useMemo(() => {
        return profiles.filter(p =>
            p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [profiles, searchQuery]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingUser(true);
        setUserError("");
        setUserSuccess("");

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const buddyInfo = JSON.stringify({
                name: newUser.buddyName || "BN Admin",
                email: newUser.buddyEmail || "admin@balancenutrition.in",
                phone: newUser.buddyPhone || "0000000000"
            });

            const response = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                    ...newUser,
                    trainingBuddy: buddyInfo
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Provisioning failed');

            setUserSuccess(`Authorized: ${newUser.email}. Account created.`);
            setNewUser({
                email: "", password: "", fullName: "", role: "counsellor",
                buddyName: "BN Admin", buddyEmail: "admin@balancenutrition.in", buddyPhone: "0000000000"
            });
            refreshData();
        } catch (err: any) {
            setUserError(err.message);
        } finally {
            setCreatingUser(false);
        }
    };

    const handleUpdateContent = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploadingContent(true);
        setContentError("");
        setContentSuccess("");

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch('/api/admin/content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(contentForm),
            });

            if (!response.ok) throw new Error('Architecture synchronization failed');

            setContentSuccess("Content Bank synchronized across all nodes.");
            setContentForm({ moduleId: "", topicTitle: "", contentType: "video", contentLink: "" });
            refreshData();
        } catch (err: any) {
            setContentError(err.message);
        } finally {
            setUploadingContent(false);
        }
    };

    const handleDeleteContent = async (id: string) => {
        if (!confirm("Are you sure you want to remove this resource?")) return;

        try {
            const { error } = await supabase.from('syllabus_content').delete().eq('id', id);
            if (error) throw error;
            refreshData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleSubmitAudit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProfile) return;
        setSubmittingAudit(true);

        try {
            const { error } = await supabase.from('summary_audits').insert({
                user_id: selectedProfile.id,
                topic_code: auditForm.topicCode,
                score: auditForm.score,
                feedback: auditForm.feedback
            });

            if (error) throw error;
            setAuditForm({ ...auditForm, feedback: "" });
            refreshData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSubmittingAudit(false);
        }
    };

    const handleUpdateAdminProfile = async () => {
        if (!currentAdmin) return;
        setUpdatingAdmin(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ phone: adminPhone })
                .eq('id', currentAdmin.id);
            if (error) throw error;
            alert("Contact info updated!");
            refreshData();
        } catch (err: any) {
            alert("Failed to update: " + err.message);
        } finally {
            setUpdatingAdmin(false);
        }
    };

    const handleUpdateBuddy = async () => {
        if (!selectedProfile) return;
        setUpdatingBuddy(true);
        try {
            const buddyJson = JSON.stringify(buddyList);
            const { error } = await supabase
                .from('profiles')
                .update({ training_buddy: buddyJson })
                .eq('id', selectedProfile.id);

            if (error) throw error;

            setSelectedProfile({ ...selectedProfile, training_buddy: buddyJson });
            setEditingBuddy(false);
            refreshData();
        } catch (err: any) {
            alert("Failed to update buddy: " + err.message);
        } finally {
            setUpdatingBuddy(false);
        }
    };

    const handleGiveRetest = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this quiz score and allow a retest?")) return;
        try {
            const { error } = await supabase.from('assessment_logs').delete().eq('id', id);
            if (error) throw error;
            alert("Retest granted. The user can now retake this quiz.");
            refreshData();
        } catch (err: any) {
            alert("Error granting retest: " + err.message);
        }
    };

    const handleResetUser = async (userId: string) => {
        if (!confirm("⚠️ CAUTION: This will permanently delete all activity logs, quiz scores, progress, and audits for this user. Proceed?")) return;
        setResettingUser(true);
        try {
            await Promise.all([
                supabase.from('mentor_activity_logs').delete().eq('user_id', userId),
                supabase.from('mentor_progress').delete().eq('user_id', userId),
                supabase.from('assessment_logs').delete().eq('user_id', userId),
                supabase.from('summary_audits').delete().eq('user_id', userId)
            ]);
            alert("Account history has been cleared.");
            refreshData();
        } catch (err: any) {
            console.error("Reset Error:", err);
            alert("Failed to reset account data: " + err.message);
        } finally {
            setResettingUser(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!selectedProfile) return;
        if (deleteConfirm !== "delete account") {
            alert("Please type 'delete account' to confirm.");
            return;
        }

        setIsDeleting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/admin/delete-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ userId: selectedProfile.id })
            });

            if (!res.ok) throw new Error("Deletion failed");

            alert("Account permanently removed.");
            setSelectedProfile(null);
            refreshData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsDeleting(false);
            setDeleteConfirm("");
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="w-12 h-12 text-[#00B6C1] animate-spin" />
        </div>
    );

    return (
        <div className="p-8 lg:p-12 max-w-[1600px] mx-auto min-h-screen">
            <AnimatePresence mode="wait">
                {selectedProfile ? (
                    <motion.div
                        key="profile-detail"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-10"
                    >
                        <button
                            onClick={() => setSelectedProfile(null)}
                            className="flex items-center gap-2 text-[#0E5858]/60 hover:text-[#0E5858] font-bold text-xs uppercase tracking-widest transition-all"
                        >
                            <ChevronLeft size={16} /> Back to Registry
                        </button>

                        <div className="flex flex-col lg:flex-row gap-10">
                            {/* Profile Sidebar */}
                            <div className="lg:w-[400px] space-y-6">
                                <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-[#0E5858]/5">
                                    <div className="text-center mb-8">
                                        <div className="w-24 h-24 bg-[#FAFCEE] rounded-[2.5rem] flex items-center justify-center text-[#0E5858] text-4xl font-black mx-auto mb-6 shadow-inner">
                                            {selectedProfile.full_name?.[0]}
                                        </div>
                                        <h3 className="text-3xl font-serif text-[#0E5858] mb-1">{selectedProfile.full_name}</h3>
                                        <p className="text-[10px] font-bold text-[#00B6C1] uppercase tracking-widest">{selectedProfile.email}</p>
                                    </div>

                                    <div className="space-y-4 border-t border-gray-50 pt-8">
                                        <div className="bg-[#FAFCEE] p-4 rounded-2xl border border-[#0E5858]/5 text-center mb-4">
                                            {(() => {
                                                const userProgress = progress.filter(pr => pr.user_id === selectedProfile.id);
                                                const userActivity = activity.filter(a => a.user_id === selectedProfile.id);
                                                const globalPercent = Math.min(100, Math.round((userProgress.length / (TOTAL_SYLLABUS_TOPICS || 1)) * 100));
                                                const lastAct = userActivity[0];

                                                return (
                                                    <>
                                                        <p className="text-[9px] font-black text-[#00B6C1] uppercase tracking-[0.2em] mb-1">Global Training Efficiency</p>
                                                        <p className="text-3xl font-serif text-[#0E5858] mb-2">{globalPercent}%</p>
                                                        <div className="flex flex-col gap-2 items-center">
                                                            {lastAct && (
                                                                <div className="px-3 py-1 bg-[#0E5858] text-white rounded-full text-[7px] font-black uppercase tracking-widest flex items-center gap-2">
                                                                    <div className="w-1 h-1 rounded-full bg-[#00B6C1] animate-pulse"></div>
                                                                    Active: {new Date(lastAct.created_at).toLocaleDateString()}
                                                                </div>
                                                            )}
                                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{userActivity.length} Total Engagements Recorded</p>
                                                        </div>
                                                        <div className="w-full h-1 bg-gray-200 rounded-full mt-3 overflow-hidden">
                                                            <div className="h-full bg-[#00B6C1]" style={{ width: `${globalPercent}%` }} />
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                        <div className="flex flex-col text-xs py-1 border-b border-gray-50 pb-4 mb-2">
                                            <div className="flex justify-between items-center w-full">
                                                <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Assigned Buddies</span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            let currentBuddies = [];
                                                            try {
                                                                const parsed = JSON.parse(selectedProfile.training_buddy || '[]');
                                                                currentBuddies = Array.isArray(parsed) ? parsed : [parsed];
                                                            } catch (e) {
                                                                if (selectedProfile.training_buddy) {
                                                                    currentBuddies = [{ name: "BN Admin", email: selectedProfile.training_buddy, phone: "0000000000" }];
                                                                }
                                                            }
                                                            setBuddyList([...currentBuddies, { name: "", email: "", phone: "" }]);
                                                            setEditingBuddy(true);
                                                        }}
                                                        title="Add New Buddy"
                                                        className="text-gray-300 hover:text-[#00B6C1] transition-colors"
                                                    >
                                                        <Plus size={10} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            try {
                                                                const parsed = JSON.parse(selectedProfile.training_buddy || '[]');
                                                                setBuddyList(Array.isArray(parsed) ? parsed : [parsed]);
                                                            } catch (e) {
                                                                setBuddyList([{ name: "BN Admin", email: selectedProfile.training_buddy || "admin@balancenutrition.in", phone: "0000000000" }]);
                                                            }
                                                            setEditingBuddy(true);
                                                        }}
                                                        title="Edit Existing"
                                                        className="text-gray-300 hover:text-[#00B6C1] transition-colors"
                                                    >
                                                        <Pencil size={10} />
                                                    </button>
                                                </div>
                                            </div>
                                            {editingBuddy ? (
                                                <div className="flex flex-col gap-3 w-full mt-3">
                                                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                        {buddyList.map((buddy, idx) => (
                                                            <div key={idx} className="space-y-2 p-4 bg-gray-50 rounded-2xl border border-gray-100 relative group/buddy">
                                                                <button
                                                                    onClick={() => setBuddyList(prev => prev.filter((_, i) => i !== idx))}
                                                                    className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover/buddy:opacity-100 transition-all"
                                                                >
                                                                    <XCircle size={12} />
                                                                </button>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Buddy Name"
                                                                    value={buddy.name}
                                                                    onChange={e => {
                                                                        const newList = [...buddyList];
                                                                        newList[idx].name = e.target.value;
                                                                        setBuddyList(newList);
                                                                    }}
                                                                    className="w-full text-[10px] px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none"
                                                                />
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <input
                                                                        type="email"
                                                                        placeholder="Email"
                                                                        value={buddy.email}
                                                                        onChange={e => {
                                                                            const newList = [...buddyList];
                                                                            newList[idx].email = e.target.value;
                                                                            setBuddyList(newList);
                                                                        }}
                                                                        className="w-full text-[10px] px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Phone"
                                                                        value={buddy.phone}
                                                                        onChange={e => {
                                                                            const newList = [...buddyList];
                                                                            newList[idx].phone = e.target.value;
                                                                            setBuddyList(newList);
                                                                        }}
                                                                        className="w-full text-[10px] px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <button
                                                            onClick={() => setBuddyList(prev => [...prev, { name: "", email: "", phone: "" }])}
                                                            className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-[9px] font-black text-gray-300 uppercase tracking-widest hover:border-[#00B6C1] hover:text-[#00B6C1] transition-all"
                                                        >
                                                            + Add Another Support
                                                        </button>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleUpdateBuddy}
                                                            disabled={updatingBuddy}
                                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#0E5858] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#00B6C1] transition-all"
                                                        >
                                                            {updatingBuddy ? <Loader2 size={12} className="animate-spin" /> : "Save Changes"}
                                                        </button>
                                                        <button onClick={() => setEditingBuddy(false)} className="px-4 py-3 bg-gray-100 text-gray-400 rounded-xl font-bold text-[10px] uppercase">Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-2 mt-2 w-full">
                                                    {(() => {
                                                        try {
                                                            const raw = selectedProfile.training_buddy || '[]';
                                                            const parsed = JSON.parse(raw);
                                                            const buddiesArray = Array.isArray(parsed) ? parsed : [parsed];

                                                            if (buddiesArray.length === 0) {
                                                                return (
                                                                    <div className="p-4 bg-[#FAFCEE] border border-[#0E5858]/10 rounded-2xl w-full">
                                                                        <p className="text-[#0E5858] font-black text-[10px] uppercase tracking-widest mb-1">BN Admin</p>
                                                                        <p className="text-[9px] text-gray-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">admin@balancenutrition.in</p>
                                                                    </div>
                                                                );
                                                            }

                                                            return buddiesArray.map((buddy, bIdx) => (
                                                                <div key={bIdx} className="p-4 bg-[#FAFCEE] border border-[#0E5858]/10 rounded-2xl w-full">
                                                                    <p className="text-[#0E5858] font-black text-[10px] uppercase tracking-widest mb-1 truncate">{buddy.name || "Unnamed Buddy"}</p>
                                                                    <p className="text-[9px] text-gray-400 font-medium truncate mb-0.5">{buddy.email}</p>
                                                                    <p className="text-[9px] text-gray-400 font-medium truncate">{buddy.phone}</p>
                                                                </div>
                                                            ));
                                                        } catch (e) {
                                                            // Fallback for old comma-separated emails
                                                            return (selectedProfile.training_buddy || "admin@balancenutrition.in").split(',').map((email, i) => (
                                                                <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-[#FAFCEE] border border-[#0E5858]/10 rounded-lg w-full">
                                                                    <Briefcase size={10} className="text-[#0E5858] opacity-50" />
                                                                    <span className="text-[#0E5858] font-bold text-[10px] truncate">{email.trim()}</span>
                                                                </div>
                                                            ));
                                                        }
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Joined On</span>
                                            <span className="text-[#0E5858] font-bold">{new Date(selectedProfile.created_at || '').toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Access Level</span>
                                            <span className="badge-teal text-[8px] uppercase">{selectedProfile.role}</span>
                                        </div>

                                        <div className="pt-10 border-t border-red-50 mt-10 space-y-4">
                                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest text-center">Danger Zone</p>
                                            <div className="bg-red-50/50 p-6 rounded-[2rem] border border-red-100 space-y-4">
                                                <p className="text-[9px] text-red-500 font-medium leading-relaxed text-center">To delete this account permanently, type "delete account" below.</p>
                                                <input
                                                    type="text"
                                                    value={deleteConfirm}
                                                    onChange={(e) => setDeleteConfirm(e.target.value.toLowerCase())}
                                                    placeholder="type 'delete account'"
                                                    className="w-full bg-white border border-red-100 rounded-xl py-3 px-4 text-xs text-red-600 font-bold outline-none focus:ring-2 focus:ring-red-200 text-center"
                                                />
                                                <button
                                                    onClick={handleDeleteAccount}
                                                    disabled={isDeleting || deleteConfirm !== 'delete account'}
                                                    className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${deleteConfirm === 'delete account' ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                >
                                                    {isDeleting ? <Loader2 className="animate-spin" size={14} /> : <><Trash2 size={14} /> Permanent Deletion</>}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="pt-6 mt-6 border-t border-red-50">
                                            <button
                                                onClick={() => handleResetUser(selectedProfile.id)}
                                                disabled={resettingUser}
                                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-100 text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                                            >
                                                {resettingUser ? <Loader2 size={12} className="animate-spin" /> : <><Trash2 size={12} /> Clear Activity History</>}
                                            </button>
                                            <p className="text-[7px] text-gray-300 font-medium mt-3 text-center uppercase tracking-widest">Resets logs, progress, and scores</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#0E5858] text-white rounded-[3rem] p-10 shadow-xl space-y-8">
                                    <h4 className="text-sm font-black uppercase tracking-[0.2em] text-[#00B6C1]">Add Audit Report</h4>
                                    <form onSubmit={handleSubmitAudit} className="space-y-4">
                                        <div>
                                            <label className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-2 block">Performance Score (0-100)</label>
                                            <input
                                                type="number"
                                                min="0" max="100"
                                                value={auditForm.score}
                                                onChange={e => setAuditForm({ ...auditForm, score: parseInt(e.target.value) })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#00B6C1]/30 transition-all text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-2 block">Feedback / Observations</label>
                                            <textarea
                                                value={auditForm.feedback}
                                                onChange={e => setAuditForm({ ...auditForm, feedback: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#00B6C1]/30 transition-all text-white h-32 resize-none"
                                                placeholder="Enter audit remarks..."
                                                required
                                            />
                                        </div>
                                        <button
                                            disabled={submittingAudit}
                                            className="w-full py-4 bg-[#00B6C1] text-[#0E5858] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2"
                                        >
                                            {submittingAudit ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} /> Submit Audit Report</>}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Main Detail Area */}
                            <div className="flex-1 space-y-10">
                                {/* Activity Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-[#0E5858]/5">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-[#0E5858]/40 mb-6 flex items-center gap-3">
                                            <Monitor size={16} className="text-[#00B6C1]" /> Recent Activity Trail
                                        </h4>
                                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                                            {activity.filter(a => a.user_id === selectedProfile.id).map(log => (
                                                <div key={log.id} className="flex gap-4 group">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#00B6C1] mt-1.5 shrink-0 group-last:bg-transparent"></div>
                                                    <div>
                                                        <p className="text-[11px] font-bold text-[#0E5858]">{log.activity_type.replace('_', ' ')}: <span className="text-gray-400 font-medium">{log.content_title}</span></p>
                                                        <p className="text-[8px] text-gray-300 font-black uppercase tracking-widest mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white p-8 rounded-[2.5rem] border border-[#0E5858]/5">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-[#0E5858]/40 mb-6 flex items-center gap-3">
                                            <Brain size={16} className="text-[#00B6C1]" /> Assessment History
                                        </h4>
                                        <div className="space-y-3">
                                            {assessments.filter(a => a.user_id === selectedProfile.id).map(quiz => (
                                                <div key={quiz.id} className="w-full p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex flex-col gap-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="text-xs font-bold text-[#0E5858] uppercase tracking-widest">{quiz.topic_code} - Completed</p>
                                                            <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">{new Date(quiz.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xl font-serif text-[#0E5858]">{Math.round((quiz.score / (quiz.total_questions || 5)) * 100)}%</p>
                                                            <p className="text-[9px] font-bold text-[#00B6C1] uppercase tracking-widest">Score Captured</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                                        <button
                                                            onClick={() => setSelectedQuiz(quiz)}
                                                            className="px-4 py-2 bg-white border border-[#00B6C1]/20 rounded-xl text-[9px] font-black text-[#00B6C1] uppercase tracking-widest hover:bg-[#00B6C1] hover:text-white transition-all shadow-sm"
                                                        >
                                                            Review Quiz
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const matchingAudit = audits.find(a => a.user_id === selectedProfile.id && a.topic_code === quiz.topic_code);
                                                                if (matchingAudit) {
                                                                    setSelectedAudit(matchingAudit);
                                                                } else {
                                                                    alert("No peer audit found for this assessment.");
                                                                }
                                                            }}
                                                            className="px-4 py-2 bg-white border border-[#FFCC00]/50 rounded-xl text-[9px] font-black text-[#FFCC00] uppercase tracking-widest hover:bg-[#FFCC00] hover:text-[#0E5858] transition-all shadow-sm"
                                                        >
                                                            Review Peer Audit
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleGiveRetest(quiz.id, e)}
                                                            className="px-4 py-2 bg-white border border-red-200 rounded-xl text-[9px] font-black text-red-500 uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                        >
                                                            Give Retest
                                                        </button>
                                                        <a
                                                            href={`mailto:${selectedProfile.email}?subject=Regarding your recent assessment: ${quiz.topic_code}`}
                                                            onClick={e => e.stopPropagation()}
                                                            className="px-4 py-2 bg-[#0E5858] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#00B6C1] transition-all shadow-sm flex items-center gap-1"
                                                        >
                                                            <Mail size={10} /> Email
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Progress Map */}
                                <div className="bg-white p-10 rounded-[3rem] border border-[#0E5858]/5">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-[#0E5858]/40 mb-8 flex items-center gap-3">
                                        <ClipboardList size={16} className="text-[#00B6C1]" /> Training Progress Map
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        {syllabusData.map(module => {
                                            const dynamicForModule = dynamicContent.filter(d => d.module_id === module.id);
                                            const moduleProgress = progress.filter(p => p.user_id === selectedProfile.id && p.module_id === module.id);
                                            const totalTopics = module.topics.length + dynamicForModule.length;
                                            const percent = totalTopics > 0 ? (moduleProgress.length / totalTopics) * 100 : 0;

                                            // Create an array that includes both static topics and dynamic placeholders/identifiers
                                            const allTopics = [...module.topics, ...dynamicForModule.map(d => ({ code: `DYN-${d.id}`, title: d.title }))];

                                            return (
                                                <div key={module.id} className="space-y-4">
                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <p className="text-[8px] font-black text-[#00B6C1] uppercase tracking-widest mb-1">{module.type}</p>
                                                            <h5 className="text-sm font-serif font-bold text-[#0E5858] truncate max-w-[200px]">{module.title}</h5>
                                                        </div>
                                                        <span className="text-[10px] font-black text-[#0E5858]">{Math.round(percent)}%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${percent}%` }}
                                                            className="h-full bg-gradient-to-r from-[#0E5858] to-[#00B6C1]"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-5 gap-2">
                                                        {allTopics.map((topic, i) => {
                                                            const isDone = progress.some(p => p.user_id === selectedProfile.id && p.topic_code === topic.code);
                                                            return (
                                                                <div
                                                                    key={topic.code}
                                                                    title={topic.title}
                                                                    className={`h-1.5 rounded-full transition-all ${isDone ? 'bg-[#00B6C1] shadow-[0_0_8px_rgba(0,182,193,0.3)]' : 'bg-gray-100'}`}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Peer Review Feed */}
                                <div className="bg-white p-10 rounded-[3rem] border border-[#0E5858]/5">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-[#0E5858]/40 mb-8 flex items-center gap-3">
                                        <MessageSquare size={16} className="text-[#00B6C1]" /> Audit & Feedback Repository
                                    </h4>
                                    <div className="space-y-6">
                                        {audits.filter(a => a.user_id === selectedProfile.id).map(audit => (
                                            <div key={audit.id} className="p-8 bg-[#FAFCEE]/50 rounded-[2rem] border border-[#0E5858]/5 relative group">
                                                <div className="flex flex-col md:flex-row justify-between gap-6 mb-4">
                                                    <div>
                                                        <p className="text-[9px] font-black text-[#00B6C1] uppercase tracking-widest">{audit.topic_code} Audit Report</p>
                                                        <p className="text-[8px] text-gray-300 font-black uppercase tracking-widest mt-0.5">{new Date(audit.created_at).toLocaleString()}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {audit.summary_text && (
                                                            <button
                                                                onClick={() => setSelectedAudit(audit)}
                                                                className="px-4 py-1.5 bg-white text-[#0E5858] border border-[#0E5858]/10 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#00B6C1] hover:text-white transition-all"
                                                            >
                                                                View Input Data
                                                            </button>
                                                        )}
                                                        <div className="px-4 py-1.5 bg-[#0E5858] text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Score: {audit.score}/100</div>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-[#0E5858] leading-relaxed italic font-medium">"{audit.feedback}"</p>
                                                {audit.ai_feedback && audit.ai_feedback !== 'AWAITING_REVIEW' && (
                                                    <div className="mt-4 p-4 bg-white/50 rounded-xl border border-[#00B6C1]/10">
                                                        <p className="text-[8px] font-black text-[#00B6C1] uppercase tracking-widest mb-1">AI System Feedback</p>
                                                        <p className="text-[10px] text-gray-500 leading-relaxed">{audit.ai_feedback}</p>
                                                    </div>
                                                )}
                                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-10 transition-opacity">
                                                    <Star size={40} className="text-[#FFCC00]" />
                                                </div>
                                            </div>
                                        ))}
                                        {audits.filter(a => a.user_id === selectedProfile.id).length === 0 && (
                                            <p className="text-center py-10 text-[10px] font-black text-gray-300 uppercase tracking-widest">No audits logged yet</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : activeTab === 'hub' ? (
                    <motion.div key="hub" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <div>
                                <h2 className="text-4xl font-serif text-[#0E5858] tracking-tight">Counsellor Control Hub</h2>
                                <p className="text-gray-400 font-medium mt-3 italic">Live monitoring of training progress.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="px-6 py-4 bg-white rounded-2xl shadow-sm border border-[#0E5858]/5 text-center min-w-[140px]">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Counsellors</p>
                                    <p className="text-2xl font-serif text-[#0E5858]">{counsellors.length}</p>
                                </div>
                                <div className="px-6 py-4 bg-[#0E5858] rounded-2xl shadow-sm text-center min-w-[140px] text-white">
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Pass Rate</p>
                                    <p className="text-2xl font-serif text-[#00B6C1]">84%</p>
                                </div>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 gap-6">
                            {counsellors.slice(0, 5).map(c => {
                                const latestActivity = activity.find(a => a.user_id === c.id);
                                const userAssessments = assessments.filter(a => a.user_id === c.id);
                                const userAudits = audits.filter(a => a.user_id === c.id);

                                return (
                                    <div key={c.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all border border-[#0E5858]/5 group">
                                        <div className="flex flex-col lg:flex-row gap-10">
                                            <div className="lg:w-[300px] space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-2xl bg-[#FAFCEE] flex items-center justify-center text-[#0E5858] text-xl font-black border border-[#0E5858]/5">
                                                        {c.full_name?.[0] || 'C'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-xl font-serif text-[#0E5858] truncate">{c.full_name}</h4>
                                                        <p className="text-[9px] font-bold text-[#00B6C1] uppercase tracking-widest truncate">{c.email}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-gray-400">
                                                        <span>Progress</span>
                                                        <span className="text-[#00B6C1]">{latestActivity?.module_id || 'Orientation'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-grow grid grid-cols-2 lg:grid-cols-4 gap-8">
                                                <div className="p-4 bg-gray-50/50 rounded-2xl">
                                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Quizzes</label>
                                                    <p className="text-2xl font-serif text-[#0E5858]">{userAssessments.length}</p>
                                                </div>
                                                <div className="p-4 bg-gray-50/50 rounded-2xl">
                                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Avg. Score</label>
                                                    <p className="text-2xl font-serif text-[#0E5858]">
                                                        {userAssessments.length > 0
                                                            ? Math.round(userAssessments.reduce((acc, a) => acc + (a.score / (a.total_questions || 5)), 0) / userAssessments.length * 100)
                                                            : 0}%
                                                    </p>
                                                </div>
                                                <div className="p-4 bg-gray-50/50 rounded-2xl">
                                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Audits</label>
                                                    <p className="text-2xl font-serif text-[#0E5858]">{userAudits.length}</p>
                                                </div>
                                                <div className="flex items-center justify-end">
                                                    <button
                                                        onClick={() => setSelectedProfile(c)}
                                                        className="px-6 py-3 bg-[#0E5858] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#00B6C1] transition-all transform hover:-translate-y-1 shadow-lg shadow-[#0E5858]/10"
                                                    >View Profile</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                ) : activeTab === 'provisioning' ? (
                    <motion.div key="provisioning" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-12 max-w-3xl mx-auto">

                        {/* Admin Own Settings: Professional Identity */}
                        <div className="bg-[#0E5858] p-10 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <ShieldCheck size={80} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00B6C1] mb-2">Professional Identity</p>
                                <h2 className="text-3xl font-serif mb-6">Your Contact Information</h2>

                                <div className="flex flex-col md:flex-row gap-6 items-end">
                                    <div className="flex-1 space-y-2">
                                        <label className="text-[9px] font-bold opacity-60 uppercase tracking-widest ml-1">Corporate Contact (Mobile)</label>
                                        <input
                                            type="text"
                                            value={adminPhone}
                                            onChange={(e) => setAdminPhone(e.target.value)}
                                            placeholder="+91 00000 00000"
                                            className="w-full bg-white/10 border border-white/10 rounded-xl py-3 px-6 text-sm outline-none focus:bg-white/20 transition-all font-semibold"
                                        />
                                    </div>
                                    <button
                                        onClick={handleUpdateAdminProfile}
                                        disabled={updatingAdmin}
                                        className="px-8 py-3 bg-[#00B6C1] text-[#0E5858] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-lg"
                                    >
                                        {updatingAdmin ? <Loader2 size={16} className="animate-spin" /> : "Save Identity"}
                                    </button>
                                </div>
                                <p className="text-[9px] mt-4 opacity-40 font-medium">This information will be visible to counsellors assigned to you as their Training Buddy.</p>
                            </div>
                        </div>

                        <header className="text-center pt-8">
                            <h2 className="text-4xl font-serif text-[#0E5858] tracking-tight mb-4 text-center">Provision Access</h2>
                            <p className="text-gray-400 font-medium max-w-md mx-auto italic text-sm">Deploy secure credentials to new team members.</p>
                        </header>

                        <form onSubmit={handleCreateUser} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-[#0E5858]/5 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-[#0E5858]/50 uppercase tracking-[0.2em] ml-3">Full Legal Name</label>
                                    <input
                                        type="text"
                                        value={newUser.fullName}
                                        onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                                        placeholder="Name"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-6 text-sm font-semibold focus:ring-2 focus:ring-[#00B6C1]/10 outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-[#0E5858]/50 uppercase tracking-[0.2em] ml-3">Corporate Email</label>
                                    <input
                                        type="email"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        placeholder="email@balancenutrition.in"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-6 text-sm font-semibold focus:ring-2 focus:ring-[#00B6C1]/10 outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-4 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] font-black text-[#0E5858]/40 uppercase tracking-[0.2em] mb-2">Training Buddy Identity</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-[#0E5858]/50 uppercase tracking-[0.2em] ml-3">Buddy Name</label>
                                            <input
                                                type="text"
                                                value={newUser.buddyName}
                                                onChange={(e) => setNewUser({ ...newUser, buddyName: e.target.value })}
                                                placeholder="BN Admin"
                                                className="w-full bg-white border border-gray-100 rounded-xl py-4 px-6 text-sm font-semibold outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-[#0E5858]/50 uppercase tracking-[0.2em] ml-3">Buddy Email</label>
                                            <input
                                                type="email"
                                                value={newUser.buddyEmail}
                                                onChange={(e) => setNewUser({ ...newUser, buddyEmail: e.target.value })}
                                                placeholder="admin@email.com"
                                                className="w-full bg-white border border-gray-100 rounded-xl py-4 px-6 text-sm font-semibold outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-[9px] font-black text-[#0E5858]/50 uppercase tracking-[0.2em] ml-3">Buddy Corporate Phone</label>
                                            <input
                                                type="text"
                                                value={newUser.buddyPhone}
                                                onChange={(e) => setNewUser({ ...newUser, buddyPhone: e.target.value })}
                                                placeholder="+91 00000 00000"
                                                className="w-full bg-white border border-gray-100 rounded-xl py-4 px-6 text-sm font-semibold outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-[#0E5858]/50 uppercase tracking-[0.2em] ml-3">Temporary Password</label>
                                    <input
                                        type="password"
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-6 text-sm font-semibold focus:ring-2 focus:ring-[#00B6C1]/10 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            {userError && <p className="text-red-500 text-[10px] font-bold text-center">{userError}</p>}
                            {userSuccess && <p className="text-green-500 text-[10px] font-bold text-center">{userSuccess}</p>}

                            <button
                                type="submit"
                                disabled={creatingUser}
                                className="w-full py-5 bg-[#0E5858] text-white rounded-xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-[#00B6C1] transition-all"
                            >
                                {creatingUser ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Provision Account"}
                            </button>
                        </form>
                    </motion.div>
                ) : activeTab === 'architect' ? (
                    <motion.div key="architect" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-12">
                        <header>
                            <h2 className="text-4xl font-serif text-[#0E5858] tracking-tight">Content Architect</h2>
                            <p className="text-gray-400 font-medium mt-3 italic text-sm">Synchronize resources across the academy.</p>
                        </header>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <form onSubmit={handleUpdateContent} className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#0E5858]/5 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-3">Module</label>
                                    <select
                                        value={contentForm.moduleId}
                                        onChange={e => setContentForm({ ...contentForm, moduleId: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-6 text-sm font-semibold outline-none"
                                        required
                                    >
                                        <option value="">Select Target</option>
                                        {syllabusData.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        value={contentForm.topicTitle}
                                        onChange={e => setContentForm({ ...contentForm, topicTitle: e.target.value })}
                                        placeholder="Topic Name"
                                        className="bg-gray-50 border border-gray-100 rounded-xl py-4 px-6 text-sm font-semibold outline-none"
                                        required
                                    />
                                    <select
                                        value={contentForm.contentType}
                                        onChange={e => setContentForm({ ...contentForm, contentType: e.target.value })}
                                        className="bg-gray-50 border border-gray-100 rounded-xl py-4 px-6 text-sm font-semibold outline-none"
                                    >
                                        <option value="video">Video</option>
                                        <option value="document">Manual</option>
                                        <option value="link">Link</option>
                                    </select>
                                </div>

                                <input
                                    type="url"
                                    value={contentForm.contentLink}
                                    onChange={e => setContentForm({ ...contentForm, contentLink: e.target.value })}
                                    placeholder="Resource URL"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-6 text-sm font-semibold outline-none"
                                    required
                                />

                                <button
                                    type="submit"
                                    disabled={uploadingContent}
                                    className="w-full py-4 bg-[#00B6C1] text-[#0E5858] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#0E5858] hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    {uploadingContent ? <Loader2 className="animate-spin" size={16} /> : "Update Content Bank"}
                                </button>
                            </form>

                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#0E5858]/5 overflow-hidden flex flex-col max-h-[500px]">
                                <h3 className="text-xl font-serif text-[#0E5858] mb-6">Active Resource Nodes</h3>
                                <div className="space-y-3 overflow-y-auto pr-2 scrollbar-hide">
                                    {dynamicContent.map(content => (
                                        <div key={content.id} className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 flex items-center justify-between group">
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-[#0E5858] truncate">{content.title}</p>
                                                <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">{content.module_id}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <a href={content.content} target="_blank" className="p-2 text-gray-300 hover:text-[#00B6C1] transition-all"><ExternalLink size={12} /></a>
                                                <button onClick={() => handleDeleteContent(content.id)} className="p-2 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={12} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="registry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-12">
                        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                            <div>
                                <h2 className="text-4xl font-serif text-[#0E5858] tracking-tight">Unified Registry</h2>
                                <p className="text-gray-400 font-medium mt-3 italic text-sm">Full historical searchable directory of all academy members.</p>
                            </div>
                            <div className="relative w-full lg:w-[400px]">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search by name or email..."
                                    className="w-full bg-white border border-[#0E5858]/10 rounded-2xl py-4 pl-14 pr-6 text-sm font-medium shadow-sm focus:ring-2 focus:ring-[#00B6C1]/10 outline-none transition-all"
                                />
                            </div>
                        </header>

                        <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-[#0E5858]/5">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-[#0E5858]/5 text-[9px] font-black uppercase tracking-[0.2em] text-[#0E5858]/50">
                                            <th className="px-8 py-6">Counsellor</th>
                                            <th className="px-6 text-center">Credentials</th>
                                            <th className="px-6">Joined</th>
                                            <th className="px-6 text-center">Avg Score</th>
                                            <th className="px-6 text-center">Progress %</th>
                                            <th className="px-6">Role</th>
                                            <th className="px-8 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredRegistry.map(p => {
                                            const userProgress = progress.filter(pr => pr.user_id === p.id);
                                            const globalPercent = Math.min(100, Math.round((userProgress.length / (TOTAL_SYLLABUS_TOPICS || 1)) * 100));

                                            return (
                                                <tr key={p.id} className="group hover:bg-[#FAFCEE]/50 transition-all cursor-pointer" onClick={() => setSelectedProfile(p)}>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-[#0E5858] text-white flex items-center justify-center font-black group-hover:bg-[#00B6C1] transition-colors">{p.full_name?.[0] || 'U'}</div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-serif text-[#0E5858] font-bold truncate">{p.full_name}</p>
                                                                <div className="flex flex-col gap-0.5 mt-0.5">
                                                                    <p className="text-[9px] font-bold text-gray-400 tracking-wider truncate">{p.email}</p>
                                                                    {(() => {
                                                                        const userAct = activity.filter(a => a.user_id === p.id);
                                                                        const lastAct = userAct[0];
                                                                        if (!lastAct) return <p className="text-[7px] font-black text-gray-300 uppercase italic">No recent activity</p>;
                                                                        return (
                                                                            <div className="flex flex-col gap-0.5 mt-1">
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <div className="w-1 h-1 rounded-full bg-[#00B6C1] animate-pulse"></div>
                                                                                    <p className="text-[8px] font-black text-[#00B6C1] uppercase tracking-tight truncate max-w-[150px]">
                                                                                        {lastAct.activity_type.replace('_', ' ')}: {lastAct.content_title}
                                                                                    </p>
                                                                                </div>
                                                                                <p className="text-[6px] font-black text-gray-300 uppercase tracking-widest pl-2.5">+{userAct.length - 1} other actions</p>
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <div className="flex items-center gap-2 group/cred">
                                                                <Mail size={10} className="text-[#00B6C1]" />
                                                                <code className="text-[10px] font-mono text-[#0E5858]/60 bg-white px-2 py-0.5 rounded border border-[#0E5858]/5">{p.email}</code>
                                                            </div>
                                                            <div className="flex items-center gap-2 group/cred">
                                                                <BNKeyIcon size={10} className="text-orange-400" />
                                                                <code className="text-[10px] font-mono text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">{p.temp_password || '515148'}</code>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 text-[10px] font-bold text-[#0E5858]">
                                                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : '--'}
                                                    </td>
                                                    <td className="px-6 text-center">
                                                        {(() => {
                                                            const userAssessments = assessments.filter(a => a.user_id === p.id);
                                                            const avg = userAssessments.length > 0
                                                                ? Math.round(userAssessments.reduce((acc, a) => acc + (a.score / (a.total_questions || 5)), 0) / userAssessments.length * 100)
                                                                : 0;
                                                            return <span className={`text-[10px] font-black ${avg >= 70 ? 'text-green-500' : 'text-orange-400'}`}>{avg}%</span>;
                                                        })()}
                                                    </td>
                                                    <td className="px-6">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <span className="text-xs font-serif font-bold text-[#0E5858]">{globalPercent}%</span>
                                                            <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-[#00B6C1]" style={{ width: `${globalPercent}%` }} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6">
                                                        <span className={`px-3 py-1 text-[8px] font-black uppercase rounded-lg border ${p.role === 'admin' ? 'bg-teal-50 text-teal-600 border-teal-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                                            {p.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 text-right">
                                                        <button
                                                            className="p-3 rounded-lg hover:bg-[#0E5858] hover:text-white transition-all text-gray-300"
                                                        >
                                                            <ArrowUpRight size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Assessment Detail Modal */}
            <AnimatePresence>
                {selectedQuiz && (
                    <div className="fixed inset-0 bg-[#0E5858]/80 backdrop-blur-md z-[100] flex items-center justify-center p-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl relative overflow-hidden"
                        >
                            <button onClick={() => setSelectedQuiz(null)} className="absolute top-8 right-8 text-gray-300 hover:text-[#0E5858] transition-all"><XCircle size={32} /></button>
                            <div className="mb-10 text-center">
                                <p className="text-[10px] font-black text-[#00B6C1] uppercase tracking-[0.3em] mb-2">Assessment Results</p>
                                <h3 className="text-3xl font-serif text-[#0E5858] mb-4">{selectedQuiz.topic_code}</h3>
                                <div className="inline-block px-8 py-4 bg-[#FAFCEE] rounded-2xl">
                                    <p className="text-5xl font-serif text-[#0E5858] mb-1">{Math.round((selectedQuiz.score / (selectedQuiz.total_questions || 5)) * 100)}%</p>
                                    <p className="text-[8px] font-black text-[#00B6C1] uppercase tracking-widest">Efficiency Rating</p>
                                </div>
                            </div>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 scrollbar-hide">
                                {selectedQuiz.raw_data?.questions?.map((q: any, i: number) => (
                                    <div key={i} className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                                        <p className="text-xs font-bold text-[#0E5858] mb-3">Q{i + 1}: {q.question}</p>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-[#00B6C1] uppercase">Drafted:</span>
                                            <span className="text-[11px] font-medium text-gray-500">{selectedQuiz.raw_data.answers[i]}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Audit Data Modal */}
            <AnimatePresence>
                {selectedAudit && (
                    <div className="fixed inset-0 bg-[#0E5858]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-8 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 30 }}
                            className="bg-white rounded-[4rem] p-12 max-w-5xl w-full shadow-2xl relative my-auto"
                        >
                            <button onClick={() => setSelectedAudit(null)} className="absolute top-10 right-10 text-gray-300 hover:text-[#0E5858] transition-all"><XCircle size={40} /></button>

                            <div className="flex items-center gap-6 mb-12">
                                <div className="w-20 h-20 bg-[#FAFCEE] rounded-[2rem] flex items-center justify-center text-[#0E5858] border border-[#0E5858]/5">
                                    <ClipboardList size={40} />
                                </div>
                                <div>
                                    <h3 className="text-4xl font-serif text-[#0E5858] mb-2">{selectedAudit.topic_code}</h3>
                                    <p className="text-xs font-bold text-[#00B6C1] uppercase tracking-widest">Comprehensive Peer Audit Report</p>
                                </div>
                            </div>

                            {(() => {
                                try {
                                    const data = JSON.parse(selectedAudit.summary_text || '{}');
                                    return (
                                        <div className="space-y-12">
                                            {/* Persona Section */}
                                            {data.metadata?.user_persona && (
                                                <div className="grid md:grid-cols-2 gap-8">
                                                    <div className="p-8 bg-[#0E5858] rounded-[2.5rem] text-white">
                                                        <p className="text-[9px] font-black text-[#00B6C1] uppercase tracking-widest mb-4">Audit Identity / Persona</p>
                                                        <p className="text-sm font-medium leading-relaxed italic opacity-80 mb-4 whitespace-pre-wrap">"{data.metadata.user_persona.story}"</p>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#00B6C1]"></div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest">Health Goal: {data.metadata.user_persona.goal}</p>
                                                        </div>
                                                    </div>
                                                    <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex flex-col justify-center">
                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Audit Entities Analyzed</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {data.metadata.companies?.map((c: string) => (
                                                                <span key={c} className="px-4 py-2 bg-white rounded-xl text-[10px] font-bold text-[#0E5858] border border-gray-100 shadow-sm">{c}</span>
                                                            ))}
                                                            {data.metadata.dieticians?.map((d: string) => (
                                                                <span key={d} className="px-4 py-2 bg-[#00B6C1] rounded-xl text-[10px] font-bold text-white shadow-sm">{d}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Comparative Matrix */}
                                            <div className="space-y-6">
                                                <h4 className="text-xs font-black text-[#0E5858]/40 uppercase tracking-[0.2em] flex items-center gap-3">
                                                    <BrainCircuit size={16} className="text-[#00B6C1]" /> Comparative Findings
                                                </h4>

                                                <div className="space-y-4">
                                                    {data.questions?.map((q: string, qIdx: number) => {
                                                        const answers = data.answers[qIdx];
                                                        const brands = qIdx >= 9 && data.metadata.dieticians ? data.metadata.dieticians : (data.metadata.companies || []);

                                                        return (
                                                            <div key={qIdx} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                                <div className="p-6 bg-gray-50/50 border-b border-gray-100">
                                                                    <p className="text-xs font-bold text-[#0E5858]">{qIdx + 1}. {q}</p>
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                                                                    {[0, 1, 2].map(entityIdx => (
                                                                        <div key={entityIdx} className="p-6 space-y-2">
                                                                            <p className="text-[8px] font-black text-[#00B6C1] uppercase tracking-widest">{entityIdx === 0 ? "Balance Nutrition" : (brands[entityIdx - 1] || 'Entity')}</p>
                                                                            <p className="text-[11px] text-gray-600 leading-relaxed font-medium">{answers[entityIdx] || '--'}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                } catch (e) {
                                    return <p className="text-center py-20 text-red-400 font-bold uppercase tracking-widest">Data Decryption Error: Payload Malformed</p>;
                                }
                            })()}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function AdminDashboard() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-[#00B6C1]"><Loader2 className="animate-spin" size={32} /></div>}>
            <AdminDashboardContent />
        </Suspense>
    );
}
