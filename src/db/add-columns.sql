-- Add missing columns to date_me_docs table
ALTER TABLE date_me_docs ADD COLUMN IF NOT EXISTS about_me TEXT;
ALTER TABLE date_me_docs ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE date_me_docs ADD COLUMN IF NOT EXISTS deal_breakers TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE date_me_docs ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE date_me_docs ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Add comment
COMMENT ON COLUMN date_me_docs.about_me IS 'About me section for the date-me-doc';
COMMENT ON COLUMN date_me_docs.interests IS 'Array of user interests';
COMMENT ON COLUMN date_me_docs.deal_breakers IS 'Array of deal breakers';
COMMENT ON COLUMN date_me_docs.custom_questions IS 'Custom application questions';
COMMENT ON COLUMN date_me_docs.social_links IS 'Social media links';
