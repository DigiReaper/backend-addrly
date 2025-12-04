-- Users Table (Better Auth will create its own tables, this is for extended user data)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  bio TEXT,
  twitter_handle TEXT,
  instagram_handle TEXT,
  personal_website TEXT,
  spotify_profile TEXT,
  other_links JSONB DEFAULT '[]'::jsonb,
  digital_footprint_score INTEGER DEFAULT 0,
  last_analysis_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Date Me Docs Table
CREATE TABLE IF NOT EXISTS date_me_docs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Form Questions Structure in JSONB:
-- {
--   "id": "uuid",
--   "question": "What excites you about this?",
--   "type": "text|textarea|url|video|email|select",
--   "required": true,
--   "options": ["option1", "option2"], // for select type
--   "order": 1
-- }

-- Applications Table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date_me_doc_id UUID REFERENCES date_me_docs(id) ON DELETE CASCADE,
  applicant_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  applicant_email TEXT NOT NULL,
  applicant_name TEXT,
  answers JSONB DEFAULT '{}'::jsonb,
  submitted_links JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'matched')),
  compatibility_score DECIMAL(5,2),
  analysis_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Answers Structure in JSONB:
-- {
--   "question_id": "answer_value",
--   "question_id_2": "answer_value_2"
-- }

-- Content Analysis Table (stores extracted and analyzed content)
CREATE TABLE IF NOT EXISTS content_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('twitter', 'website', 'blog', 'instagram', 'spotify', 'video')),
  source_url TEXT NOT NULL,
  extracted_content TEXT,
  content_metadata JSONB DEFAULT '{}'::jsonb,
  psychological_profile JSONB DEFAULT '{}'::jsonb,
  interests JSONB DEFAULT '[]'::jsonb,
  communication_style JSONB DEFAULT '{}'::jsonb,
  values JSONB DEFAULT '[]'::jsonb,
  analysis_version TEXT DEFAULT 'v1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Psychological Profile Structure in JSONB:
-- {
--   "personality_traits": {
--     "openness": 0.8,
--     "conscientiousness": 0.7,
--     "extraversion": 0.6,
--     "agreeableness": 0.75,
--     "neuroticism": 0.3
--   },
--   "communication_style": "analytical|emotional|casual|formal",
--   "humor_type": "sarcastic|witty|dark|wholesome",
--   "thinking_style": "analytical|creative|practical",
--   "values": ["freedom", "family", "career", "adventure"],
--   "interests": ["tech", "art", "politics", "music"],
--   "passions": ["building startups", "writing", "photography"]
-- }

-- Matchmaking Scores Table
CREATE TABLE IF NOT EXISTS matchmaking_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  date_me_doc_id UUID REFERENCES date_me_docs(id) ON DELETE CASCADE,
  doc_owner_user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  applicant_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  overall_score DECIMAL(5,2) NOT NULL,
  compatibility_breakdown JSONB DEFAULT '{}'::jsonb,
  matching_factors JSONB DEFAULT '{}'::jsonb,
  red_flags JSONB DEFAULT '[]'::jsonb,
  green_flags JSONB DEFAULT '[]'::jsonb,
  recommendation TEXT,
  confidence_level DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compatibility Breakdown Structure:
-- {
--   "personality_match": 0.85,
--   "interests_match": 0.78,
--   "values_match": 0.92,
--   "communication_compatibility": 0.80,
--   "lifestyle_match": 0.75,
--   "conversation_potential": 0.88
-- }

-- Analysis Jobs Queue Table
CREATE TABLE IF NOT EXISTS analysis_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_type TEXT NOT NULL CHECK (job_type IN ('content_extraction', 'psychological_analysis', 'matchmaking')),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'application', 'date_me_doc')),
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 5,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_date_me_docs_user_id ON date_me_docs(user_id);
CREATE INDEX IF NOT EXISTS idx_date_me_docs_slug ON date_me_docs(slug);
CREATE INDEX IF NOT EXISTS idx_applications_doc_id ON applications(date_me_doc_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_user_id ON applications(applicant_user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_content_analysis_user_id ON content_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_content_analysis_application_id ON content_analysis(application_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_scores_application_id ON matchmaking_scores(application_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_scores_doc_owner ON matchmaking_scores(doc_owner_user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON analysis_jobs(status);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_entity ON analysis_jobs(entity_id, entity_type);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_date_me_docs_updated_at BEFORE UPDATE ON date_me_docs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_analysis_updated_at BEFORE UPDATE ON content_analysis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Dating Forms Table (for the form builder feature)
CREATE TABLE IF NOT EXISTS dating_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  fields JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Form Applications Table
CREATE TABLE IF NOT EXISTS form_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID REFERENCES dating_forms(id) ON DELETE CASCADE,
  form_owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  applicant_data JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'shortlisted', 'archived')),
  ai_score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for dating forms
CREATE INDEX IF NOT EXISTS idx_dating_forms_user_id ON dating_forms(user_id);
CREATE INDEX IF NOT EXISTS idx_dating_forms_status ON dating_forms(status);
CREATE INDEX IF NOT EXISTS idx_form_applications_form_id ON form_applications(form_id);
CREATE INDEX IF NOT EXISTS idx_form_applications_form_owner ON form_applications(form_owner_id);
CREATE INDEX IF NOT EXISTS idx_form_applications_status ON form_applications(status);

-- Updated at trigger for new tables
CREATE TRIGGER update_dating_forms_updated_at BEFORE UPDATE ON dating_forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_form_applications_updated_at BEFORE UPDATE ON form_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
