-- ============================================
-- MuGate RLS: enable + policies by table role
-- Backend (postgres / service_role) bypasses RLS.
-- These policies protect PostgREST anon/authenticated clients.
-- ============================================

-- Helpers: map Supabase Auth uid → MuGate roles
-- Assumes auth.users.id is stored as "Users".id when using Supabase Auth.
CREATE OR REPLACE FUNCTION public.is_mugate_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public."Users" u
    JOIN public."Admins" a ON a."universityId" = u."universityId"
    WHERE u.id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public."Users" u
    WHERE u.id = auth.uid()
      AND NULLIF(current_setting('app.super_admin_university_id', true), '') IS NOT NULL
      AND u."universityId" = current_setting('app.super_admin_university_id', true)
  );
$$;

CREATE OR REPLACE FUNCTION public.mugate_uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.mugate_uid_text()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid()::text;
$$;

REVOKE ALL ON FUNCTION public.is_mugate_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_mugate_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mugate_uid() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.mugate_uid_text() TO authenticated, anon;

-- ----------------------------------------
-- Enable RLS on every MuGate table
-- ----------------------------------------
ALTER TABLE public."Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PortalCredentials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CourseSections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AcademicHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ScheduleSections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ChatSessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ChatMessages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ChatAnalytics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Admins" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."KnowledgePages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."KnowledgeChunks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ScraperRuns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ScrapeQueue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CapstonePartners" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CapstoneIdeas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."InternshipReviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserRoadmap" ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owner in restrictive environments (optional; keep OFF so
-- postgres/service_role used by the Express backend keeps full access without SET ROLE).
-- ALTER TABLE ... FORCE ROW LEVEL SECURITY;  -- intentionally not forced

-- Drop prior policies if re-running
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'Users','PortalCredentials','Courses','CourseSections','AcademicHistory',
        'Schedules','ScheduleSections','Sessions','ChatSessions','ChatMessages',
        'ChatAnalytics','Admins','KnowledgePages','KnowledgeChunks','ScraperRuns',
        'ScrapeQueue','CapstonePartners','CapstoneIdeas','Companies',
        'InternshipReviews','Events','UserRoadmap'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ============================================
-- ROLE: Shared catalog (no user/org owner column)
-- Courses / CourseSections / Companies / CapstoneIdeas /
-- Events / Knowledge* — public read; writes via backend or admin
-- ============================================

-- Courses (NO user_id / organization_id — university catalog)
CREATE POLICY "Courses: public read"
  ON public."Courses" FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Courses: admin write"
  ON public."Courses" FOR ALL
  TO authenticated
  USING (public.is_mugate_admin())
  WITH CHECK (public.is_mugate_admin());

-- CourseSections
CREATE POLICY "CourseSections: public read"
  ON public."CourseSections" FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "CourseSections: admin write"
  ON public."CourseSections" FOR ALL
  TO authenticated
  USING (public.is_mugate_admin())
  WITH CHECK (public.is_mugate_admin());

-- Companies
CREATE POLICY "Companies: public read"
  ON public."Companies" FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Companies: admin write"
  ON public."Companies" FOR ALL
  TO authenticated
  USING (public.is_mugate_admin())
  WITH CHECK (public.is_mugate_admin());

-- CapstoneIdeas (active ideas public; admin manages)
CREATE POLICY "CapstoneIdeas: public read active"
  ON public."CapstoneIdeas" FOR SELECT
  TO anon, authenticated
  USING ("isActive" = true OR public.is_mugate_admin());

CREATE POLICY "CapstoneIdeas: admin write"
  ON public."CapstoneIdeas" FOR ALL
  TO authenticated
  USING (public.is_mugate_admin())
  WITH CHECK (public.is_mugate_admin());

-- Events (active public)
CREATE POLICY "Events: public read active"
  ON public."Events" FOR SELECT
  TO anon, authenticated
  USING ("isActive" = true OR public.is_mugate_admin());

CREATE POLICY "Events: admin write"
  ON public."Events" FOR ALL
  TO authenticated
  USING (public.is_mugate_admin())
  WITH CHECK (public.is_mugate_admin());

-- Knowledge base (active pages/chunks readable for chatbot clients)
CREATE POLICY "KnowledgePages: public read active"
  ON public."KnowledgePages" FOR SELECT
  TO anon, authenticated
  USING ("isActive" = true OR public.is_mugate_admin());

