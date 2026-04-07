ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS activity_questions JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS lesson_activity_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_activity_submissions_lesson
  ON lesson_activity_submissions(lesson_id);

CREATE INDEX IF NOT EXISTS idx_lesson_activity_submissions_profile
  ON lesson_activity_submissions(profile_id);

ALTER TABLE lesson_activity_submissions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'lesson_activity_submissions'
      AND policyname = 'Users view own activity submissions'
  ) THEN
    CREATE POLICY "Users view own activity submissions"
      ON lesson_activity_submissions
      FOR SELECT
      USING (profile_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'lesson_activity_submissions'
      AND policyname = 'Users insert own activity submissions'
  ) THEN
    CREATE POLICY "Users insert own activity submissions"
      ON lesson_activity_submissions
      FOR INSERT
      WITH CHECK (profile_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'lesson_activity_submissions'
      AND policyname = 'Users update own activity submissions'
  ) THEN
    CREATE POLICY "Users update own activity submissions"
      ON lesson_activity_submissions
      FOR UPDATE
      USING (profile_id = auth.uid())
      WITH CHECK (profile_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'lesson_activity_submissions'
      AND policyname = 'Admins manage all activity submissions'
  ) THEN
    CREATE POLICY "Admins manage all activity submissions"
      ON lesson_activity_submissions
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

DROP TRIGGER IF EXISTS lesson_activity_submissions_updated_at ON lesson_activity_submissions;
CREATE TRIGGER lesson_activity_submissions_updated_at
  BEFORE UPDATE ON lesson_activity_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
