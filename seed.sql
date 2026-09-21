-- ============================================================================
-- Sample data for local development.
-- Run AFTER 0001_init.sql, and AFTER you have created at least one user via
-- Supabase Auth (sign up through the app, or Supabase Studio > Authentication).
-- Replace the placeholder UUIDs below with real auth.users ids before running,
-- or use the accompanying scripts/seed.ts (Node) which does this for you.
-- ============================================================================

do $$
declare
  v_school_id uuid;
  v_year_id uuid;
  v_grade10_id uuid;
  v_section_id uuid;
  v_math_id uuid;
  v_physics_id uuid;
  v_chapter_id uuid;
begin
  select id into v_school_id from programs where key = 'school_lms';

  insert into academic_years (name, start_date, end_date, is_current)
  values ('2026-2027', '2026-06-01', '2027-04-30', true)
  returning id into v_year_id;

  insert into grades (program_id, name, level) values
    (v_school_id, 'Grade 1', 1), (v_school_id, 'Grade 2', 2), (v_school_id, 'Grade 3', 3),
    (v_school_id, 'Grade 4', 4), (v_school_id, 'Grade 5', 5), (v_school_id, 'Grade 6', 6),
    (v_school_id, 'Grade 7', 7), (v_school_id, 'Grade 8', 8), (v_school_id, 'Grade 9', 9),
    (v_school_id, 'Grade 10', 10), (v_school_id, 'Grade 11', 11), (v_school_id, 'Grade 12', 12);

  select id into v_grade10_id from grades where program_id = v_school_id and level = 10;

  insert into sections (grade_id, academic_year_id, name)
  values (v_grade10_id, v_year_id, 'A')
  returning id into v_section_id;

  insert into subjects (program_id, grade_id, name, color) values
    (v_school_id, v_grade10_id, 'Mathematics', '#2F6FED'),
    (v_school_id, v_grade10_id, 'Physics', '#E0562B'),
    (v_school_id, v_grade10_id, 'Chemistry', '#2FA66A'),
    (v_school_id, v_grade10_id, 'Biology', '#8A4FD9'),
    (v_school_id, v_grade10_id, 'English', '#D9A441')
  returning id into v_math_id;

  select id into v_physics_id from subjects where grade_id = v_grade10_id and name = 'Physics';

  insert into chapters (subject_id, title, sort_order) values
    (v_physics_id, 'Laws of Reflection', 1),
    (v_physics_id, 'Refraction of Light', 2),
    (v_physics_id, 'Human Eye', 3)
  returning id into v_chapter_id;

  insert into lessons (chapter_id, title, content_type, body, sort_order) values
    (v_chapter_id, 'Introduction to Reflection', 'notes', 'Light reflects off a surface such that the angle of incidence equals the angle of reflection.', 1),
    (v_chapter_id, 'Plane vs Curved Mirrors', 'notes', 'Plane mirrors form virtual, upright images; curved mirrors can magnify or reduce.', 2);

  insert into timetable_entries (grade_id, section_id, subject_id, academic_year_id, day_of_week, period, start_time, end_time, room)
  values
    (v_grade10_id, v_section_id, v_math_id, v_year_id, 1, 1, '09:00', '09:45', 'Room 101'),
    (v_grade10_id, v_section_id, v_physics_id, v_year_id, 1, 2, '09:45', '10:30', 'Room 101');

  raise notice 'Seed complete for section %', v_section_id;
end $$;