CREATE POLICY "KnowledgePages: admin write"
  ON public."KnowledgePages" FOR ALL
  TO authenticated
  USING (public.is_mugate_admin())
  WITH CHECK (public.is_mugate_admin());

CREATE POLICY "KnowledgeChunks: public read via active page"
  ON public."KnowledgeChunks" FOR SELECT
  TO anon, authenticated
  USING (
    public.is_mugate_admin()
    OR EXISTS (
      SELECT 1 FROM public."KnowledgePages" p
      WHERE p.id = "KnowledgeChunks"."pageId" AND p."isActive" = true
    )
  );

CREATE POLICY "KnowledgeChunks: admin write"
  ON public."KnowledgeChunks" FOR ALL
  TO authenticated
  USING (public.is_mugate_admin())
  WITH CHECK (public.is_mugate_admin());

-- ============================================
-- ROLE: User-owned (uuid "userId" → Users.id / auth.uid())
-- ============================================

-- Users: read/update own profile; no client insert (backend registers)
CREATE POLICY "Users: select own"
  ON public."Users" FOR SELECT
  TO authenticated
  USING (id = public.mugate_uid() OR public.is_mugate_admin());

CREATE POLICY "Users: update own"
  ON public."Users" FOR UPDATE
  TO authenticated
  USING (id = public.mugate_uid())
  WITH CHECK (id = public.mugate_uid());

-- AcademicHistory
CREATE POLICY "AcademicHistory: select own"
  ON public."AcademicHistory" FOR SELECT
  TO authenticated
  USING ("userId" = public.mugate_uid() OR public.is_mugate_admin());

CREATE POLICY "AcademicHistory: insert own"
  ON public."AcademicHistory" FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = public.mugate_uid());

CREATE POLICY "AcademicHistory: update own"
  ON public."AcademicHistory" FOR UPDATE
  TO authenticated
  USING ("userId" = public.mugate_uid())
  WITH CHECK ("userId" = public.mugate_uid());

CREATE POLICY "AcademicHistory: delete own"
  ON public."AcademicHistory" FOR DELETE
  TO authenticated
  USING ("userId" = public.mugate_uid());

-- Schedules
CREATE POLICY "Schedules: select own"
  ON public."Schedules" FOR SELECT
  TO authenticated
  USING ("userId" = public.mugate_uid() OR public.is_mugate_admin());

CREATE POLICY "Schedules: insert own"
  ON public."Schedules" FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = public.mugate_uid());

CREATE POLICY "Schedules: update own"
  ON public."Schedules" FOR UPDATE
  TO authenticated
  USING ("userId" = public.mugate_uid())
  WITH CHECK ("userId" = public.mugate_uid());

CREATE POLICY "Schedules: delete own"
  ON public."Schedules" FOR DELETE
  TO authenticated
  USING ("userId" = public.mugate_uid());

-- ScheduleSections via parent Schedules
CREATE POLICY "ScheduleSections: select own"
  ON public."ScheduleSections" FOR SELECT
  TO authenticated
  USING (
    public.is_mugate_admin()
    OR EXISTS (
      SELECT 1 FROM public."Schedules" s
      WHERE s.id = "ScheduleSections"."scheduleId"
        AND s."userId" = public.mugate_uid()
    )
  );

CREATE POLICY "ScheduleSections: insert own"
  ON public."ScheduleSections" FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."Schedules" s
      WHERE s.id = "scheduleId" AND s."userId" = public.mugate_uid()
    )
  );

CREATE POLICY "ScheduleSections: delete own"
  ON public."ScheduleSections" FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Schedules" s
      WHERE s.id = "ScheduleSections"."scheduleId"
        AND s."userId" = public.mugate_uid()
    )
  );

-- ChatSessions (own, or anonymous null for authenticated create of own only)
CREATE POLICY "ChatSessions: select own"
  ON public."ChatSessions" FOR SELECT
  TO authenticated
  USING ("userId" = public.mugate_uid() OR public.is_mugate_admin());

CREATE POLICY "ChatSessions: insert own"
  ON public."ChatSessions" FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = public.mugate_uid() OR "userId" IS NULL);

CREATE POLICY "ChatSessions: update own"
  ON public."ChatSessions" FOR UPDATE
  TO authenticated
  USING ("userId" = public.mugate_uid())
  WITH CHECK ("userId" = public.mugate_uid());

CREATE POLICY "ChatSessions: delete own"
  ON public."ChatSessions" FOR DELETE
  TO authenticated
  USING ("userId" = public.mugate_uid());

