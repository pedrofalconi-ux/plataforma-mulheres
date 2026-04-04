-- Migration 012: Supplemental materials for lessons

ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS materials JSONB DEFAULT '[]'::jsonb;
