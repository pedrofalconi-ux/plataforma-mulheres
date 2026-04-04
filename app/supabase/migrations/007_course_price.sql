-- Migration: Add course price field

-- 1. Add Price Column to Courses Table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) DEFAULT 0.00;
