-- Profiles table to store user metadata
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'counsellor' CONSTRAINT profiles_role_check CHECK (role IN ('counsellor', 'nutripreneur', 'moderator', 'admin', 'tech', 'bd', 'cs', 'buddy', 'trainer buddy')),
    temp_password TEXT,
    training_buddy TEXT, -- JSON array of buddies
    phone TEXT, -- Admin-defined phone number
    avatar_url TEXT,
    allowed_modules JSONB DEFAULT '[]'::jsonb, -- Admin-granted selective module access (e.g. ["module-3","module-4"])
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Table to store admin-defined quizzes for specific topics
CREATE TABLE IF NOT EXISTS admin_quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_code TEXT UNIQUE NOT NULL,
    questions JSONB NOT NULL, -- Array of { question, options, correctAnswer, justification }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to store admin notifications sent to counsellors
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info', 'warning', 'alert'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- Helper function to check if user is an admin/staff
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'buddy', 'trainer buddy', 'tech', 'bd', 'cs')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- If these shared tables already exist, enable RLS for them too
DO $$
BEGIN
    ALTER TABLE IF EXISTS syllabus_content ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS mentor_progress ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS assessment_logs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS simulation_logs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS mentor_activity_logs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS summary_audits ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS syllabus_folders ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS certification_attempts ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Policies for Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
CREATE POLICY "Users can view their own profile." ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles." ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for Admin Quizzes
DROP POLICY IF EXISTS "Admins have full access to admin_quizzes" ON admin_quizzes;
DROP POLICY IF EXISTS "Authenticated users can read admin_quizzes" ON admin_quizzes;
CREATE POLICY "Admins have full access to admin_quizzes" ON admin_quizzes FOR ALL USING (is_admin());
CREATE POLICY "Authenticated users can read admin_quizzes" ON admin_quizzes FOR SELECT TO authenticated USING (true);

-- Policies for Notifications
DROP POLICY IF EXISTS "Admins have full access to notifications" ON notifications;
DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Admins have full access to notifications" ON notifications FOR ALL USING (is_admin());
CREATE POLICY "Users can read their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

