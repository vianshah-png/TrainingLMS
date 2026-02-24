-- Table to store admin-defined quizzes for specific topics
CREATE TABLE admin_quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_code TEXT UNIQUE NOT NULL,
    questions JSONB NOT NULL, -- Array of { question, options, correctAnswer, justification }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_quizzes ENABLE ROW LEVEL SECURITY;

-- Allow admins to do everything
CREATE POLICY "Admins have full access to admin_quizzes" 
ON admin_quizzes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Allow authenticated users to read quizzes (so they can take them)
CREATE POLICY "Authenticated users can read admin_quizzes" 
ON admin_quizzes 
FOR SELECT 
TO authenticated 
USING (true);
