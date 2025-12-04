
-- COPY AND PASTE THIS ENTIRE SCRIPT INTO SUPABASE SQL EDITOR
-- Go to: https://supabase.com/dashboard -> Your Project -> SQL Editor -> New Query

-- Create date_me_docs table
CREATE TABLE IF NOT EXISTS date_me_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  header_content TEXT,
  about_me TEXT,
  interests TEXT[] DEFAULT ARRAY[]::TEXT[],
  deal_breakers TEXT[] DEFAULT ARRAY[]::TEXT[],
  custom_questions JSONB DEFAULT '[]'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,
  form_questions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_me_doc_id UUID REFERENCES date_me_docs(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_bio TEXT,
  answers JSONB DEFAULT '{}'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content_analysis table
CREATE TABLE IF NOT EXISTS content_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_url TEXT,
  extracted_content JSONB,
  content_metadata JSONB,
  psychological_profile JSONB,
  interests TEXT[] DEFAULT ARRAY[]::TEXT[],
  communication_style JSONB,
  values TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matchmaking_scores table
CREATE TABLE IF NOT EXISTS matchmaking_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  doc_owner_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  compatibility_score INTEGER,
  compatibility_breakdown JSONB,
  matching_factors JSONB,
  red_flags TEXT[] DEFAULT ARRAY[]::TEXT[],
  green_flags TEXT[] DEFAULT ARRAY[]::TEXT[],
  recommendation TEXT,
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_date_me_docs_user_id ON date_me_docs(user_id);
CREATE INDEX IF NOT EXISTS idx_date_me_docs_slug ON date_me_docs(slug);
CREATE INDEX IF NOT EXISTS idx_applications_date_me_doc_id ON applications(date_me_doc_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_content_analysis_user_id ON content_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_scores_application_id ON matchmaking_scores(application_id);

-- Enable Row Level Security
ALTER TABLE date_me_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchmaking_scores ENABLE ROW LEVEL SECURITY;

-- Create policies to allow service role access
DROP POLICY IF EXISTS "Enable all for service role" ON date_me_docs;
CREATE POLICY "Enable all for service role" ON date_me_docs FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all for service role" ON applications;
CREATE POLICY "Enable all for service role" ON applications FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all for service role" ON content_analysis;
CREATE POLICY "Enable all for service role" ON content_analysis FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all for service role" ON matchmaking_scores;
CREATE POLICY "Enable all for service role" ON matchmaking_scores FOR ALL USING (true);
