-- =======================================================
-- COMPLETE DATABASE MIGRATION SCRIPT
-- Run this in Supabase SQL Editor (deployed environment)
-- Safe to run multiple times — all statements are idempotent
-- Last updated: 2026-04-16
-- =======================================================

-- -------------------------------------------------------
-- 1. PROFILES TABLE — Ensure all columns exist
-- -------------------------------------------------------
ALTER TABLE IF EXISTS profiles
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS full_name TEXT,
    ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'counsellor',
    ADD COLUMN IF NOT EXISTS temp_password TEXT,
    ADD COLUMN IF NOT EXISTS training_buddy TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS allowed_modules JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Clean up legacy roles before applying the new constraint
UPDATE profiles SET role = 'counsellor' WHERE role = 'mentor';
UPDATE profiles SET role = 'tech' WHERE role = 'product automation';
UPDATE profiles SET role = 'cs' WHERE role = 'Customer Success';
UPDATE profiles SET role = 'cs' WHERE role = 'Client Service';

ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('counsellor', 'nutripreneur', 'moderator', 'admin', 'tech', 'bd', 'cs', 'buddy', 'trainer buddy'));

-- -------------------------------------------------------
-- 2. ADMIN QUIZZES — Store admin-defined quiz questions
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_code TEXT UNIQUE NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_guidance TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS admin_quizzes
    ADD COLUMN IF NOT EXISTS ai_guidance TEXT;

-- -------------------------------------------------------
-- 3. NOTIFICATIONS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- 4. SYLLABUS CONTENT (Dynamic resource bank)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS syllabus_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id TEXT NOT NULL,
    title TEXT,
    content_type TEXT,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- 5. SYLLABUS FOLDERS (Custom content bank folders)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS syllabus_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    prefix TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- 6. MENTOR PROGRESS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentor_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_code TEXT NOT NULL,
    module_id TEXT,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, topic_code)
);

-- -------------------------------------------------------
-- 7. ASSESSMENT LOGS — Stores quiz attempt results
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_code TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 5,
    raw_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure admin_override column exists for admin corrections
ALTER TABLE IF EXISTS assessment_logs
    ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS total_questions INTEGER DEFAULT 5,
    ADD COLUMN IF NOT EXISTS admin_overrides JSONB DEFAULT '{}'::jsonb;

-- -------------------------------------------------------
-- 8. SUMMARY AUDITS — Peer review submissions
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS summary_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_code TEXT NOT NULL,
    summary_text TEXT,
    ai_feedback TEXT DEFAULT 'AWAITING_REVIEW',
    score INTEGER DEFAULT 0,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- 9. MENTOR ACTIVITY LOGS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentor_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    content_title TEXT,
    module_id TEXT,
    topic_code TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS mentor_activity_logs
    ADD COLUMN IF NOT EXISTS topic_code TEXT;

-- -------------------------------------------------------
-- 10. SIMULATION LOGS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS simulation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_code TEXT,
    score INTEGER DEFAULT 0,
    raw_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- 11. CERTIFICATION ATTEMPTS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS certification_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    passed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- 12. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- -------------------------------------------------------
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS syllabus_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS syllabus_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mentor_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assessment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS summary_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mentor_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS simulation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS certification_attempts ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------
-- 13. HELPER FUNCTION: is_admin()
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'moderator', 'buddy', 'trainer buddy', 'tech', 'bd', 'cs')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------
-- 14. RLS POLICIES — Drop & recreate for clean state
-- -------------------------------------------------------

-- PROFILES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile." ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles." ON profiles;

CREATE POLICY "Users can view their own profile." ON profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles." ON profiles
    FOR SELECT USING (is_admin());
CREATE POLICY "Users can update own profile." ON profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile." ON profiles
    FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can insert profiles." ON profiles
    FOR INSERT WITH CHECK (is_admin());

-- ADMIN QUIZZES
DROP POLICY IF EXISTS "Admins have full access to admin_quizzes" ON admin_quizzes;
DROP POLICY IF EXISTS "Authenticated users can read admin_quizzes" ON admin_quizzes;

CREATE POLICY "Admins have full access to admin_quizzes" ON admin_quizzes
    FOR ALL USING (is_admin());
CREATE POLICY "Authenticated users can read admin_quizzes" ON admin_quizzes
    FOR SELECT TO authenticated USING (true);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Admins have full access to notifications" ON notifications;
DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

CREATE POLICY "Admins have full access to notifications" ON notifications
    FOR ALL USING (is_admin());
CREATE POLICY "Users can read their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- SYLLABUS CONTENT
DROP POLICY IF EXISTS "Anyone authenticated can view syllabus content" ON syllabus_content;
DROP POLICY IF EXISTS "Admins have full access to syllabus content" ON syllabus_content;

CREATE POLICY "Anyone authenticated can view syllabus content" ON syllabus_content
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins have full access to syllabus content" ON syllabus_content
    FOR ALL USING (is_admin());

-- SYLLABUS FOLDERS
DROP POLICY IF EXISTS "Anyone authenticated can view syllabus folders" ON syllabus_folders;
DROP POLICY IF EXISTS "Admins have full access to syllabus folders" ON syllabus_folders;

CREATE POLICY "Anyone authenticated can view syllabus folders" ON syllabus_folders
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins have full access to syllabus folders" ON syllabus_folders
    FOR ALL USING (is_admin());

-- MENTOR PROGRESS
DROP POLICY IF EXISTS "Users can view own progress" ON mentor_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON mentor_progress;
DROP POLICY IF EXISTS "Admins can view all progress" ON mentor_progress;

CREATE POLICY "Users can view own progress" ON mentor_progress
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own progress" ON mentor_progress;
CREATE POLICY "Users can manage own progress" ON mentor_progress
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all progress" ON mentor_progress
    FOR SELECT USING (is_admin());

-- ASSESSMENT LOGS
DROP POLICY IF EXISTS "Users can view own assessment logs" ON assessment_logs;
DROP POLICY IF EXISTS "Users can insert own assessment logs" ON assessment_logs;
DROP POLICY IF EXISTS "Admins can view all assessment logs" ON assessment_logs;
DROP POLICY IF EXISTS "Admins full access to assessment logs" ON assessment_logs;

CREATE POLICY "Users can view own assessment logs" ON assessment_logs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assessment logs" ON assessment_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins full access to assessment logs" ON assessment_logs
    FOR ALL USING (is_admin());

-- SUMMARY AUDITS
DROP POLICY IF EXISTS "Users can view own audits" ON summary_audits;
DROP POLICY IF EXISTS "Users can insert own audits" ON summary_audits;
DROP POLICY IF EXISTS "Admins have full access to audits" ON summary_audits;

CREATE POLICY "Users can view own audits" ON summary_audits
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own audits" ON summary_audits
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins have full access to audits" ON summary_audits
    FOR ALL USING (is_admin());

-- MENTOR ACTIVITY LOGS
DROP POLICY IF EXISTS "Users can view own activity logs" ON mentor_activity_logs;
DROP POLICY IF EXISTS "Users can insert own activity logs" ON mentor_activity_logs;
DROP POLICY IF EXISTS "Admins can view all activity logs" ON mentor_activity_logs;

CREATE POLICY "Users can view own activity logs" ON mentor_activity_logs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity logs" ON mentor_activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all activity logs" ON mentor_activity_logs
    FOR SELECT USING (is_admin());

-- SIMULATION LOGS
DROP POLICY IF EXISTS "Users can view own simulation logs" ON simulation_logs;
DROP POLICY IF EXISTS "Users can insert own simulation logs" ON simulation_logs;
DROP POLICY IF EXISTS "Admins can view all simulation logs" ON simulation_logs;

CREATE POLICY "Users can view own simulation logs" ON simulation_logs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own simulation logs" ON simulation_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all simulation logs" ON simulation_logs
    FOR SELECT USING (is_admin());

-- CERTIFICATION ATTEMPTS
DROP POLICY IF EXISTS "Users can view own cert attempts" ON certification_attempts;
DROP POLICY IF EXISTS "Users can insert own cert attempts" ON certification_attempts;
DROP POLICY IF EXISTS "Admins can view all cert attempts" ON certification_attempts;

CREATE POLICY "Users can view own cert attempts" ON certification_attempts
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cert attempts" ON certification_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all cert attempts" ON certification_attempts
    FOR SELECT USING (is_admin());

-- -------------------------------------------------------
-- 15. FORCE SCHEMA CACHE RELOAD (critical after column adds)
-- -------------------------------------------------------
NOTIFY pgrst, 'reload schema';
