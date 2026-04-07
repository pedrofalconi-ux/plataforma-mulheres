ALTER TABLE lesson_activity_submissions
ADD COLUMN IF NOT EXISTS admin_reply TEXT,
ADD COLUMN IF NOT EXISTS admin_replied_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_replied_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
