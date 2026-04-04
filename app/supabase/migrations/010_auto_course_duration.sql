-- Migration 010: Auto-calculation of course duration
-- This script adds a trigger that sums the duration of all lessons in a course
-- whenever a lesson is added, updated, or removed.

-- 1. Function to calculate and update a specific course duration
CREATE OR REPLACE FUNCTION public.fn_update_course_duration(course_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.courses
    SET duration_minutes = (
        SELECT COALESCE(SUM(l.duration_minutes), 0)
        FROM public.lessons l
        JOIN public.modules m ON l.module_id = m.id
        WHERE m.course_id = course_uuid
    )
    WHERE id = course_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger function to handle lesson changes
CREATE OR REPLACE FUNCTION public.tg_on_lesson_duration_change()
RETURNS TRIGGER AS $$
DECLARE
    course_uuid UUID;
BEGIN
    -- Get the course ID associated with the lesson being changed
    IF (TG_OP = 'DELETE') THEN
        SELECT course_id INTO course_uuid FROM public.modules WHERE id = OLD.module_id;
    ELSE
        SELECT course_id INTO course_uuid FROM public.modules WHERE id = NEW.module_id;
    END IF;

    -- Update the course duration
    IF course_uuid IS NOT NULL THEN
        PERFORM public.fn_update_course_duration(course_uuid);
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger on the lessons table
DROP TRIGGER IF EXISTS tr_lesson_duration_update ON public.lessons;
CREATE TRIGGER tr_lesson_duration_update
AFTER INSERT OR UPDATE OF duration_minutes OR DELETE
ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION public.tg_on_lesson_duration_change();

-- 4. Initial Sync: Update all existing courses
DO $$
DECLARE
    c RECORD;
BEGIN
    FOR c IN SELECT id FROM public.courses LOOP
        PERFORM public.fn_update_course_duration(c.id);
    END LOOP;
END;
$$;
