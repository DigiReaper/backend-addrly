-- Dating Forms and Applications Tables
-- Run this migration in your Supabase SQL Editor

-- Create dating_forms table
CREATE TABLE IF NOT EXISTS public.dating_forms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    fields JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create form_applications table
CREATE TABLE IF NOT EXISTS public.form_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id UUID NOT NULL REFERENCES public.dating_forms(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    responses JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'shortlisted', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dating_forms_user_id ON public.dating_forms(user_id);
CREATE INDEX IF NOT EXISTS idx_dating_forms_status ON public.dating_forms(status);
CREATE INDEX IF NOT EXISTS idx_form_applications_form_id ON public.form_applications(form_id);
CREATE INDEX IF NOT EXISTS idx_form_applications_applicant_id ON public.form_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_form_applications_status ON public.form_applications(status);

-- Enable Row Level Security
ALTER TABLE public.dating_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dating_forms
-- Users can view their own forms
CREATE POLICY "Users can view own forms" ON public.dating_forms
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own forms
CREATE POLICY "Users can create own forms" ON public.dating_forms
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own forms
CREATE POLICY "Users can update own forms" ON public.dating_forms
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own forms
CREATE POLICY "Users can delete own forms" ON public.dating_forms
    FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for form_applications
-- Form owners can view applications to their forms
CREATE POLICY "Form owners can view applications" ON public.form_applications
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.dating_forms
            WHERE dating_forms.id = form_applications.form_id
            AND dating_forms.user_id = auth.uid()
        )
    );

-- Applicants can create applications
CREATE POLICY "Users can create applications" ON public.form_applications
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = form_applications.applicant_id
            AND profiles.id = auth.uid()
        )
    );

-- Form owners can update application status
CREATE POLICY "Form owners can update applications" ON public.form_applications
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.dating_forms
            WHERE dating_forms.id = form_applications.form_id
            AND dating_forms.user_id = auth.uid()
        )
    );

-- Add updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_dating_forms_updated_at ON public.dating_forms;
CREATE TRIGGER update_dating_forms_updated_at
    BEFORE UPDATE ON public.dating_forms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_form_applications_updated_at ON public.form_applications;
CREATE TRIGGER update_form_applications_updated_at
    BEFORE UPDATE ON public.form_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.dating_forms TO authenticated;
GRANT ALL ON public.form_applications TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

COMMENT ON TABLE public.dating_forms IS 'Dating forms created by users to receive applications';
COMMENT ON TABLE public.form_applications IS 'Applications submitted to dating forms';
