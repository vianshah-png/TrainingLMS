"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
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
    Layout,
    Sparkles,
    Bell,
    Edit3,
    Activity,
    X,
    Play,
    ScanEye,
    Share2
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
    temp_password?: string;
    phone?: string;
    training_buddy: string;
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
    score?: number;
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

const TOTAL_SYLLABUS_TOPICS = syllabusData
    .filter(m => m.id !== 'resource-bank')
    .reduce((acc, mod) => acc + mod.topics.length, 0);

const NOTIFICATION_TEMPLATES = [
    { id: 'inactive', label: 'Inactive', title: 'Account Status: Inactive', message: 'Your account has been flagged as inactive due to low engagement. Please resume your training modules to remain eligible for upcoming certifications.', type: 'info' },
    { id: 'feedback', label: 'Feedback Request', title: 'Training Feedback', message: 'We value your experience! Please provide a star rating and a brief note about the clarity and utility of your recent modules.', type: 'alert', template: 'feedback' },
    { id: 'retake', label: 'Retake Test', title: 'Performance Review: Retake Required', message: 'Your recent assessment score was below the mastery threshold. Please revisit the module and retake the test once you are ready.', type: 'alert' },
    { id: 'buddy_report', label: 'Trainer Buddy Summary Email', title: 'Weekly Mentorship Report', message: 'This report contains an automated summary of all your assigned counsellors, including their current activity, training progress, and latest quiz scores.', type: 'info', template: 'buddy_report' },
];

interface DynamicContent {
    id: string;
    module_id: string;
    topic_code: string;
    title: string;
    content_type: string;
    content: string;
    created_at: string;
}

interface TopicProgress {
    user_id: string;
    topic_code: string;
    module_id: string;
    completed_at: string;
}

function AdminDashboardContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'hub' | 'provisioning' | 'architect' | 'registry'>('registry');
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
    const [userRole, setUserRole] = useState<string>("");

    // Form States
    const [newUser, setNewUser] = useState({
        email: "",
        password: "",
        fullName: "",
        role: "counsellor",
        phone: "",
        buddies: [{ name: "BN Admin", email: "admin@balancenutrition.in", phone: "0000000000" }]
    });
    const [creatingUser, setCreatingUser] = useState(false);
    const [userSuccess, setUserSuccess] = useState("");
    const [userError, setUserError] = useState("");
    const [lastCreatedUser, setLastCreatedUser] = useState<any>(null);
    const [deleteConfirm, setDeleteConfirm] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [resettingUser, setResettingUser] = useState(false);
    const [adminPhone, setAdminPhone] = useState("");
    const [updatingAdmin, setUpdatingAdmin] = useState(false);
    const [currentAdmin, setCurrentAdmin] = useState<Profile | null>(null);
    const hasSyncedRegistry = useRef(false);

    const [contentForm, setContentForm] = useState({
        id: "",
        topicCode: "",
        moduleId: "",
        topicTitle: "",
        contentType: "video",
        contentLink: "",
    });
    const [uploadingContent, setUploadingContent] = useState(false);
    const [contentSuccess, setContentSuccess] = useState("");
    const [contentError, setContentError] = useState("");
    const [isCleaning, setIsCleaning] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [cleanupSuccess, setCleanupSuccess] = useState("");
    const [cleanupError, setCleanupError] = useState("");


    const [editingBuddy, setEditingBuddy] = useState(false);
    const [buddyList, setBuddyList] = useState<{ name: string; email: string; phone: string }[]>([]);
    const [updatingBuddy, setUpdatingBuddy] = useState(false);

    const [editingPhone, setEditingPhone] = useState(false);
    const [tempPhone, setTempPhone] = useState("");
    const [updatingPhone, setUpdatingPhone] = useState(false);

    const [editingRole, setEditingRole] = useState(false);
    const [tempRole, setTempRole] = useState("");
    const [updatingRole, setUpdatingRole] = useState(false);

    // Quiz Editor States
    const [selectedQuizTopic, setSelectedQuizTopic] = useState("");
    const [manualQuizQuestions, setManualQuizQuestions] = useState<any[]>([]);
    const [isFetchingQuiz, setIsFetchingQuiz] = useState(false);
    const [isSavingQuiz, setIsSavingQuiz] = useState(false);
    const [quizSuccess, setQuizSuccess] = useState("");
    const [quizError, setQuizError] = useState("");
    const [customAIPrompt, setCustomAIPrompt] = useState("");
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

    // Notification States
    const [notificationForm, setNotificationForm] = useState({
        title: "",
        message: "",
        type: "info" as "info" | "warning" | "alert",
        template: "none" as "none" | "ack" | "feedback" | "rating",
        interactionPayload: {} as any
    });
    const [sendingNotification, setSendingNotification] = useState(false);
    const [notificationSuccess, setNotificationSuccess] = useState("");
    const [receivedNotifications, setReceivedNotifications] = useState<any[]>([]);
    const [showReceivedNotifications, setShowReceivedNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Email Modal States
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailForm, setEmailForm] = useState({
        to: "",
        subject: "",
        message: "",
        userName: ""
    });
    const [emailSuccess, setEmailSuccess] = useState("");
    const [emailError, setEmailError] = useState("");


    const isTrainerBuddyRole = userRole === 'trainer buddy';

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['hub', 'provisioning', 'architect', 'registry'].includes(tab)) {
            // Restriction for trainer buddies — only hub and registry allowed
            if (isTrainerBuddyRole && ['provisioning', 'architect'].includes(tab)) {
                setActiveTab('registry');
                router.replace('/admin?tab=registry');
            } else {
                setActiveTab(tab as any);
            }
        }
    }, [searchParams, userRole, router, isTrainerBuddyRole]);

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
            console.log("[Admin Auth] Current user profile:", aProfile?.email, "| Role:", aProfile?.role);
            if (aProfile) {
                setCurrentAdmin(aProfile);
                setAdminPhone(aProfile.phone || "");
                const currentRole = aProfile.role || "";
                setUserRole(currentRole);

                // Restricted: Standard counsellors cannot access Admin Portal
                if (currentRole === 'counsellor' || currentRole === 'mentor') {
                    console.log("[Admin Auth] Redirecting counsellor/mentor to dashboard");
                    router.push('/');
                    return;
                }
            }

            // Fetch received notifications for the logged in admin/buddy
            const { data: actualNotifs } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (actualNotifs) {
                setReceivedNotifications(actualNotifs);
                setUnreadCount(actualNotifs.filter(n => !n.is_read).length);
            }

            setLoading(false);
        };
        checkAuth();

        const activityChannel = supabase
            .channel('admin-activity-updates')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'mentor_activity_logs' },
                (payload) => {
                    setActivity(prev => [payload.new as ActivityLog, ...prev]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(activityChannel);
        };
    }, [router]);

    const refreshData = async () => {
        try {
            console.log("Master Sync Started...");

            // Get current session and user role first to know how to filter
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: userProfile } = await supabase
                .from('profiles')
                .select('role, email')
                .eq('id', session.user.id)
                .single();

            const isTrainerBuddy = userProfile?.role === 'trainer buddy';
            const userEmail = userProfile?.email;

            // Optional: Pull in latest metadata from Auth for orphaned profiles or missing fields
            if (!hasSyncedRegistry.current && !isTrainerBuddy) {
                try {
                    const syncRes = await fetch('/api/admin/sync-registry', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                        }
                    });
                    if (syncRes.ok) {
                        hasSyncedRegistry.current = true;
                        console.log("Master Registry Synchronized successfully.");
                    }
                } catch (e) {
                    console.warn("Auto-Sync skipped:", e);
                }
            }

            const [
                { data: pData, error: pError },
                { data: aData, error: aError },
                { data: actData, error: actError },
                { data: audData, error: audError },
                { data: cData, error: cError },
                { data: prData, error: prError }
            ] = await Promise.all([
                supabase.from('profiles').select('*').order('created_at', { ascending: false }),
                supabase.from('assessment_logs').select('*').order('created_at', { ascending: false }),
                supabase.from('mentor_activity_logs').select('*').order('created_at', { ascending: false }),
                supabase.from('summary_audits').select('*').order('created_at', { ascending: false }),
                supabase.from('syllabus_content').select('*').order('module_id', { ascending: true }),
                supabase.from('mentor_progress').select('*').order('completed_at', { ascending: false })
            ]);

            if (pError) console.error("Profiles error:", pError);
            if (prError) console.error("Progress error:", prError);

            let filteredProfiles = pData || [];
            if (isTrainerBuddy && userEmail) {
                console.log("[Buddy Filter] Trainer buddy email:", userEmail, "| Total profiles:", pData?.length);
                filteredProfiles = (pData || []).filter(p => {
                    try {
                        const buddies = JSON.parse(p.training_buddy || '[]');
                        const buddiesArray = Array.isArray(buddies) ? buddies : [buddies];
                        const match = buddiesArray.some((b: any) => b.email?.toLowerCase() === userEmail.toLowerCase());
                        if (match) console.log("[Buddy Filter] MATCHED:", p.email, p.full_name);
                        return match;
                    } catch (e) {
                        // Fallback for comma separated legacy data
                        return p.training_buddy?.toLowerCase().includes(userEmail.toLowerCase());
                    }
                });
                console.log("[Buddy Filter] Filtered counsellors count:", filteredProfiles.length);
            }

            const allowedUserIds = new Set(filteredProfiles.map(p => p.id));

            const filteredAssessments = (aData || []).filter(a => allowedUserIds.has(a.user_id));
            const filteredActivityLogs = (actData || []).filter(act => allowedUserIds.has(act.user_id));
            const filteredAudits = (audData || []).filter(aud => allowedUserIds.has(aud.user_id));
            const filteredProgress = (prData || []).filter(pr => allowedUserIds.has(pr.user_id));

            // Create a unified activity feed by merging logs, assessments, and progress
            const combinedActivity = [
                ...filteredActivityLogs,
                ...filteredAssessments.map(a => {
                    // Try to find title in syllabus
                    let title = a.topic_code;
                    for (const mod of syllabusData) {
                        if (a.topic_code === `MODULE_${mod.id}`) title = mod.title;
                        const t = mod.topics?.find(top => top.code === a.topic_code);
                        if (t) title = t.title;
                    }
                    return {
                        id: `assessment-${a.id}`,
                        user_id: a.user_id,
                        activity_type: a.topic_code?.startsWith('MODULE_') ? 'complete_module' : 'complete_quiz',
                        content_title: title,
                        topic_code: a.topic_code,
                        created_at: a.created_at,
                        score: a.score
                    };
                }),
                ...filteredProgress.map(p => {
                    // Find topic title
                    let title = p.topic_code;
                    const mod = syllabusData.find(m => m.id === p.module_id);
                    if (mod) {
                        const t = mod.topics?.find(top => top.code === p.topic_code);
                        if (t) title = t.title;
                    }
                    return {
                        id: `progress-${p.user_id}-${p.topic_code}`,
                        user_id: p.user_id,
                        activity_type: 'complete_segment',
                        content_title: title,
                        topic_code: p.topic_code,
                        created_at: p.completed_at || p.created_at || new Date().toISOString()
                    };
                })
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            const uniqueActivity: ActivityLog[] = [];
            const seen = new Set();
            combinedActivity.forEach(act => {
                const key = `${act.user_id}-${act.topic_code || act.content_title}-${act.activity_type}`;
                if (!seen.has(key)) {
                    uniqueActivity.push(act as ActivityLog);
                    seen.add(key);
                }
            });

            setProfiles(filteredProfiles);
            setAssessments(filteredAssessments);
            setActivity(uniqueActivity);
            setAudits(filteredAudits);
            setDynamicContent(cData || []);
            setProgress(filteredProgress);
            console.log("Master Sync Complete. Profiles:", filteredProfiles.length, "Activity:", uniqueActivity.length);
        } catch (err) {
            console.error("Master Sync Fatal Error:", err);
        }
    };

    const counsellors = useMemo(() => profiles.filter(p => p.role === 'counsellor' || p.role === 'mentor'), [profiles]);
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
        setLastCreatedUser(null);

        try {
            // Force a session refresh check before potentially long operations
            await supabase.auth.getUser();
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) throw new Error('Session Expired. Please refresh the page or log in again.');

            // Validation for buddies
            const incompleteBuddy = newUser.buddies.find(b => !b.name || !b.email || !b.phone);
            if (incompleteBuddy) {
                throw new Error("Please provide complete contact information (Name, Email, Phone) for all training buddies.");
            }

            const buddyInfo = JSON.stringify(newUser.buddies);

            const response = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    email: newUser.email,
                    password: newUser.password,
                    fullName: newUser.fullName,
                    role: newUser.role,
                    phone: newUser.phone,
                    trainingBuddy: buddyInfo
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Provisioning failed');

            setUserSuccess(`Authorized: ${newUser.email}. Account created.`);
            setLastCreatedUser({ ...newUser });
            setNewUser({
                email: "", password: "", fullName: "", role: "counsellor", phone: "",
                buddies: [{ name: "BN Admin", email: "admin@balancenutrition.in", phone: "0000000000" }]
            });
            refreshData();
        } catch (err: any) {
            setUserError(err.message);
        } finally {
            setCreatingUser(false);
        }
    };

    const handleCleanupAccounts = async () => {
        if (!confirm("CRITICAL ACTION: This will PERMANENTLY delete all Supabase Auth accounts that do not have a matching 'profile' in the Unified Registry. Restored accounts WILL NOT be possible. Continue?")) return;

        setIsCleaning(true);
        setCleanupError("");
        setCleanupSuccess("");

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Session expired. Please log in again.');

            const response = await fetch('/api/admin/cleanup-users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                }
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Cleanup failed');

            setCleanupSuccess(data.message);
            refreshData();
        } catch (err: any) {
            setCleanupError(err.message);
        } finally {
            setIsCleaning(false);
        }
    };

    const handleUpdateContent = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploadingContent(true);
        setContentError("");
        setContentSuccess("");

        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) throw new Error('Session expired. Please log in again.');

            const response = await fetch('/api/admin/content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify(contentForm),
            });

            if (!response.ok) throw new Error('Architecture synchronization failed');

            setContentSuccess("Content Bank synchronized across all nodes.");
            setContentForm({ id: "", topicCode: "", moduleId: "", topicTitle: "", contentType: "video", contentLink: "" });
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




    const handleUpdateAdminProfile = async () => {
        if (!currentAdmin) return;
        setUpdatingAdmin(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: currentAdmin.full_name,
                    phone: adminPhone
                })
                .eq('id', currentAdmin.id);
            if (error) throw error;
            alert("Profile synchronized!");
            refreshData();
        } catch (err: any) {
            alert("Failed to update: " + err.message);
        } finally {
            setUpdatingAdmin(false);
        }
    };

    const handleUpdateUserPhone = async () => {
        if (!selectedProfile) return;
        setUpdatingPhone(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ phone: tempPhone })
                .eq('id', selectedProfile.id);
            if (error) throw error;

            setSelectedProfile({ ...selectedProfile, phone: tempPhone });
            setEditingPhone(false);
            refreshData();
        } catch (err: any) {
            alert("Failed to update phone: " + err.message);
        } finally {
            setUpdatingPhone(false);
        }
    };

    const handleUpdateUserRole = async () => {
        if (!selectedProfile) return;
        setUpdatingRole(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: tempRole })
                .eq('id', selectedProfile.id);
            if (error) throw error;

            setSelectedProfile({ ...selectedProfile, role: tempRole });
            setEditingRole(false);
            refreshData();
            alert(`Role updated to ${tempRole} successfully.`);
        } catch (err: any) {
            alert("Failed to update role: " + err.message);
        } finally {
            setUpdatingRole(false);
        }
    };

    const handleUpdateBuddy = async () => {
        if (!selectedProfile) return;
        setUpdatingBuddy(true);
        try {
            const incompleteBuddy = buddyList.find(b => !b.name || !b.email || !b.phone);
            if (incompleteBuddy) {
                throw new Error("Please provide complete contact information (Name, Email, Phone) for all buddies.");
            }

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
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Session expired");

            const res = await fetch('/api/admin/clear-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ userId })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to clear history");

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
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) throw new Error('Session expired. Please log in again.');

            // Pre-cleanup: delete related data to avoid foreign key issues
            await Promise.all([
                supabase.from('mentor_activity_logs').delete().eq('user_id', selectedProfile.id),
                supabase.from('mentor_progress').delete().eq('user_id', selectedProfile.id),
                supabase.from('assessment_logs').delete().eq('user_id', selectedProfile.id),
                supabase.from('summary_audits').delete().eq('user_id', selectedProfile.id),
                supabase.from('notifications').delete().eq('user_id', selectedProfile.id)
            ]);

            const res = await fetch('/api/admin/delete-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ userId: selectedProfile.id })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Deletion failed");

            alert("Account permanently removed.");
            setSelectedProfile(null);
            refreshData();
        } catch (err: any) {
            alert("Delete failed: " + err.message);
        } finally {
            setIsDeleting(false);
            setDeleteConfirm("");
        }
    };

    const handleFetchManualQuiz = async (topicCode: string) => {
        if (!topicCode) {
            setManualQuizQuestions([]);
            return;
        }
        setIsFetchingQuiz(true);
        setQuizError("");
        setQuizSuccess("");
        try {
            const res = await fetch(`/api/admin/quiz?topicCode=${topicCode}`);
            const data = await res.json();
            if (data.quiz) {
                setManualQuizQuestions(data.quiz.questions);
            } else {
                setManualQuizQuestions([]);
            }
        } catch (err: any) {
            setQuizError("Failed to load quiz.");
        } finally {
            setIsFetchingQuiz(false);
        }
    };

    const handleSaveManualQuiz = async () => {
        if (!selectedQuizTopic) return;
        setIsSavingQuiz(true);
        setQuizError("");
        setQuizSuccess("");
        try {
            // Force user/session refresh
            await supabase.auth.getUser();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) throw new Error("Session expired. Please log in again.");

            const res = await fetch('/api/admin/quiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    topicCode: selectedQuizTopic,
                    questions: manualQuizQuestions
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Save failed");
            setQuizSuccess("Quiz protocols synchronized successfully.");
        } catch (err: any) {
            setQuizError(err.message);
        } finally {
            setIsSavingQuiz(false);
        }
    };

    const handleDeleteManualQuiz = async () => {
        if (!selectedQuizTopic || !confirm("Delete all manual questions for this topic? It will fallback to AI generation.")) return;
        setIsSavingQuiz(true);
        try {
            await supabase.auth.getUser();
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Session expired. Please log in again.");

            const res = await fetch(`/api/admin/quiz?topicCode=${selectedQuizTopic}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            if (!res.ok) throw new Error("Delete failed");
            setManualQuizQuestions([]);
            setQuizSuccess("Manual quiz removed. System restored to AI defaults.");
        } catch (err: any) {
            setQuizError(err.message);
        } finally {
            setIsSavingQuiz(false);
        }
    };

    const handleSendNotification = async (userId: string, channel: 'dashboard' | 'email' | 'whatsapp' | 'all' = 'dashboard') => {
        if (!notificationForm.title || !notificationForm.message) return;
        setSendingNotification(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Session expired");

            const res = await fetch('/api/admin/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    userId,
                    ...notificationForm,
                    channel
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send notification");

            // If WhatsApp, open the link
            if (data.results?.whatsapp) {
                window.open(data.results.whatsapp, '_blank');
            }

            const sent: string[] = [];
            if (data.results?.dashboard) sent.push('Dashboard');
            if (data.results?.email) sent.push('Email');
            if (data.results?.whatsapp) sent.push('WhatsApp');

            setNotificationSuccess(`Sent via: ${sent.join(', ') || channel}`);
            if (channel !== 'whatsapp') {
                setNotificationForm({ title: "", message: "", type: "info", template: "none", interactionPayload: {} });
            }
            setTimeout(() => setNotificationSuccess(""), 4000);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSendingNotification(false);
        }
    };

    const handleGenerateReport = async () => {
        setIsGeneratingReport(true);
        try {
            const res = await fetch('/api/admin/reports/daily');
            const data = await res.json();
            if (res.ok) {
                setReportData(data);
                alert("Daily Progress Report generated. View summary in console or registry.");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to generate report.");
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const handleApplyTemplate = (tempId: string) => {
        const template = NOTIFICATION_TEMPLATES.find(t => t.id === tempId);
        if (template) {
            setNotificationForm({
                title: template.title,
                message: template.message,
                type: template.type as any,
                template: template.id as any,
                interactionPayload: {}
            });
        }
    };
    const handleGenerateAISuggestions = async () => {
        if (!selectedQuizTopic) return;
        setIsGeneratingSuggestions(true);
        setQuizError("");
        setQuizSuccess("");
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Session expired. Please log in again.");

            // Find topic title and content from syllabus + dynamic content
            const topicId = selectedQuizTopic.replace("MODULE_", "");
            const module = syllabusData.find(m => m.id === topicId);
            const topicTitle = module?.title || "Unknown Topic";

            // Static content + Dynamic content
            const staticContent = module?.topics.map(t => `${t.title}: ${t.content}`).join("\n") || "";
            const moduleDynamicContent = dynamicContent
                .filter(d => d.module_id === topicId)
                .map(d => `${d.title}: ${d.content}`)
                .join("\n");

            const topicContent = `${staticContent}\n${moduleDynamicContent}`.trim();

            const res = await fetch('/api/admin/quiz/suggestions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    topicTitle,
                    topicContent,
                    customPrompt: customAIPrompt,
                    existingQuestions: manualQuizQuestions
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Generation failed");

            if (data.suggestions && data.suggestions.length > 0) {
                setManualQuizQuestions(data.suggestions);
                setQuizSuccess("AI suggested questions loaded. You can now edit and synchronize.");
            } else {
                throw new Error("AI failed to provide suggestions. Please try again.");
            }
        } catch (err: any) {
            setQuizError(err.message);
        } finally {
            setIsGeneratingSuggestions(false);
        }
    };

    const handleSendEmail = async () => {
        setSendingEmail(true);
        setEmailError("");
        setEmailSuccess("");
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Session expired");

            const res = await fetch('/api/admin/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify(emailForm)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send email");

            setEmailSuccess("Email dispatched successfully via Resend.");
            setTimeout(() => {
                setIsEmailModalOpen(false);
                setEmailSuccess("");
            }, 2000);
        } catch (err: any) {
            setEmailError(err.message);
        } finally {
            setSendingEmail(false);
        }
    };


    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="w-12 h-12 text-[#00B6C1] animate-spin" />
        </div>
    );

    return (
        <div className="p-8 lg:p-12 max-w-[1600px] mx-auto min-h-screen relative">
            {/* Global Notification Center for Admin/Buddy */}
            <div className="fixed bottom-8 right-8 z-[150]">
                <button
                    onClick={() => setShowReceivedNotifications(!showReceivedNotifications)}
                    className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-[#0E5858] shadow-2xl border border-[#0E5858]/10 hover:shadow-[#00B6C1]/20 transition-all relative group"
                >
                    <Bell size={28} className="group-hover:scale-110 transition-transform" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-4 border-[#FAFCEE] shadow-sm animate-bounce">
                            {unreadCount}
                        </span>
                    )}
                </button>

                <AnimatePresence>
                    {showReceivedNotifications && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="absolute bottom-20 right-0 w-96 bg-white rounded-[3rem] shadow-3xl border border-[#0E5858]/10 overflow-hidden"
                        >
                            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-[#FAFCEE]/50">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#0E5858] mb-1">Intelligence Inbox</h4>
                                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Management Alerts & Updates</p>
                                </div>
                                <button
                                    onClick={() => setShowReceivedNotifications(false)}
                                    className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <div className="max-h-[500px] overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                {receivedNotifications.length > 0 ? receivedNotifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className={`p-6 rounded-[2rem] border transition-all cursor-pointer ${n.is_read ? 'bg-white border-gray-50' : 'bg-[#FAFCEE] border-[#00B6C1]/20 shadow-md shadow-[#00B6C1]/5'}`}
                                        onClick={async () => {
                                            if (!n.is_read) {
                                                await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
                                                setReceivedNotifications(receivedNotifications.map(item => item.id === n.id ? { ...item, is_read: true } : item));
                                                setUnreadCount(prev => Math.max(0, prev - 1));
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`w-2 h-2 rounded-full ${n.type === 'alert' ? 'bg-red-500 animate-pulse' : n.type === 'warning' ? 'bg-amber-500' : 'bg-[#00B6C1]'}`} />
                                            <h5 className="text-[11px] font-black uppercase tracking-wider text-[#0E5858] truncate">{n.title}</h5>
                                        </div>
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed">{n.message}</p>
                                        <div className="flex items-center justify-between mt-4">
                                            <p className="text-[8px] text-gray-300 font-black uppercase tracking-widest">{new Date(n.created_at).toLocaleString()}</p>
                                            {!n.is_read && <span className="text-[8px] font-black text-[#00B6C1] uppercase tracking-widest">New</span>}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-20 text-center opacity-20">
                                        <Bell size={48} className="mx-auto mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No activity reported yet</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation Tabs */}
            {!selectedProfile && (
                <div className="flex flex-wrap items-center gap-2 mb-12 p-2 bg-white/50 backdrop-blur-sm rounded-3xl border border-[#0E5858]/5 w-fit">
                    <button
                        onClick={() => { setActiveTab('hub'); router.push('?tab=hub'); }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'hub' ? 'bg-[#0E5858] text-white shadow-lg shadow-[#0E5858]/20' : 'text-gray-400 hover:text-[#0E5858] hover:bg-white'}`}
                    >
                        <Activity size={14} /> Unified Hub
                    </button>
                    {(userRole === 'admin' || userRole === 'moderator') && (
                        <>
                            <button
                                onClick={() => { setActiveTab('provisioning'); router.push('?tab=provisioning'); }}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'provisioning' ? 'bg-[#0E5858] text-white shadow-lg shadow-[#0E5858]/20' : 'text-gray-400 hover:text-[#0E5858] hover:bg-white'}`}
                            >
                                <UserPlus size={14} /> Provisioning
                            </button>
                            <button
                                onClick={() => { setActiveTab('architect'); router.push('?tab=architect'); }}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'architect' ? 'bg-[#0E5858] text-white shadow-lg shadow-[#0E5858]/20' : 'text-gray-400 hover:text-[#0E5858] hover:bg-white'}`}
                            >
                                <Layout size={14} /> Content Architect
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => { setActiveTab('registry'); router.push('?tab=registry'); }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'registry' ? 'bg-[#0E5858] text-white shadow-lg shadow-[#0E5858]/20' : 'text-gray-400 hover:text-[#0E5858] hover:bg-white'}`}
                    >
                        <Users size={14} /> {isTrainerBuddyRole ? 'My Counsellors' : 'Master Registry'}
                    </button>
                </div>
            )}

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
                                    <div className="text-center mb-8 relative">
                                        <div className="w-24 h-24 bg-[#FAFCEE] rounded-full flex items-center justify-center text-[#0E5858] text-4xl font-black mx-auto mb-6 shadow-inner border border-[#0E5858]/5">
                                            {selectedProfile.full_name?.[0]}
                                        </div>
                                        <h3 className="text-3xl font-serif text-[#0E5858] mb-1">{selectedProfile.full_name}</h3>
                                        <p className="text-[10px] font-bold text-[#00B6C1] uppercase tracking-[0.2em] mb-6">{selectedProfile.email}</p>

                                        <div className="flex justify-center gap-4">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    {selectedProfile.phone && !editingPhone && (
                                                        <a
                                                            href={`https://wa.me/${selectedProfile.phone.replace(/[^0-9]/g, '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-green-500/20"
                                                            title="WhatsApp"
                                                        >
                                                            <Phone size={18} />
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            setEmailForm({
                                                                to: selectedProfile.email,
                                                                subject: "Updates from BN Academy Admin",
                                                                message: `Hi ${selectedProfile.full_name},\n\n`,
                                                                userName: selectedProfile.full_name
                                                            });
                                                            setIsEmailModalOpen(true);
                                                        }}
                                                        className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-blue-500/20"
                                                        title="Compose Email"
                                                    >
                                                        <Mail size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setTempPhone(selectedProfile.phone || "");
                                                            setEditingPhone(!editingPhone);
                                                        }}
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg border ${editingPhone ? 'bg-red-500 text-white border-red-500' : 'bg-white text-[#0E5858] border-[#0E5858]/10'}`}
                                                        title="Edit Phone"
                                                    >
                                                        {editingPhone ? <X size={16} /> : <Pencil size={16} />}
                                                    </button>
                                                </div>

                                                {editingPhone && (
                                                    <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
                                                        <input
                                                            type="text"
                                                            value={tempPhone}
                                                            onChange={e => setTempPhone(e.target.value)}
                                                            placeholder="+91 00000 00000"
                                                            className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-xs font-bold outline-none w-40 text-center"
                                                        />
                                                        <button
                                                            onClick={handleUpdateUserPhone}
                                                            disabled={updatingPhone}
                                                            className="w-8 h-8 rounded-lg bg-[#00B6C1] text-white flex items-center justify-center hover:bg-[#0E5858] transition-all disabled:opacity-50"
                                                        >
                                                            {updatingPhone ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={14} />}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 border-t border-gray-50 pt-8">
                                        <div className="bg-[#FAFCEE] p-4 rounded-2xl border border-[#0E5858]/5 text-center mb-4">
                                            {(() => {
                                                const validTopicCodes = new Set(syllabusData.filter(m => m.id !== 'resource-bank').flatMap(m => m.topics.map(t => t.code)));

                                                // Virtual Progress Collection: Explicit + Implicit (via assessments)
                                                const userProgressTopics = new Set(progress.filter(pr => pr.user_id === selectedProfile.id).map(pr => pr.topic_code));
                                                const userAssessments = assessments.filter(a => a.user_id === selectedProfile.id);
                                                const passedModuleIds = new Set(userAssessments.filter(a => a.topic_code.startsWith('MODULE_')).map(a => a.topic_code.replace('MODULE_', '').toLowerCase()));

                                                // Backfill topics for passed modules
                                                syllabusData.forEach(m => {
                                                    if (passedModuleIds.has(m.id.toLowerCase())) {
                                                        m.topics.forEach(t => userProgressTopics.add(t.code));
                                                    }
                                                });

                                                const userProgressCount = Array.from(userProgressTopics).filter(code => validTopicCodes.has(code)).length;
                                                const userActivity = activity.filter(a => a.user_id === selectedProfile.id);
                                                const globalPercent = Math.min(100, Math.round((userProgressCount / (TOTAL_SYLLABUS_TOPICS || 1)) * 100));
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
                                                {!isTrainerBuddyRole && (
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
                                                )}
                                            </div>
                                            {editingBuddy && !isTrainerBuddyRole ? (
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

                                        <div className="pt-4 mt-2">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const { data: { session } } = await supabase.auth.getSession();
                                                        if (!session) return;

                                                        // Apply the template first so the handler knows what to send
                                                        handleApplyTemplate('buddy_report');

                                                        // Small delay to ensure state updates (or just pass the parameters directly)
                                                        // For simplicity and reliability in one-shot, we'll call the API with the specific template logic
                                                        const res = await fetch('/api/admin/notifications', {
                                                            method: 'POST',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'Authorization': `Bearer ${session.access_token}`
                                                            },
                                                            body: JSON.stringify({
                                                                userId: selectedProfile.id,
                                                                title: `Activity Report: ${selectedProfile.full_name}`,
                                                                message: `Here is the requested activity and performance report for ${selectedProfile.full_name}.`,
                                                                type: 'info',
                                                                channel: 'email',
                                                                template: 'direct_report'
                                                            })
                                                        });

                                                        if (res.ok) {
                                                            setNotificationSuccess("Full report shared with Buddy!");
                                                            setTimeout(() => setNotificationSuccess(""), 3000);
                                                        } else {
                                                            throw new Error("Failed to share report");
                                                        }
                                                    } catch (e: any) {
                                                        alert(e.message);
                                                    }
                                                }}
                                                className="w-full py-4 bg-[#B8E218] text-[#0E5858] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-[#B8E218]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 border-b-4 border-[#9CBF14]"
                                            >
                                                <Share2 size={16} /> Share Activity Report
                                            </button>
                                            <p className="text-[7px] text-gray-400 font-bold uppercase tracking-widest mt-3 text-center">Sends full performance trail to Buddy</p>
                                        </div>

                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Access Level</span>
                                            <div className="flex items-center gap-2">
                                                {editingRole && !isTrainerBuddyRole ? (
                                                    <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                                                        <select
                                                            value={tempRole}
                                                            onChange={e => setTempRole(e.target.value)}
                                                            className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none text-[#0E5858]"
                                                        >
                                                            <option value="counsellor">Counsellor</option>
                                                            <option value="trainer buddy">Trainer Buddy</option>
                                                            <option value="product automation">Product Automation</option>
                                                            <option value="tech dev">Tech Dev</option>
                                                            <option value="business devp">Business Devp</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                        <button
                                                            onClick={handleUpdateUserRole}
                                                            disabled={updatingRole}
                                                            className="w-8 h-8 rounded-lg bg-[#00B6C1] text-white flex items-center justify-center hover:bg-[#0E5858] transition-all disabled:opacity-50 shadow-sm"
                                                        >
                                                            {updatingRole ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={14} />}
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingRole(false)}
                                                            className="w-8 h-8 rounded-lg bg-white border border-gray-100 text-gray-400 flex items-center justify-center hover:text-red-500 transition-all shadow-sm"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="badge-teal text-[8px] uppercase">{selectedProfile.role}</span>
                                                        {!isTrainerBuddyRole && (
                                                            <button
                                                                onClick={() => {
                                                                    setTempRole(selectedProfile.role);
                                                                    setEditingRole(true);
                                                                }}
                                                                className="text-gray-300 hover:text-[#00B6C1] transition-colors"
                                                                title="Change Role"
                                                            >
                                                                <Pencil size={10} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Admin-only: Danger Zone — hidden from Trainer Buddies */}
                                        {!isTrainerBuddyRole && (
                                            <>
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
                                            </>
                                        )}
                                    </div>
                                </div>



                                {/* Notification dispatch - admin only */}
                                {!isTrainerBuddyRole && (
                                    <div className="bg-[#0E5858] text-white rounded-[3rem] p-10 shadow-xl space-y-8">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-[#00B6C1]">Dispatch Notification</h4>
                                            <Bell size={20} className="text-[#00B6C1]" />
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {NOTIFICATION_TEMPLATES.map(temp => (
                                                <button
                                                    key={temp.id}
                                                    onClick={() => handleApplyTemplate(temp.id)}
                                                    className={`px-3 py-1.5 border rounded-lg text-[8px] font-black uppercase tracking-widest transition-all shadow-sm ${notificationForm.template === temp.id ? 'bg-[#00B6C1] text-[#0E5858] border-[#00B6C1]' : 'bg-white/10 border-white/10 text-white hover:bg-white/20'}`}
                                                >
                                                    {temp.label}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                                            <span className="text-[7px] font-black uppercase text-white/40">Active Protocol:</span>
                                            <span className="text-[9px] font-bold text-[#00B6C1] uppercase tracking-[0.2em]">{notificationForm.template}</span>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-2 block">Notification Title</label>
                                                <input
                                                    type="text"
                                                    value={notificationForm.title}
                                                    onChange={e => setNotificationForm({ ...notificationForm, title: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-[#00B6C1]/30 transition-all text-white"
                                                    placeholder="Enter title..."
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-2 block">Message Body</label>
                                                <textarea
                                                    value={notificationForm.message}
                                                    onChange={e => setNotificationForm({ ...notificationForm, message: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-[#00B6C1]/30 transition-all text-white h-32 resize-none"
                                                    placeholder="Type your message here..."
                                                />
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {(['info', 'warning', 'alert'] as const).map(t => (
                                                    <button
                                                        key={t}
                                                        type="button"
                                                        onClick={() => setNotificationForm({ ...notificationForm, type: t })}
                                                        className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg border transition-all ${notificationForm.type === t
                                                            ? t === 'alert' ? 'bg-red-500 text-white border-red-500 shadow-md' : t === 'warning' ? 'bg-orange-400 text-white border-orange-400 shadow-md' : 'bg-[#00B6C1] text-white border-[#00B6C1] shadow-md'
                                                            : 'bg-white/5 text-white/40 border-white/10'
                                                            }`}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>

                                            {notificationSuccess && (
                                                <p className="text-[8px] font-black uppercase tracking-widest text-green-400 text-center animate-pulse">{notificationSuccess}</p>
                                            )}

                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => handleSendNotification(selectedProfile.id, 'dashboard')}
                                                    disabled={sendingNotification || !notificationForm.title || !notificationForm.message}
                                                    className="py-3.5 bg-[#00B6C1] text-[#0E5858] rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#00B6C1]/20 disabled:opacity-40"
                                                >
                                                    {sendingNotification ? <Loader2 size={14} className="animate-spin" /> : <><Bell size={14} /> Dashboard</>}
                                                </button>
                                                <button
                                                    onClick={() => handleSendNotification(selectedProfile.id, 'email')}
                                                    disabled={sendingNotification || !notificationForm.title || !notificationForm.message}
                                                    className="py-3.5 bg-blue-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-40"
                                                >
                                                    {sendingNotification ? <Loader2 size={14} className="animate-spin" /> : <><Mail size={14} /> Email</>}
                                                </button>
                                                <button
                                                    onClick={() => handleSendNotification(selectedProfile.id, 'whatsapp')}
                                                    disabled={sendingNotification || !notificationForm.title || !notificationForm.message}
                                                    className="py-3.5 bg-green-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 disabled:opacity-40"
                                                >
                                                    {sendingNotification ? <Loader2 size={14} className="animate-spin" /> : <><Phone size={14} /> WhatsApp</>}
                                                </button>
                                                <button
                                                    onClick={() => handleSendNotification(selectedProfile.id, 'all')}
                                                    disabled={sendingNotification || !notificationForm.title || !notificationForm.message}
                                                    className="py-3.5 bg-white/10 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2 border border-white/10 disabled:opacity-40"
                                                >
                                                    {sendingNotification ? <Loader2 size={14} className="animate-spin" /> : <><Sparkles size={14} /> Send All</>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Main Detail Area */}
                            <div className="flex-1 space-y-10">
                                {/* Activity Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-[#0E5858]/5 h-full">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-[#0E5858]/40 mb-6 flex items-center gap-3">
                                            <Monitor size={16} className="text-[#00B6C1]" /> Recent Activity Trail
                                        </h4>
                                        <div className="space-y-6 relative pl-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {(() => {
                                                const userAssessments = assessments.filter(a => a.user_id === selectedProfile.id);
                                                const passedModuleIds = new Set(userAssessments.filter(a => a.topic_code.startsWith('MODULE_')).map(a => a.topic_code.replace('MODULE_', '').toLowerCase()));
                                                const userActivity = activity.filter(a => a.user_id === selectedProfile.id);

                                                if (userActivity.length === 0) return (
                                                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                                        <Activity size={40} className="mb-4" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest">No activity recorded yet</p>
                                                    </div>
                                                );

                                                return userActivity.slice(0, 50).map((log, i) => {
                                                    const isLast = i === userActivity.length - 1;
                                                    const getIcon = (type: string) => {
                                                        if (type.includes('module')) return <Award size={14} className="text-yellow-500" />;
                                                        if (type.includes('quiz')) return <Brain size={14} className="text-purple-500" />;
                                                        if (type.includes('assignment')) return <ClipboardList size={14} className="text-blue-500" />;
                                                        if (type.includes('segment')) return <CheckCircle2 size={14} className="text-green-500" />;
                                                        if (type.includes('watch_video')) return <Play size={14} className="text-[#00B6C1]" />;
                                                        if (type.includes('click_link')) return <ExternalLink size={14} className="text-[#0E5858]" />;
                                                        return <Clock size={14} className="text-gray-400" />;
                                                    };

                                                    return (
                                                        <div key={log.id} className="relative pb-6 group">
                                                            {!isLast && <div className="absolute left-[-13px] top-4 bottom-0 w-[1px] bg-gray-100 group-hover:bg-[#00B6C1]/20 transition-colors" />}
                                                            <div className="absolute left-[-18.5px] top-1 w-6 h-6 rounded-lg bg-white border border-gray-100 flex items-center justify-center shadow-sm z-10">
                                                                {getIcon(log.activity_type)}
                                                            </div>
                                                            <div className="pl-4">
                                                                <p className="text-[10px] font-black text-[#0E5858] uppercase tracking-wider">{log.activity_type.replace('_', ' ')}</p>
                                                                <p className="text-[11px] font-medium text-gray-500 leading-tight">{log.content_title || log.topic_code || 'System Event'}</p>
                                                                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                                                    {new Date(log.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>

                                    <div className="bg-white p-8 rounded-[2.5rem] border border-[#0E5858]/5 h-full">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-[#0E5858]/40 mb-6 flex items-center gap-3">
                                            <Brain size={16} className="text-[#00B6C1]" /> Assessment History
                                        </h4>
                                        <div className="space-y-3">
                                            {assessments.filter(a => a.user_id === selectedProfile.id).map(quiz => (
                                                <div key={quiz.id} className="w-full p-3 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-baseline gap-2 mb-1">
                                                            <p className="text-[10px] font-bold text-[#0E5858] uppercase tracking-widest truncate">{quiz.topic_code}</p>
                                                            <p className="text-[7px] text-gray-400 font-black uppercase tracking-widest">{new Date(quiz.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <button
                                                                onClick={() => setSelectedQuiz(quiz)}
                                                                className="px-2 py-1 bg-white border border-[#00B6C1]/20 rounded-lg text-[8px] font-black text-[#00B6C1] uppercase tracking-widest hover:bg-[#00B6C1] hover:text-white transition-all"
                                                            >
                                                                Review
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleGiveRetest(quiz.id, e)}
                                                                className="px-2 py-1 bg-white border border-red-200 rounded-lg text-[8px] font-black text-red-500 uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                                                            >
                                                                Retest
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEmailForm({
                                                                        to: selectedProfile.email,
                                                                        subject: `Regarding your recent assessment: ${quiz.topic_code}`,
                                                                        message: `Hi ${selectedProfile.full_name},\n\nI just reviewed your assessment for ${quiz.topic_code}...`,
                                                                        userName: selectedProfile.full_name
                                                                    });
                                                                    setIsEmailModalOpen(true);
                                                                }}
                                                                className="px-2 py-1 bg-[#0E5858] text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-[#00B6C1] transition-all flex items-center gap-1"
                                                            >
                                                                <Mail size={8} /> Email
                                                            </button>
                                                            {selectedProfile.phone && (
                                                                <a
                                                                    href={`https://wa.me/${selectedProfile.phone.replace(/[^0-9]/g, '')}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={e => e.stopPropagation()}
                                                                    className="px-2 py-1 bg-green-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-green-600 transition-all flex items-center gap-1"
                                                                >
                                                                    <Phone size={8} /> WhatsApp
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-lg font-serif text-[#0E5858] leading-none mb-0.5">{Math.round((quiz.score / (quiz.total_questions || 5)) * 100)}%</p>
                                                        <p className="text-[7px] font-bold text-[#00B6C1] uppercase tracking-widest">Score</p>
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
                                        {(() => {
                                            const userAssessments = assessments.filter(a => a.user_id === selectedProfile.id);
                                            const passedModuleIds = new Set(userAssessments.filter(a => a.topic_code.startsWith('MODULE_')).map(a => a.topic_code.replace('MODULE_', '').toLowerCase()));

                                            return syllabusData.filter(m => m.id !== 'resource-bank').map(module => {
                                                const dynamicForModule = dynamicContent.filter(d => d.module_id === module.id);
                                                const rawModuleProgress = progress.filter(p => p.user_id === selectedProfile.id && p.module_id === module.id);

                                                const isModulePassed = passedModuleIds.has(module.id.toLowerCase());
                                                const totalTopics = module.topics.length + dynamicForModule.length;

                                                const explicitTopicsCount = rawModuleProgress.length;
                                                const percent = isModulePassed ? 100 : (totalTopics > 0 ? (explicitTopicsCount / totalTopics) * 100 : 0);

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
                                                                const isDone = isModulePassed || progress.some(p => p.user_id === selectedProfile.id && p.topic_code === topic.code);
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
                                            });
                                        })()}
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
                                                <p className="text-xs text-[#0E5858] leading-relaxed italic font-medium">"{audit.feedback || (audit.summary_text ? "Peer Audit Matrix Logged: Data synchronized to repository." : "No verbal feedback recorded.")}"</p>
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
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-[#0E5858]/50 uppercase tracking-[0.2em] ml-3">Account Role</label>
                                    <select
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-6 text-sm font-semibold focus:ring-2 focus:ring-[#00B6C1]/10 outline-none"
                                        required
                                    >
                                        <option value="counsellor">Counsellor</option>
                                        <option value="trainer buddy">Trainer Buddy</option>
                                        <option value="product automation">Product Automation</option>
                                        <option value="tech dev">Tech Dev</option>
                                        <option value="business devp">Business Devp</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-[#0E5858]/50 uppercase tracking-[0.2em] ml-3">Phone Number</label>
                                    <input
                                        type="text"
                                        value={newUser.phone}
                                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                        placeholder="+91 00000 00000"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-6 text-sm font-semibold focus:ring-2 focus:ring-[#00B6C1]/10 outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-4 p-6 bg-gray-50/50 rounded-2xl border border-gray-100 lg:col-span-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] font-black text-[#0E5858]/40 uppercase tracking-[0.2em]">Training Buddy Identities</p>
                                        <button
                                            type="button"
                                            onClick={() => setNewUser(prev => ({ ...prev, buddies: [...prev.buddies, { name: "", email: "", phone: "" }] }))}
                                            className="px-3 py-1 bg-[#00B6C1]/10 text-[#00B6C1] rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-[#00B6C1] hover:text-white transition-all"
                                        >
                                            + Add Another Buddy
                                        </button>
                                    </div>
                                    <div className="space-y-6">
                                        {newUser.buddies.map((buddy, idx) => (
                                            <div key={idx} className="p-6 bg-white rounded-xl border border-gray-100 relative group">
                                                {newUser.buddies.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewUser(prev => ({ ...prev, buddies: prev.buddies.filter((_, i) => i !== idx) }))}
                                                        className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                )}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Buddy Name</label>
                                                        <input
                                                            type="text"
                                                            value={buddy.name}
                                                            onChange={(e) => {
                                                                const newList = [...newUser.buddies];
                                                                newList[idx].name = e.target.value;
                                                                setNewUser({ ...newUser, buddies: newList });
                                                            }}
                                                            placeholder="e.g. Anjali M"
                                                            className="w-full bg-gray-50 border-none rounded-lg py-2 px-4 text-xs font-semibold outline-none"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Buddy Email</label>
                                                        <input
                                                            type="email"
                                                            value={buddy.email}
                                                            onChange={(e) => {
                                                                const newList = [...newUser.buddies];
                                                                newList[idx].email = e.target.value;
                                                                setNewUser({ ...newUser, buddies: newList });
                                                            }}
                                                            placeholder="buddy@balancenutrition.in"
                                                            className="w-full bg-gray-50 border-none rounded-lg py-2 px-4 text-xs font-semibold outline-none"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Buddy Phone</label>
                                                        <input
                                                            type="text"
                                                            value={buddy.phone}
                                                            onChange={(e) => {
                                                                const newList = [...newUser.buddies];
                                                                newList[idx].phone = e.target.value;
                                                                setNewUser({ ...newUser, buddies: newList });
                                                            }}
                                                            placeholder="+91 00000 00000"
                                                            className="w-full bg-gray-50 border-none rounded-lg py-2 px-4 text-xs font-semibold outline-none"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
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

                            {lastCreatedUser && (
                                <div className="bg-[#FAFCEE] p-6 rounded-2xl border border-[#00B6C1]/20 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                                            <CheckCircle size={14} />
                                        </div>
                                        <p className="text-[10px] font-black text-[#0E5858] uppercase tracking-widest">Account Successfully Provisioned</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Login Email</p>
                                            <p className="text-xs font-bold text-[#0E5858] break-all">{lastCreatedUser.email}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Temporary Password</p>
                                            <p className="text-xs font-bold text-orange-600 font-mono tracking-widest">{lastCreatedUser.password}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Mapped Phone</p>
                                            <p className="text-xs font-bold text-green-600">{lastCreatedUser.phone || 'None'}</p>
                                        </div>
                                    </div>
                                    <p className="text-[8px] text-[#00B6C1] font-black uppercase tracking-widest mt-4 animate-pulse">Master Registry Synchronized</p>
                                </div>
                            )}

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
                            <form onSubmit={handleUpdateContent} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-[#0E5858]/5 space-y-8">
                                <header className="mb-4">
                                    <h3 className="text-xl font-serif text-[#0E5858]">Synchronize Masterclass Node</h3>
                                    <p className="text-[10px] text-gray-400 font-medium mt-1">Deploy dynamic segments directly to the academy frontend.</p>
                                </header>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-[#0E5858]/50 uppercase tracking-[0.2em] ml-3">Target Module</label>
                                        <select
                                            value={contentForm.moduleId}
                                            onChange={(e) => setContentForm({ ...contentForm, moduleId: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-6 text-sm font-semibold focus:ring-2 focus:ring-[#00B6C1]/10 outline-none"
                                            required
                                        >
                                            <option value="">Select Target Module</option>
                                            {syllabusData.map(m => (
                                                <option key={m.id} value={m.id}>{m.title}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-[#0E5858]/50 uppercase tracking-[0.2em] ml-3">Topic / Segment Title</label>
                                        <input
                                            type="text"
                                            value={contentForm.topicTitle}
                                            onChange={(e) => setContentForm({ ...contentForm, topicTitle: e.target.value })}
                                            placeholder="e.g. Deep Dive into PCOS Protocols"
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-6 text-sm font-semibold focus:ring-2 focus:ring-[#00B6C1]/10 outline-none"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-[#0E5858]/50 uppercase tracking-[0.2em] ml-3">Resource Type</label>
                                            <select
                                                value={contentForm.contentType}
                                                onChange={(e) => setContentForm({ ...contentForm, contentType: e.target.value as any })}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-6 text-sm font-semibold focus:ring-2 focus:ring-[#00B6C1]/10 outline-none"
                                            >
                                                <option value="video">Video Session</option>
                                                <option value="pdf">Protocol (PDF)</option>
                                                <option value="link">External Resource</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-[#0E5858]/50 uppercase tracking-[0.2em] ml-3">Resource Link</label>
                                            <input
                                                type="url"
                                                value={contentForm.contentLink}
                                                onChange={(e) => setContentForm({ ...contentForm, contentLink: e.target.value })}
                                                placeholder="https://..."
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-6 text-sm font-semibold focus:ring-2 focus:ring-[#00B6C1]/10 outline-none"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {contentError && <p className="text-red-500 text-[10px] font-bold text-center">{contentError}</p>}
                                {contentSuccess && <p className="text-green-500 text-[10px] font-bold text-center">{contentSuccess}</p>}

                                <button
                                    type="submit"
                                    disabled={uploadingContent}
                                    className="w-full py-5 bg-[#0E5858] text-white rounded-xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-[#00B6C1] transition-all"
                                >
                                    {uploadingContent ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Synchronize Architecture"}
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
                                                <button
                                                    onClick={() => setContentForm({
                                                        id: content.id,
                                                        topicCode: content.topic_code,
                                                        moduleId: content.module_id,
                                                        topicTitle: content.title,
                                                        contentType: content.content_type || 'video',
                                                        contentLink: content.content
                                                    })}
                                                    className="p-2 text-gray-300 hover:text-[#00B6C1] transition-all"
                                                >
                                                    <Edit3 size={12} />
                                                </button>
                                                <button onClick={() => handleDeleteContent(content.id)} className="p-2 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={12} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Quiz Protocol Editor */}
                            <div className="bg-white p-10 rounded-[3rem] border border-[#0E5858]/5 lg:col-span-2 shadow-sm">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                                    <div>
                                        <p className="text-[10px] font-black text-[#00B6C1] uppercase tracking-[0.3em] mb-2">Protocol Architecture</p>
                                        <h3 className="text-3xl font-serif text-[#0E5858]">Quiz Protocol Editor</h3>
                                        <p className="text-xs text-gray-400 font-medium mt-1">Override AI-generated assessments with manual academy questions.</p>
                                    </div>
                                    <div className="flex flex-col gap-2 w-full md:w-auto">
                                        <select
                                            value={selectedQuizTopic}
                                            onChange={(e) => {
                                                setSelectedQuizTopic(e.target.value);
                                                handleFetchManualQuiz(e.target.value);
                                            }}
                                            className="bg-gray-50 border border-[#0E5858]/10 rounded-xl py-3 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-[#00B6C1]/10 min-w-[280px]"
                                        >
                                            <option value="">Select Module to Edit Quiz</option>
                                            {syllabusData.filter(m => m.topics.length > 0).map(m => (
                                                <option key={m.id} value={`MODULE_${m.id}`}>{m.title.split(':')[0]} Final Quiz</option>
                                            ))}
                                        </select>
                                        {isFetchingQuiz && <div className="flex items-center gap-2 px-4 py-1 animate-pulse"><Loader2 size={12} className="animate-spin text-[#00B6C1]" /><span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Loading Protocol...</span></div>}
                                    </div>
                                </div>

                                {selectedQuizTopic ? (
                                    <div className="space-y-8">
                                        <div className="space-y-6">
                                            {/* AI Suggestion Bar */}
                                            <div className="p-8 bg-[#00B6C1]/5 rounded-[2.5rem] border border-[#00B6C1]/10 flex flex-col md:flex-row items-center gap-6">
                                                <div className="flex-1 space-y-2 w-full">
                                                    <label className="text-[10px] font-black text-[#00B6C1] uppercase tracking-widest ml-4">Custom AI Guidance / Manual Context</label>
                                                    <input
                                                        type="text"
                                                        value={customAIPrompt}
                                                        onChange={(e) => setCustomAIPrompt(e.target.value)}
                                                        placeholder="e.g. Focus on PCOS symptoms, include 2 questions on BMI and 1 on diet..."
                                                        className="w-full bg-white border border-[#00B6C1]/10 rounded-2xl py-4 px-6 text-sm font-medium outline-none shadow-sm focus:ring-2 focus:ring-[#00B6C1]/20"
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleGenerateAISuggestions}
                                                    disabled={isGeneratingSuggestions}
                                                    className="px-10 py-4 bg-[#00B6C1] text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-[#0E5858] transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#00B6C1]/20 min-w-[240px]"
                                                >
                                                    {isGeneratingSuggestions ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Sparkles size={16} />
                                                            {manualQuizQuestions.length > 0 ? "Refine with AI" : "Suggest with AI"}
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            {manualQuizQuestions.map((q, qIdx) => (

                                                <div key={qIdx} className="p-8 bg-[#FAFCEE]/50 rounded-[2.5rem] border border-[#0E5858]/5 relative group animate-in slide-in-from-right-4">
                                                    <button
                                                        onClick={() => setManualQuizQuestions(prev => prev.filter((_, i) => i !== qIdx))}
                                                        className="absolute top-6 right-6 p-2 text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <XCircle size={20} />
                                                    </button>
                                                    <div className="grid grid-cols-1 gap-6">
                                                        <div className="space-y-2">
                                                            <label className="text-[9px] font-black text-[#00B6C1] uppercase tracking-widest ml-4">Academy Question {qIdx + 1}</label>
                                                            <textarea
                                                                value={q.question}
                                                                onChange={e => {
                                                                    const newList = [...manualQuizQuestions];
                                                                    newList[qIdx].question = e.target.value;
                                                                    setManualQuizQuestions(newList);
                                                                }}
                                                                placeholder="Enter high-stakes assessment question..."
                                                                className="w-full bg-white border border-gray-100 rounded-2xl py-4 px-6 text-sm font-medium outline-none h-24 resize-none shadow-sm"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-4 mb-4">
                                                            <button
                                                                onClick={() => {
                                                                    const newList = [...manualQuizQuestions];
                                                                    newList[qIdx].type = 'mcq';
                                                                    setManualQuizQuestions(newList);
                                                                }}
                                                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${q.type === 'text' ? 'bg-gray-100 text-gray-400' : 'bg-[#00B6C1] text-white shadow-lg shadow-[#00B6C1]/20'}`}
                                                            >
                                                                Multiple Choice
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const newList = [...manualQuizQuestions];
                                                                    newList[qIdx].type = 'text';
                                                                    setManualQuizQuestions(newList);
                                                                }}
                                                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${q.type === 'text' ? 'bg-[#00B6C1] text-white shadow-lg shadow-[#00B6C1]/20' : 'bg-gray-100 text-gray-400'}`}
                                                            >
                                                                Text Response
                                                            </button>
                                                        </div>

                                                        {q.type === 'text' ? (
                                                            <div className="space-y-2">
                                                                <label className="text-[9px] font-black text-[#00B6C1] uppercase tracking-widest ml-4">Correct Exact Answer</label>
                                                                <input
                                                                    type="text"
                                                                    value={q.correctAnswer}
                                                                    onChange={e => {
                                                                        const newList = [...manualQuizQuestions];
                                                                        newList[qIdx].correctAnswer = e.target.value;
                                                                        setManualQuizQuestions(newList);
                                                                    }}
                                                                    placeholder="Enter the exact answer for validation..."
                                                                    className="w-full bg-white border border-gray-100 rounded-xl py-4 px-6 text-sm font-medium outline-none shadow-sm"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {q.options.map((opt: string, optIdx: number) => (
                                                                    <div key={optIdx} className="relative">
                                                                        <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${q.correctAnswer === opt && opt !== "" ? 'bg-[#00B6C1] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                                            {String.fromCharCode(65 + optIdx)}
                                                                        </div>
                                                                        <input
                                                                            type="text"
                                                                            value={opt}
                                                                            onChange={e => {
                                                                                const oldVal = opt;
                                                                                const newVal = e.target.value;
                                                                                const newList = [...manualQuizQuestions];
                                                                                newList[qIdx].options[optIdx] = newVal;
                                                                                if (newList[qIdx].correctAnswer === oldVal) {
                                                                                    newList[qIdx].correctAnswer = newVal;
                                                                                }
                                                                                setManualQuizQuestions(newList);
                                                                            }}
                                                                            placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                                                            className="w-full bg-white border border-gray-100 rounded-xl py-3 pl-14 pr-4 text-xs font-semibold outline-none"
                                                                        />
                                                                        <button
                                                                            onClick={() => {
                                                                                const newList = [...manualQuizQuestions];
                                                                                newList[qIdx].correctAnswer = opt;
                                                                                setManualQuizQuestions(newList);
                                                                            }}
                                                                            className={`absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase tracking-widest transition-all ${q.correctAnswer === opt && opt !== "" ? 'text-[#00B6C1]' : 'text-gray-300 hover:text-[#0E5858]'}`}
                                                                        >
                                                                            {q.correctAnswer === opt && opt !== "" ? 'Correct' : 'Set Correct'}
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                    </div>
                                                </div>
                                            ))}

                                            <button
                                                onClick={() => setManualQuizQuestions(prev => [...prev, { type: 'mcq', question: "", options: ["", "", "", ""], correctAnswer: "", justification: "" }])}
                                                className="w-full py-6 border-2 border-dashed border-gray-100 rounded-[2.5rem] text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] hover:border-[#00B6C1] hover:text-[#00B6C1] transition-all bg-gray-50/30 flex items-center justify-center gap-3"
                                            >
                                                <Plus size={18} /> Add Academy Assessment Question
                                            </button>
                                        </div>

                                        <div className="flex flex-col md:flex-row gap-4 pt-10 border-t border-gray-50">
                                            <button
                                                onClick={handleSaveManualQuiz}
                                                disabled={isSavingQuiz}
                                                className="flex-1 py-5 bg-[#0E5858] text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-[#00B6C1] transition-all shadow-xl shadow-[#0E5858]/10 flex items-center justify-center gap-2"
                                            >
                                                {isSavingQuiz ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle size={18} /> Synchronize Protocols</>}
                                            </button>
                                            <button
                                                onClick={handleDeleteManualQuiz}
                                                disabled={isSavingQuiz}
                                                className="px-8 py-5 border border-red-100 text-red-400 rounded-[1.5rem] font-black text-[9px] uppercase tracking-[0.2em] hover:bg-red-50 transition-all"
                                            >
                                                Remove Manual Override
                                            </button>
                                        </div>
                                        {quizSuccess && <p className="text-green-500 font-bold text-[10px] uppercase tracking-widest text-center">{quizSuccess}</p>}
                                        {quizError && <p className="text-red-500 font-bold text-[10px] uppercase tracking-widest text-center">{quizError}</p>}
                                    </div>
                                ) : (
                                    <div className="py-20 flex flex-col items-center justify-center text-center opacity-20">
                                        <BrainCircuit size={80} className="text-[#0E5858] mb-6" />
                                        <p className="text-sm font-serif text-[#0E5858] max-w-xs">Select a syllabus topic above to begin custom protocol mapping.</p>
                                    </div>
                                )}
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
                            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                                <button
                                    onClick={handleCleanupAccounts}
                                    disabled={isCleaning}
                                    className={`flex items-center gap-2 px-6 py-4 rounded-2xl border ${isCleaning ? 'bg-gray-100 text-gray-400' : 'bg-white border-red-100 text-red-500 hover:bg-red-50'} transition-all text-[10px] font-black uppercase tracking-widest shadow-sm`}
                                >
                                    {isCleaning ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                    {isCleaning ? "Performing Cleanup..." : "Cleanup Registry"}
                                </button>
                                <button
                                    onClick={handleGenerateReport}
                                    disabled={isGeneratingReport}
                                    className={`flex items-center gap-2 px-6 py-4 rounded-2xl border ${isGeneratingReport ? 'bg-gray-100 text-gray-400' : 'bg-[#0E5858] border-[#0E5858] text-white hover:bg-[#00B6C1]'} transition-all text-[10px] font-black uppercase tracking-widest shadow-md`}
                                >
                                    {isGeneratingReport ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                                    {isGeneratingReport ? "Generating..." : "Daily Progress Report"}
                                </button>
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
                            </div>
                        </header>

                        {(cleanupSuccess || cleanupError) && (
                            <div className={`p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-center ${cleanupSuccess ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                {cleanupSuccess || cleanupError}
                            </div>
                        )}

                        {reportData && (
                            <div className="bg-[#FAFCEE] p-8 rounded-[2.5rem] border border-[#0E5858]/10 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-serif text-[#0E5858]">Daily Progress Report: {reportData.date}</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#00B6C1] mt-1">Status: Ready to be emailed to {reportData.recipient}</p>
                                    </div>
                                    <button
                                        onClick={() => setReportData(null)}
                                        className="p-2 hover:bg-white rounded-full transition-colors text-gray-400"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {reportData.report.map((user: any, idx: number) => (
                                        <div key={idx} className="bg-white p-5 rounded-2xl border border-[#0E5858]/5">
                                            <p className="text-sm font-serif text-[#0E5858] mb-1 font-bold">{user.name}</p>
                                            <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-4">{user.email}</p>

                                            <div className="flex flex-col gap-2">
                                                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-[#0E5858]">
                                                    <span className="text-[#0E5858]/40">Today's Tests</span>
                                                    <span>{user.testsTaken}</span>
                                                </div>
                                                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-[#00B6C1]">
                                                    <span className="text-[#00B6C1]/50">Modules Finished</span>
                                                    <span>{user.modulesCompletedToday}</span>
                                                </div>
                                                <div className="pt-2 mt-1 border-t border-gray-50 flex flex-col gap-1">
                                                    <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Longest Active Session</p>
                                                    <p className="text-[10px] font-bold text-[#0E5858] leading-tight flex justify-between items-center">
                                                        <span className="truncate max-w-[120px]">{user.longestTopic}</span>
                                                        <span className="text-orange-500 shrink-0">{user.longestTime}</span>
                                                    </p>
                                                </div>
                                                <div className="pt-2 border-t border-gray-50 flex justify-between items-end mt-1">
                                                    <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Global Progress</span>
                                                    <span className="text-sm font-serif text-[#0E5858] font-bold">{user.globalProgress}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => {
                                        const text = reportData.report.map((u: any) =>
                                            `• ${u.name}: ${u.testsTaken} Tests today. Modules Finished today: ${u.modulesCompletedToday}. Longest Session: ${u.longestTopic} (${u.longestTime}). Overall Progress: ${u.globalProgress}%`
                                        ).join('\n');
                                        navigator.clipboard.writeText(`DAILY ACADEMY LOG - ${reportData.date}\n\n${text}`);
                                        alert("Report synchronized to clipboard!");
                                    }}
                                    className="mt-6 w-full py-4 bg-white border border-[#0E5858]/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-[#0E5858] hover:bg-gray-50 transition-all"
                                >
                                    Copy Synchronized Report
                                </button>
                            </div>
                        )}

                        <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-[#0E5858]/5">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-[#0E5858]/5 text-[9px] font-black uppercase tracking-[0.2em] text-[#0E5858]/50">
                                            <th className="px-8 py-6">Counsellor</th>
                                            <th className="px-6 text-center">Credentials / Contact</th>
                                            <th className="px-6">Joined / Active</th>
                                            <th className="px-6 text-center">Avg Score</th>
                                            <th className="px-6 text-center">Progress %</th>
                                            <th className="px-6">Role</th>
                                            <th className="px-8 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredRegistry.map(p => {
                                            const userAssessments = assessments.filter(a => a.user_id === p.id);
                                            const userPassedModules = new Set(userAssessments.filter(a => a.topic_code.startsWith('MODULE_')).map(a => a.topic_code.replace('MODULE_', '').toLowerCase()));

                                            // Calculate explicit completions from mentor_progress
                                            const userProgress = progress.filter(pr => pr.user_id === p.id);
                                            const explicitTopicCodes = new Set(userProgress.map(pr => pr.topic_code));

                                            // Add implicit completions from passed modules
                                            syllabusData.forEach(m => {
                                                if (userPassedModules.has(m.id.toLowerCase())) {
                                                    m.topics.forEach(t => explicitTopicCodes.add(t.code));
                                                }
                                            });

                                            const globalPercent = Math.min(100, Math.round((explicitTopicCodes.size / (TOTAL_SYLLABUS_TOPICS || 1)) * 100));

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
                                                                                <div className="flex items-center gap-2 pl-2.5">
                                                                                    <Clock size={8} className="text-gray-300" />
                                                                                    <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">{new Date(lastAct.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</p>
                                                                                    <span className="text-[6px] text-gray-200">|</span>
                                                                                    <p className="text-[6px] font-black text-gray-300 uppercase tracking-widest">+{userAct.length - 1} actions</p>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6">
                                                        <div className="p-2">
                                                            <div className="flex flex-col items-center gap-1.5 min-w-[200px]">
                                                                <div className="flex items-center gap-2 group/cred w-full justify-center">
                                                                    <Mail size={12} className="text-[#00B6C1]" />
                                                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-tighter w-12 text-right">Email</span>
                                                                    <code className="text-[10px] font-mono text-[#0E5858] bg-white px-3 py-1 rounded-lg border border-[#0E5858]/10 shadow-sm flex-1 text-center font-bold truncate">{p.email}</code>
                                                                </div>
                                                                <div className="flex items-center gap-2 group/cred w-full justify-center">
                                                                    <BNKeyIcon size={12} className="text-orange-400" />
                                                                    <span className="text-[10px] font-black uppercase text-orange-400 tracking-tighter w-12 text-right">Pass</span>
                                                                    <code className="text-[10px] font-mono text-orange-700 bg-orange-50 px-3 py-1 rounded-lg border border-orange-100 shadow-sm flex-1 text-center font-bold tracking-[0.2em]">{p.temp_password || '---'}</code>
                                                                </div>
                                                                <div className="flex items-center gap-2 group/cred w-full justify-center">
                                                                    <Phone size={12} className="text-green-500" />
                                                                    <span className="text-[10px] font-black uppercase text-green-500 tracking-tighter w-12 text-right">Phone</span>
                                                                    <code className="text-[10px] font-mono text-green-700 bg-green-50 px-3 py-1 rounded-lg border border-green-100 shadow-sm flex-1 text-center font-bold">{p.phone || 'REQUIRED'}</code>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[10px] font-bold text-[#0E5858]">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '--'}</span>
                                                            {(() => {
                                                                const lastAct = activity.find(a => a.user_id === p.id);
                                                                return <span className="text-[8px] font-black text-[#00B6C1] uppercase tracking-widest">{lastAct ? new Date(lastAct.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " " + new Date(lastAct.created_at).toLocaleDateString() : 'NO ACTIVITY'}</span>;
                                                            })()}
                                                        </div>
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
                                                        <span className={`px-4 py-1 text-[9px] font-black uppercase rounded-full border shadow-sm tracking-widest ${p.role === 'admin' ? 'bg-[#0E5858] text-white border-[#0E5858]' :
                                                            p.role === 'mentor' ? 'bg-[#00B6C1]/10 text-[#00B6C1] border-[#00B6C1]/20' :
                                                                'bg-gray-50 text-gray-500 border-gray-100'
                                                            }`}>
                                                            {p.role === 'mentor' ? 'Counsellor' : p.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {p.phone && (
                                                                <a
                                                                    href={`https://wa.me/${p.phone.replace(/[^0-9]/g, '')}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-500 hover:text-white transition-all border border-green-100"
                                                                    title="Contact on WhatsApp"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <Phone size={14} />
                                                                </a>
                                                            )}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEmailForm({
                                                                        to: p.email,
                                                                        subject: "Academy Communication",
                                                                        message: `Hi ${p.full_name},\n\n`,
                                                                        userName: p.full_name
                                                                    });
                                                                    setIsEmailModalOpen(true);
                                                                }}
                                                                className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                                                                title="Send Email"
                                                            >
                                                                <Mail size={14} />
                                                            </button>
                                                            <button
                                                                className="p-2 rounded-lg hover:bg-[#0E5858] hover:text-white transition-all text-gray-300 border border-transparent"
                                                            >
                                                                <ArrowUpRight size={16} />
                                                            </button>
                                                        </div>
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
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 scrollbar-hide">
                                {selectedQuiz.raw_data?.questions?.map((q: any, i: number) => {
                                    const userAnswer = selectedQuiz.raw_data.answers?.[i];
                                    const gradedResult = selectedQuiz.raw_data.gradedResults?.[i];
                                    const isCorrect = gradedResult ? gradedResult.isCorrect : (userAnswer === q.correctAnswer);
                                    const correctAnswer = gradedResult ? gradedResult.correctAnswer : q.correctAnswer;
                                    const justification = gradedResult ? gradedResult.justification : q.justification;

                                    return (
                                        <div key={i} className={`p-6 rounded-[2.5rem] border transition-all ${isCorrect ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex flex-col gap-1 pr-8">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black text-[#0E5858]/30 uppercase tracking-widest">Question {i + 1}</span>
                                                        {q.type === 'text' && <span className="px-2 py-0.5 bg-blue-50 text-blue-500 rounded text-[7px] font-black uppercase">Text Response</span>}
                                                    </div>
                                                    <p className="text-sm font-bold text-[#0E5858] leading-relaxed">{q.question}</p>
                                                </div>
                                                {isCorrect ? (
                                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-green-500/20">
                                                        <CheckCircle2 size={18} />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-500/20">
                                                        <XCircle size={18} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                {q.type === 'text' ? (
                                                    <div className="space-y-3">
                                                        <div className="p-4 bg-white/50 rounded-2xl border border-[#0E5858]/5">
                                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">User's Submission</p>
                                                            <p className={`text-[11px] font-bold ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>{userAnswer || <span className="italic opacity-50">Empty Response</span>}</p>
                                                        </div>
                                                        {!isCorrect && (
                                                            <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                                                                <p className="text-[8px] font-black text-green-600 uppercase tracking-widest mb-1.5">Expected Answer</p>
                                                                <p className="text-[11px] font-black text-green-700">{correctAnswer}</p>
                                                            </div>
                                                        )}
                                                        {q.aiFeedback && (
                                                            <div className="p-4 bg-[#00B6C1]/5 rounded-2xl border border-[#00B6C1]/10 border-dashed">
                                                                <p className="text-[8px] font-black text-[#00B6C1] uppercase tracking-widest mb-1.5">AI Semantic Audit Feedback</p>
                                                                <p className="text-[10px] italic font-medium text-[#0E5858]/70">"{q.aiFeedback}"</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                                        {q.options?.map((opt: string, optIdx: number) => {
                                                            const isUserPick = userAnswer === opt;
                                                            const isCorrectOpt = correctAnswer === opt;

                                                            let borderClass = "border-black/5 bg-white/40";
                                                            let textClass = "text-gray-400 font-medium";
                                                            let iconColor = "text-gray-200";

                                                            if (isCorrectOpt) {
                                                                borderClass = "border-green-500 bg-green-50/50 shadow-sm";
                                                                textClass = "text-green-700 font-bold";
                                                                iconColor = "text-green-500";
                                                            } else if (isUserPick && !isCorrect) {
                                                                borderClass = "border-red-500 bg-red-50/50 shadow-sm";
                                                                textClass = "text-red-600 font-bold";
                                                                iconColor = "text-red-500";
                                                            }

                                                            return (
                                                                <div key={optIdx} className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all ${borderClass}`}>
                                                                    <div className={`shrink-0 w-5 h-5 rounded flex items-center justify-center text-[9px] font-black border ${isCorrectOpt ? 'bg-green-500 text-white border-green-500' : (isUserPick ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-400 border-black/5')}`}>
                                                                        {String.fromCharCode(65 + optIdx)}
                                                                    </div>
                                                                    <span className={`text-[10px] leading-tight ${textClass}`}>{opt}</span>
                                                                    {(isUserPick || isCorrectOpt) && (
                                                                        <div className="ml-auto">
                                                                            {isCorrectOpt ? <CheckCircle2 size={12} className="text-green-500" /> : <XCircle size={12} className="text-red-500" />}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}


                                            </div>
                                        </div>
                                    );
                                })}
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
                                                                            <p className="text-[8px] font-black text-[#00B6C1] uppercase tracking-widest">{brands[entityIdx] || (entityIdx === 0 ? "Default" : "Entity")}</p>
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
            {/* Email Dispatcher Modal */}
            <AnimatePresence>
                {isEmailModalOpen && (
                    <div className="fixed inset-0 bg-[#0E5858]/80 backdrop-blur-md z-[110] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[3rem] p-10 max-w-xl w-full shadow-3xl relative overflow-hidden"
                        >
                            <button
                                onClick={() => setIsEmailModalOpen(false)}
                                className="absolute top-8 right-8 text-gray-300 hover:text-[#0E5858] transition-colors"
                            >
                                <XCircle size={24} />
                            </button>

                            <div className="mb-8">
                                <p className="text-[10px] font-black text-[#00B6C1] uppercase tracking-[0.3em] mb-2">Internal Correspondence</p>
                                <h3 className="text-3xl font-serif text-[#0E5858]">Compose Email</h3>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Recipient</label>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs font-bold text-[#0E5858]">
                                        {emailForm.to}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Subject Line</label>
                                    <input
                                        type="text"
                                        value={emailForm.subject}
                                        onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#00B6C1]/10"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Message Content</label>
                                    <textarea
                                        rows={6}
                                        value={emailForm.message}
                                        onChange={e => setEmailForm({ ...emailForm, message: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 text-sm font-medium outline-none h-40 resize-none focus:ring-2 focus:ring-[#00B6C1]/10"
                                        placeholder="Type your academy update or feedback..."
                                    />
                                </div>

                                <button
                                    onClick={handleSendEmail}
                                    disabled={sendingEmail}
                                    className="w-full py-5 bg-[#0E5858] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-[#00B6C1] transition-all flex items-center justify-center gap-3 shadow-xl"
                                >
                                    {sendingEmail ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Dispatch Correspondence</>}
                                </button>

                                {emailSuccess && <p className="text-green-500 text-[9px] font-black text-center uppercase tracking-widest animate-pulse">{emailSuccess}</p>}
                                {emailError && <p className="text-red-500 text-[9px] font-black text-center uppercase tracking-widest">{emailError}</p>}
                            </div>
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
