-- 1. Create Security Definer Helper Functions to bypass RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role(p_class_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT role::text 
    FROM re_class_memberships 
    WHERE user_id = auth.uid() AND class_id = p_class_id
    LIMIT 1
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_classes()
RETURNS TABLE (class_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT cm.class_id 
  FROM re_class_memberships cm
  WHERE cm.user_id = auth.uid();
END;
$$;

-- 2. Enable Row-Level Security (RLS) on all tables
ALTER TABLE public.re_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_class_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_class_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Define RLS Policies

-- Departments & Programmes (Read-only for authenticated users)
CREATE POLICY select_departments ON public.re_departments FOR SELECT TO authenticated USING (true);
CREATE POLICY select_programmes ON public.re_programmes FOR SELECT TO authenticated USING (true);

-- Rooms (Read-only for authenticated users)
CREATE POLICY select_rooms ON public.re_rooms FOR SELECT TO authenticated USING (true);

-- Classes
CREATE POLICY select_classes ON public.re_classes FOR SELECT TO authenticated USING (
  get_user_role(id) IS NOT NULL
);
CREATE POLICY write_classes ON public.re_classes FOR ALL TO authenticated USING (
  get_user_role(id) = 'tutor'
) WITH CHECK (
  get_user_role(id) = 'tutor'
);

-- Class Memberships
CREATE POLICY select_class_memberships ON public.re_class_memberships FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR get_user_role(class_id) IS NOT NULL
);
CREATE POLICY write_class_memberships ON public.re_class_memberships FOR ALL TO authenticated USING (
  get_user_role(class_id) = 'tutor'
) WITH CHECK (
  get_user_role(class_id) = 'tutor'
);

-- Class Roster
CREATE POLICY select_class_roster ON public.re_class_roster FOR SELECT TO authenticated USING (
  email = (select email from auth.users where id = auth.uid()) OR get_user_role(class_id) IN ('tutor', 'cr')
);
CREATE POLICY write_class_roster ON public.re_class_roster FOR ALL TO authenticated USING (
  get_user_role(class_id) IN ('tutor', 'cr')
) WITH CHECK (
  get_user_role(class_id) IN ('tutor', 'cr')
);

-- Timetable Entries
CREATE POLICY select_timetable ON public.re_timetable_entries FOR SELECT TO authenticated USING (
  get_user_role(class_id) IS NOT NULL
);
CREATE POLICY write_timetable ON public.re_timetable_entries FOR ALL TO authenticated USING (
  get_user_role(class_id) IN ('tutor', 'cr')
) WITH CHECK (
  get_user_role(class_id) IN ('tutor', 'cr')
);

-- Sessions
CREATE POLICY select_sessions ON public.re_sessions FOR SELECT TO authenticated USING (
  get_user_role(class_id) IS NOT NULL
);
CREATE POLICY write_sessions ON public.re_sessions FOR ALL TO authenticated USING (
  get_user_role(class_id) IN ('tutor', 'cr')
) WITH CHECK (
  get_user_role(class_id) IN ('tutor', 'cr')
);

-- Event Participants
CREATE POLICY select_event_participants ON public.re_event_participants FOR SELECT TO authenticated USING (
  student_id = auth.uid() OR get_user_role((select class_id from public.re_sessions where id = session_id)) IN ('tutor', 'cr')
);
CREATE POLICY write_event_participants ON public.re_event_participants FOR ALL TO authenticated USING (
  get_user_role((select class_id from public.re_sessions where id = session_id)) IN ('tutor', 'cr')
) WITH CHECK (
  get_user_role((select class_id from public.re_sessions where id = session_id)) IN ('tutor', 'cr')
);

-- Attendance Records
CREATE POLICY select_attendance ON public.re_attendance_records FOR SELECT TO authenticated USING (
  student_id = auth.uid() OR get_user_role((select class_id from public.re_sessions where id = session_id)) IN ('tutor', 'cr')
);
CREATE POLICY insert_attendance ON public.re_attendance_records FOR INSERT TO authenticated WITH CHECK (
  student_id = auth.uid() OR get_user_role((select class_id from public.re_sessions where id = session_id)) IN ('tutor', 'cr')
);
CREATE POLICY update_attendance ON public.re_attendance_records FOR UPDATE TO authenticated USING (
  get_user_role((select class_id from public.re_sessions where id = session_id)) IN ('tutor', 'cr')
) WITH CHECK (
  get_user_role((select class_id from public.re_sessions where id = session_id)) IN ('tutor', 'cr')
);
CREATE POLICY delete_attendance ON public.re_attendance_records FOR DELETE TO authenticated USING (
  get_user_role((select class_id from public.re_sessions where id = session_id)) IN ('tutor', 'cr')
);

-- Announcements
CREATE POLICY select_announcements ON public.re_announcements FOR SELECT TO authenticated USING (
  get_user_role(class_id) IS NOT NULL
);
CREATE POLICY write_announcements ON public.re_announcements FOR ALL TO authenticated USING (
  get_user_role(class_id) IN ('tutor', 'cr')
) WITH CHECK (
  get_user_role(class_id) IN ('tutor', 'cr')
);

-- Push Subscriptions
CREATE POLICY manage_own_subscriptions ON public.re_push_subscriptions FOR ALL TO authenticated USING (
  user_id = auth.uid()
) WITH CHECK (
  user_id = auth.uid()
);

-- 4. Enable Supabase Realtime for re_attendance_records table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.re_attendance_records;
  ELSE
    CREATE PUBLICATION supabase_realtime FOR TABLE public.re_attendance_records;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not configure realtime replication publication';
END;
$$;
