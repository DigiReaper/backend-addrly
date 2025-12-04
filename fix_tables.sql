-- Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS form_applications CASCADE;
DROP TABLE IF EXISTS dating_forms CASCADE;

-- Create dating_forms table
CREATE TABLE dating_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  fields JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create form_applications table
CREATE TABLE form_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES dating_forms(id) ON DELETE CASCADE,
  form_owner_id UUID NOT NULL,
  applicant_data JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'shortlisted', 'archived')),
  ai_score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_dating_forms_user_id ON dating_forms(user_id);
CREATE INDEX idx_dating_forms_status ON dating_forms(status);
CREATE INDEX idx_form_applications_form_id ON form_applications(form_id);
CREATE INDEX idx_form_applications_form_owner_id ON form_applications(form_owner_id);
CREATE INDEX idx_form_applications_status ON form_applications(status);

-- Verify the tables were created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('dating_forms', 'form_applications')
ORDER BY table_name, ordinal_position;
