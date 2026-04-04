-- Migration 011: Audit Logs for Administrative Actions
-- This table tracks sensitive changes made by admins

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- e.g., 'UPDATE_COURSE_PRICE', 'DELETE_USER', 'APPROVE_PROJECT'
    entity_name TEXT NOT NULL, -- e.g., 'courses', 'profiles', 'observatory_projects'
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies for Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Anyone authenticated can insert (though typically done via backend server actions)
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_profile_id ON public.audit_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
