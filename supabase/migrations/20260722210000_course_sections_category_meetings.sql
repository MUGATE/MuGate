-- Offerings category (table heading), multi-meeting JSON, and sync freshness
ALTER TABLE public."CourseSections" ADD COLUMN IF NOT EXISTS category text NULL;
ALTER TABLE public."CourseSections" ADD COLUMN IF NOT EXISTS meetings text NULL;
ALTER TABLE public."CourseSections" ADD COLUMN IF NOT EXISTS "syncedAt" timestamptz NULL;

COMMENT ON COLUMN public."CourseSections".category IS 'UMS offerings table heading (e.g. Technical Elective); distinct from type Lecture/Lab';
COMMENT ON COLUMN public."CourseSections".meetings IS 'JSON array of {day,startTime,endTime} for multi-window sections';
COMMENT ON COLUMN public."CourseSections"."syncedAt" IS 'Timestamp of last successful portal sync for this section';
