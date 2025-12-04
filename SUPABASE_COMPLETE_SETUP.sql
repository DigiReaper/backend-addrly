-- Fix user_profiles table structure
-- Run this in Supabase SQL Editor

-- Drop existing table if it has wrong structure
DROP TABLE IF EXISTS matchmaking_scores CASCADE;
DROP TABLE IF EXISTS content_analysis CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS date_me_docs CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create user_profiles table with correct structure
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  bio TEXT,
  age INTEGER,
  location TEXT,
  gender TEXT,
  looking_for TEXT[],
  interests TEXT[] DEFAULT ARRAY[]::TEXT[],
  hobbies TEXT[] DEFAULT ARRAY[]::TEXT[],
  values TEXT[] DEFAULT ARRAY[]::TEXT[],
  lifestyle JSONB DEFAULT '{}'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,
  twitter_handle TEXT,
  instagram_handle TEXT,
  personal_website TEXT,
  spotify_profile TEXT,
  other_links JSONB DEFAULT '[]'::jsonb,
  digital_footprint_score INTEGER DEFAULT 0,
  profile_completed BOOLEAN DEFAULT false,
  last_analysis_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create date_me_docs table
CREATE TABLE date_me_docs (
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
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_me_doc_id UUID REFERENCES date_me_docs(id) ON DELETE CASCADE,
  applicant_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_bio TEXT,
  answers JSONB DEFAULT '{}'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  match_score INTEGER DEFAULT 0,
  compatibility_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content_analysis table
CREATE TABLE content_analysis (
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
CREATE TABLE matchmaking_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  doc_owner_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  compatibility_score INTEGER,
  text_match_score INTEGER,
  url_context_score INTEGER,
  overall_score INTEGER,
  compatibility_breakdown JSONB,
  matching_factors JSONB,
  red_flags TEXT[] DEFAULT ARRAY[]::TEXT[],
  green_flags TEXT[] DEFAULT ARRAY[]::TEXT[],
  recommendation TEXT,
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_profiles_auth_user_id ON user_profiles(auth_user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_date_me_docs_user_id ON date_me_docs(user_id);
CREATE INDEX idx_date_me_docs_slug ON date_me_docs(slug);
CREATE INDEX idx_applications_date_me_doc_id ON applications(date_me_doc_id);
CREATE INDEX idx_applications_applicant_user_id ON applications(applicant_user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_content_analysis_user_id ON content_analysis(user_id);
CREATE INDEX idx_matchmaking_scores_application_id ON matchmaking_scores(application_id);
CREATE INDEX idx_matchmaking_scores_doc_owner_id ON matchmaking_scores(doc_owner_id);
CREATE INDEX idx_matchmaking_scores_applicant_id ON matchmaking_scores(applicant_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_me_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchmaking_scores ENABLE ROW LEVEL SECURITY;

-- Create policies (service role has full access)
CREATE POLICY "Enable all for service role" ON user_profiles FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON date_me_docs FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON applications FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON content_analysis FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON matchmaking_scores FOR ALL USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_date_me_docs_updated_at BEFORE UPDATE ON date_me_docs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
