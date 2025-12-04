-- Create profiles table for onboarding data
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 100),
  gender TEXT NOT NULL,
  location TEXT NOT NULL,
  bio TEXT NOT NULL CHECK (char_length(bio) >= 50),
  interests TEXT[] NOT NULL DEFAULT '{}',
  looking_for TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  personality_type TEXT,
  hobbies TEXT[] DEFAULT '{}',
  lifestyle TEXT,
  education TEXT,
  occupation TEXT,
  social_media_urls JSONB DEFAULT '{}',
  preferred_age_range JSONB DEFAULT '{"min": 18, "max": 35}',
  deal_breakers TEXT[] DEFAULT '{}',
  values TEXT[] DEFAULT '{}',
  profile_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_looking_for ON profiles(looking_for);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_age ON profiles(age);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_profile_completed ON profiles(profile_completed);

-- Create personality analyses table
CREATE TABLE IF NOT EXISTS personality_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for analyses
CREATE INDEX IF NOT EXISTS idx_personality_analyses_user_id ON personality_analyses(user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_analyses ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow users to view other completed profiles for matching
CREATE POLICY "Users can view completed profiles"
  ON profiles FOR SELECT
  USING (profile_completed = true);

-- Personality analyses policies
CREATE POLICY "Users can view their own analyses"
  ON personality_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses"
  ON personality_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