-- ChatMessages via session
CREATE POLICY "ChatMessages: select own session"
  ON public."ChatMessages" FOR SELECT
  TO authenticated
  USING (
    public.is_mugate_admin()
    OR EXISTS (
      SELECT 1 FROM public."ChatSessions" s
      WHERE s.id = "ChatMessages"."sessionId"
        AND s."userId" = public.mugate_uid()
    )
  );

CREATE POLICY "ChatMessages: insert own session"
  ON public."ChatMessages" FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."ChatSessions" s
      WHERE s.id = "sessionId" AND s."userId" = public.mugate_uid()
    )
  );

CREATE POLICY "ChatMessages: delete own session"
  ON public."ChatMessages" FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."ChatSessions" s
      WHERE s.id = "ChatMessages"."sessionId"
        AND s."userId" = public.mugate_uid()
    )
  );

-- ============================================
-- ROLE: User-owned (text "userId" storing uuid string)
-- CapstonePartners / InternshipReviews / UserRoadmap
-- ============================================

CREATE POLICY "CapstonePartners: select all authenticated"
  ON public."CapstonePartners" FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "CapstonePartners: insert own"
  ON public."CapstonePartners" FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = public.mugate_uid_text());

CREATE POLICY "CapstonePartners: update own"
  ON public."CapstonePartners" FOR UPDATE
  TO authenticated
  USING ("userId" = public.mugate_uid_text() OR public.is_mugate_admin())
  WITH CHECK ("userId" = public.mugate_uid_text() OR public.is_mugate_admin());

CREATE POLICY "CapstonePartners: delete own"
  ON public."CapstonePartners" FOR DELETE
  TO authenticated
  USING ("userId" = public.mugate_uid_text() OR public.is_mugate_admin());

CREATE POLICY "InternshipReviews: select all authenticated"
  ON public."InternshipReviews" FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "InternshipReviews: insert own"
  ON public."InternshipReviews" FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = public.mugate_uid_text());

CREATE POLICY "InternshipReviews: update own"
  ON public."InternshipReviews" FOR UPDATE
  TO authenticated
  USING ("userId" = public.mugate_uid_text() OR public.is_mugate_admin())
  WITH CHECK ("userId" = public.mugate_uid_text() OR public.is_mugate_admin());

CREATE POLICY "InternshipReviews: delete own"
  ON public."InternshipReviews" FOR DELETE
  TO authenticated
  USING ("userId" = public.mugate_uid_text() OR public.is_mugate_admin());

CREATE POLICY "UserRoadmap: select own"
  ON public."UserRoadmap" FOR SELECT
  TO authenticated
  USING ("userId" = public.mugate_uid_text() OR public.is_mugate_admin());

CREATE POLICY "UserRoadmap: insert own"
  ON public."UserRoadmap" FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = public.mugate_uid_text());

CREATE POLICY "UserRoadmap: update own"
  ON public."UserRoadmap" FOR UPDATE
  TO authenticated
  USING ("userId" = public.mugate_uid_text())
  WITH CHECK ("userId" = public.mugate_uid_text());

CREATE POLICY "UserRoadmap: delete own"
  ON public."UserRoadmap" FOR DELETE
  TO authenticated
  USING ("userId" = public.mugate_uid_text());

-- ============================================
-- ROLE: Secrets / system — no client policies
-- (RLS on + no anon/authenticated policy = deny)
-- PortalCredentials, Sessions, Admins, Scraper*, ChatAnalytics
-- Backend service_role / postgres still has full access.
-- ============================================

-- Admins: only admins can read the admin list
CREATE POLICY "Admins: admin read"
  ON public."Admins" FOR SELECT
  TO authenticated
  USING (public.is_mugate_admin());

CREATE POLICY "Admins: admin write"
  ON public."Admins" FOR ALL
  TO authenticated
  USING (public.is_mugate_admin())
  WITH CHECK (public.is_mugate_admin());

-- ChatAnalytics: admin read only
CREATE POLICY "ChatAnalytics: admin read"
  ON public."ChatAnalytics" FOR SELECT
  TO authenticated
  USING (public.is_mugate_admin());

-- ScraperRuns: admin read
CREATE POLICY "ScraperRuns: admin read"
  ON public."ScraperRuns" FOR SELECT
  TO authenticated
  USING (public.is_mugate_admin());

-- PortalCredentials / Sessions / ScrapeQueue:
-- intentionally NO policies for anon/authenticated → locked to backend only
