import supabaseAdmin from './supabase.js';

async function createTables() {
  try {
    console.log('🚀 Creating database tables...\n');

    // Create user_profiles table
    console.log('Creating user_profiles table...');
    const { error: userProfilesError } = await supabaseAdmin.from('user_profiles').select('id').limit(1);
    
    if (userProfilesError && userProfilesError.message.includes('does not exist')) {
      console.log('❌ Table user_profiles does not exist.');
      console.log('\n📝 Please run this SQL in your Supabase SQL Editor:\n');
      console.log(`
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user_id ON user_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_date_me_docs_user_id ON date_me_docs(user_id);
CREATE INDEX IF NOT EXISTS idx_date_me_docs_slug ON date_me_docs(slug);
CREATE INDEX IF NOT EXISTS idx_applications_date_me_doc_id ON applications(date_me_doc_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_content_analysis_user_id ON content_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_scores_application_id ON matchmaking_scores(application_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_me_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchmaking_scores ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing service role key to access everything)
CREATE POLICY "Enable all access for service role" ON user_profiles FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON date_me_docs FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON applications FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON content_analysis FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON matchmaking_scores FOR ALL USING (true);
      `);
      
      console.log('\n📋 Copy the above SQL and run it in your Supabase SQL Editor:');
      console.log('   1. Go to https://supabase.com/dashboard');
      console.log('   2. Select your project');
      console.log('   3. Go to SQL Editor');
      console.log('   4. Paste and run the SQL\n');
      
      process.exit(1);
    } else {
      console.log('✅ Table user_profiles exists');
    }

    // Check other tables
    const tables = [
      'date_me_docs',
      'applications',
      'content_analysis',
      'matchmaking_scores'
    ];

    for (const table of tables) {
      const { error } = await supabaseAdmin.from(table).select('id').limit(1);
      if (error) {
        console.log(`❌ Table ${table} does not exist or has errors`);
      } else {
        console.log(`✅ Table ${table} exists`);
      }
    }

    console.log('\n✅ All tables checked!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTables();
