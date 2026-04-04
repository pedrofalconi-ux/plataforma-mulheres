-- Migration: Add duration_minutes to courses table for summary display
-- This allows the catalog to show duration without complex nested joins

ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 0;
