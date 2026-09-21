-- ============================================================================
-- Kanavugal Academy — core platform + School LMS schema
-- ============================================================================
-- Scope of this migration: the shared platform (auth/profiles/roles/programs/
-- notifications) plus a fully working School LMS (grades, subjects, chapters,
-- lessons, homework, quizzes, attendance, timetable, study materials).
--
-- Design goal (spec §36, §51): "programs" and "enrollments" are generic, so
-- NEET & JEE and Montessori Teacher Training — and any future program — can
-- be added later as new rows + a handful of program-specific tables, without
-- touching this schema. Nothing here assumes only three programs exist.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Roles & profiles
-- ----------------------------------------------------------------------------

create type app_role as enum (
  'super_admin',
  'admin',
  'teacher',
  'trainer',
  'student',
  'trainee',
  'parent'
);

-- One profile per auth user. This IS the unified profile (spec §5).
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text,
  phone text,
  avatar_url text,
  date_of_birth date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A user can hold more than one role (e.g. a teacher who is also a parent).
create table user_roles (
  user_id uuid not null references profiles (id) on delete cascade,
  role app_role not null,
  primary key (user_id, role)
);

create index idx_user_roles_user on user_roles (user_id);

-- ----------------------------------------------------------------------------
-- 2. Programs & enrollments (generic — see design goal above)
-- ----------------------------------------------------------------------------

create table programs (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,              -- e.g. 'school_lms', 'neet_jee', 'montessori'
  name text not null,
  description text,
  accent_color text default '#2F6FED',
  is_active boolean not null default true,
  sort_order int not null default 0
);

create table enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  program_id uuid not null references programs (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'cancelled')),
  metadata jsonb not null default '{}'::jsonb, -- program-specific extras (e.g. track chosen)
  created_at timestamptz not null default now(),
  unique (user_id, program_id)
);

create index idx_enrollments_user on enrollments (user_id);
create index idx_enrollments_program on enrollments (program_id);

-- ----------------------------------------------------------------------------
-- 3. School structure: academic years, grades, sections, subjects, content
-- ----------------------------------------------------------------------------

create table academic_years (
  id uuid primary key default gen_random_uuid(),
  name text not null,              -- '2026-2027'
  start_date date not null,
  end_date date not null,
  is_current boolean not null default false
);

create table grades (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs (id) on delete cascade,
  name text not null,              -- 'Grade 1' ... 'Grade 12'
  level int not null,              -- 1..12 for sorting/progression
  unique (program_id, level)
);

create table sections (
  id uuid primary key default gen_random_uuid(),
  grade_id uuid not null references grades (id) on delete cascade,
  academic_year_id uuid not null references academic_years (id) on delete cascade,
  name text not null                -- 'A', 'B'...
);

-- Admin-configurable subjects (spec §6 — not hard-coded).
create table subjects (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs (id) on delete cascade,
  grade_id uuid references grades (id) on delete set null,
  name text not null,
  color text default '#2F6FED'
);

create table chapters (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects (id) on delete cascade,
  title text not null,
  sort_order int not null default 0
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references chapters (id) on delete cascade,
  title text not null,
  content_type text not null default 'notes' check (content_type in ('video', 'notes', 'document', 'audio', 'presentation')),
  content_url text,
  body text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. People: student/teacher/parent linkage
-- ----------------------------------------------------------------------------

create table student_profiles (
  user_id uuid primary key references profiles (id) on delete cascade,
  grade_id uuid references grades (id) on delete set null,
  section_id uuid references sections (id) on delete set null,
  academic_year_id uuid references academic_years (id) on delete set null,
  roll_number text
);

create table parent_links (
  parent_id uuid not null references profiles (id) on delete cascade,
  student_id uuid not null references profiles (id) on delete cascade,
  relationship text default 'guardian',
  primary key (parent_id, student_id)
);

create table teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles (id) on delete cascade,
  grade_id uuid not null references grades (id) on delete cascade,
  section_id uuid references sections (id) on delete cascade,
  subject_id uuid not null references subjects (id) on delete cascade,
  academic_year_id uuid not null references academic_years (id) on delete cascade
);

create index idx_teacher_assignments_teacher on teacher_assignments (teacher_id);

-- ----------------------------------------------------------------------------
-- 5. Timetable & attendance
-- ----------------------------------------------------------------------------

create table timetable_entries (
  id uuid primary key default gen_random_uuid(),
  grade_id uuid not null references grades (id) on delete cascade,
  section_id uuid not null references sections (id) on delete cascade,
  subject_id uuid not null references subjects (id) on delete cascade,
  teacher_id uuid references profiles (id) on delete set null,
  academic_year_id uuid not null references academic_years (id) on delete cascade,
  day_of_week int not null check (day_of_week between 1 and 7), -- 1 = Monday
  period int not null,
  start_time time not null,
  end_time time not null,
  room text
);

create index idx_timetable_section on timetable_entries (section_id, day_of_week);

create table attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles (id) on delete cascade,
  grade_id uuid not null references grades (id) on delete cascade,
  section_id uuid not null references sections (id) on delete cascade,
  date date not null,
  status text not null check (status in ('present', 'absent', 'late', 'excused')),
  marked_by uuid references profiles (id) on delete set null,
  remarks text,
  created_at timestamptz not null default now(),
  unique (student_id, date)
);

create index idx_attendance_student on attendance_records (student_id, date);
create index idx_attendance_section on attendance_records (section_id, date);

-- ----------------------------------------------------------------------------
-- 6. Homework
-- ----------------------------------------------------------------------------

create table homework (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles (id) on delete cascade,
  subject_id uuid not null references subjects (id) on delete cascade,
  chapter_id uuid references chapters (id) on delete set null,
  grade_id uuid not null references grades (id) on delete cascade,
  section_id uuid not null references sections (id) on delete cascade,
  title text not null,
  description text,
  instructions text,
  due_date timestamptz not null,
  max_marks numeric,
  submission_type text not null default 'any' check (submission_type in ('text', 'pdf', 'image', 'document', 'video', 'any')),
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_homework_section on homework (section_id, due_date);

create table homework_submissions (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references homework (id) on delete cascade,
  student_id uuid not null references profiles (id) on delete cascade,
  content_text text,
  attachments jsonb not null default '[]'::jsonb,
  submitted_at timestamptz,
  status text not null default 'assigned' check (
    status in ('assigned', 'submitted', 'late', 'evaluated', 'returned', 'resubmission_required')
  ),
  marks_awarded numeric,
  feedback text,
  evaluated_by uuid references profiles (id) on delete set null,
  evaluated_at timestamptz,
  unique (homework_id, student_id)
);

create index idx_homework_submissions_student on homework_submissions (student_id);

-- ----------------------------------------------------------------------------
-- 7. Quizzes (weekly quiz system)
-- ----------------------------------------------------------------------------

create table quizzes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles (id) on delete cascade,
  subject_id uuid not null references subjects (id) on delete cascade,
  chapter_id uuid references chapters (id) on delete set null,
  grade_id uuid not null references grades (id) on delete cascade,
  section_id uuid not null references sections (id) on delete cascade,
  title text not null,
  description text,
  timer_seconds int not null default 600,
  shuffle_questions boolean not null default true,
  is_published boolean not null default false,
  available_from timestamptz,
  available_to timestamptz,
  created_at timestamptz not null default now()
);

create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes (id) on delete cascade,
  question_type text not null check (
    question_type in ('mcq', 'multiple_answer', 'true_false', 'fill_blank', 'numerical', 'short_answer')
  ),
  question_text text not null,
  options jsonb not null default '[]'::jsonb,        -- [{id, text}] for mcq/multi/true-false
  correct_answer jsonb not null,                       -- shape depends on question_type
  explanation text,
  marks numeric not null default 1,
  sort_order int not null default 0
);

create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes (id) on delete cascade,
  student_id uuid not null references profiles (id) on delete cascade,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  answers jsonb not null default '{}'::jsonb,          -- { question_id: answer }
  score numeric,
  max_score numeric,
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted', 'auto_submitted')),
  unique (quiz_id, student_id)
);

-- ----------------------------------------------------------------------------
-- 8. Study materials, mistake book, recommendations (shared platform features)
-- ----------------------------------------------------------------------------

create table study_materials (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects (id) on delete cascade,
  chapter_id uuid references chapters (id) on delete cascade,
  lesson_id uuid references lessons (id) on delete cascade,
  title text not null,
  type text not null check (type in ('pdf', 'video', 'audio', 'image', 'presentation', 'document', 'notes', 'worksheet', 'question_paper')),
  url text not null,
  uploaded_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table mistakes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles (id) on delete cascade,
  source_type text not null check (source_type in ('quiz', 'exam', 'practice')),
  source_id uuid not null,
  question_text text not null,
  student_answer jsonb,
  correct_answer jsonb,
  explanation text,
  subject_id uuid references subjects (id) on delete set null,
  chapter_id uuid references chapters (id) on delete set null,
  is_mastered boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 9. Notifications & announcements
-- ----------------------------------------------------------------------------

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  type text not null,     -- 'homework_new', 'homework_due', 'quiz', 'attendance_low', ...
  title text not null,
  body text,
  data jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on notifications (user_id, is_read);

create table announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles (id) on delete set null,
  program_id uuid references programs (id) on delete cascade,
  grade_id uuid references grades (id) on delete cascade,
  section_id uuid references sections (id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 10. Certificates (used by any program that issues them, e.g. Montessori)
-- ----------------------------------------------------------------------------

create table certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  program_id uuid not null references programs (id) on delete cascade,
  title text not null,
  issued_at timestamptz not null default now(),
  certificate_code text not null unique,
  verification_url text
);

-- ----------------------------------------------------------------------------
-- 11. Audit log
-- ----------------------------------------------------------------------------

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 12. Seed the three launch programs
-- ----------------------------------------------------------------------------

insert into programs (key, name, description, accent_color, sort_order) values
  ('school_lms', 'School LMS', 'Grades 1–12 curriculum, homework, quizzes and attendance.', '#2F6FED', 1),
  ('neet_jee', 'NEET & JEE Program', 'Foundation and preparation pathways for NEET and JEE.', '#E0562B', 2),
  ('montessori', 'Montessori Teacher Training', 'Professional Montessori teacher certification program.', '#2FA66A', 3);

-- ============================================================================
-- Row Level Security
-- ============================================================================

create or replace function auth_has_role(target_role app_role)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid() and role = target_role
  );
$$;

create or replace function auth_is_staff()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid() and role in ('super_admin', 'admin')
  );
$$;

create or replace function auth_is_teacher_of_section(target_section uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from teacher_assignments
    where teacher_id = auth.uid() and section_id = target_section
  );
$$;

create or replace function auth_is_parent_of(target_student uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from parent_links
    where parent_id = auth.uid() and student_id = target_student
  );
$$;

alter table profiles enable row level security;
alter table user_roles enable row level security;
alter table programs enable row level security;
alter table enrollments enable row level security;
alter table academic_years enable row level security;
alter table grades enable row level security;
alter table sections enable row level security;
alter table subjects enable row level security;
alter table chapters enable row level security;
alter table lessons enable row level security;
alter table student_profiles enable row level security;
alter table parent_links enable row level security;
alter table teacher_assignments enable row level security;
alter table timetable_entries enable row level security;
alter table attendance_records enable row level security;
alter table homework enable row level security;
alter table homework_submissions enable row level security;
alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_attempts enable row level security;
alter table study_materials enable row level security;
alter table mistakes enable row level security;
alter table notifications enable row level security;
alter table announcements enable row level security;
alter table certificates enable row level security;
alter table audit_logs enable row level security;

-- Profiles: everyone can read their own; staff can read/update all; a user
-- can update their own non-role fields.
create policy "profiles_self_select" on profiles for select using (id = auth.uid() or auth_is_staff());
create policy "profiles_self_update" on profiles for update using (id = auth.uid() or auth_is_staff());
create policy "profiles_staff_insert" on profiles for insert with check (id = auth.uid() or auth_is_staff());

create policy "user_roles_select" on user_roles for select using (user_id = auth.uid() or auth_is_staff());
create policy "user_roles_staff_write" on user_roles for all using (auth_is_staff()) with check (auth_is_staff());

-- Reference/catalog data: readable by any authenticated user, writable by staff.
create policy "programs_read" on programs for select using (auth.role() = 'authenticated');
create policy "programs_staff_write" on programs for all using (auth_is_staff()) with check (auth_is_staff());

create policy "academic_years_read" on academic_years for select using (auth.role() = 'authenticated');
create policy "academic_years_staff_write" on academic_years for all using (auth_is_staff()) with check (auth_is_staff());

create policy "grades_read" on grades for select using (auth.role() = 'authenticated');
create policy "grades_staff_write" on grades for all using (auth_is_staff()) with check (auth_is_staff());

create policy "sections_read" on sections for select using (auth.role() = 'authenticated');
create policy "sections_staff_write" on sections for all using (auth_is_staff()) with check (auth_is_staff());

create policy "subjects_read" on subjects for select using (auth.role() = 'authenticated');
create policy "subjects_staff_write" on subjects for all using (auth_is_staff()) with check (auth_is_staff());

create policy "chapters_read" on chapters for select using (auth.role() = 'authenticated');
create policy "chapters_staff_write" on chapters for all using (auth_is_staff()) with check (auth_is_staff());

create policy "lessons_read" on lessons for select using (auth.role() = 'authenticated');
create policy "lessons_staff_write" on lessons for all using (auth_is_staff()) with check (auth_is_staff());

create policy "study_materials_read" on study_materials for select using (auth.role() = 'authenticated');
create policy "study_materials_write" on study_materials for all using (auth_is_staff()) with check (auth_is_staff());

-- Enrollments: user sees own; staff sees all.
create policy "enrollments_select" on enrollments for select using (user_id = auth.uid() or auth_is_staff());
create policy "enrollments_staff_write" on enrollments for all using (auth_is_staff()) with check (auth_is_staff());

-- Student profiles: self, parent of the student, teacher of their section, or staff.
create policy "student_profiles_select" on student_profiles for select using (
  user_id = auth.uid()
  or auth_is_parent_of(user_id)
  or auth_is_teacher_of_section(section_id)
  or auth_is_staff()
);
create policy "student_profiles_staff_write" on student_profiles for all using (auth_is_staff()) with check (auth_is_staff());

create policy "parent_links_select" on parent_links for select using (
  parent_id = auth.uid() or student_id = auth.uid() or auth_is_staff()
);
create policy "parent_links_staff_write" on parent_links for all using (auth_is_staff()) with check (auth_is_staff());

create policy "teacher_assignments_select" on teacher_assignments for select using (
  teacher_id = auth.uid() or auth_is_staff()
);
create policy "teacher_assignments_staff_write" on teacher_assignments for all using (auth_is_staff()) with check (auth_is_staff());

-- Timetable: any authenticated user can read (students/parents view their own
-- personalized slice client-side); staff manage.
create policy "timetable_read" on timetable_entries for select using (auth.role() = 'authenticated');
create policy "timetable_write" on timetable_entries for all using (
  auth_is_staff() or auth_is_teacher_of_section(section_id)
) with check (auth_is_staff() or auth_is_teacher_of_section(section_id));

-- Attendance: student sees own, parent sees child's, teacher manages their
-- section, staff sees all.
create policy "attendance_select" on attendance_records for select using (
  student_id = auth.uid()
  or auth_is_parent_of(student_id)
  or auth_is_teacher_of_section(section_id)
  or auth_is_staff()
);
create policy "attendance_write" on attendance_records for insert with check (
  auth_is_teacher_of_section(section_id) or auth_is_staff()
);
create policy "attendance_update" on attendance_records for update using (
  auth_is_teacher_of_section(section_id) or auth_is_staff()
);

-- Homework: teacher who owns it + staff can write; student/parent/teacher of
-- the section can read.
create policy "homework_select" on homework for select using (
  teacher_id = auth.uid()
  or auth_is_teacher_of_section(section_id)
  or auth_is_staff()
  or exists (
    select 1 from student_profiles sp
    where sp.user_id = auth.uid() and sp.section_id = homework.section_id
  )
  or exists (
    select 1 from student_profiles sp
    join parent_links pl on pl.student_id = sp.user_id
    where pl.parent_id = auth.uid() and sp.section_id = homework.section_id
  )
);
create policy "homework_write" on homework for insert with check (
  teacher_id = auth.uid() or auth_is_staff()
);
create policy "homework_update" on homework for update using (
  teacher_id = auth.uid() or auth_is_staff()
);
create policy "homework_delete" on homework for delete using (
  teacher_id = auth.uid() or auth_is_staff()
);

-- Homework submissions: student owns their submission; teacher of the
-- homework's section can read/evaluate; parent can read.
create policy "hw_submissions_select" on homework_submissions for select using (
  student_id = auth.uid()
  or auth_is_parent_of(student_id)
  or auth_is_staff()
  or exists (
    select 1 from homework h where h.id = homework_submissions.homework_id
    and (h.teacher_id = auth.uid() or auth_is_teacher_of_section(h.section_id))
  )
);
create policy "hw_submissions_student_write" on homework_submissions for insert with check (student_id = auth.uid());
create policy "hw_submissions_student_update" on homework_submissions for update using (
  student_id = auth.uid()
  or auth_is_staff()
  or exists (
    select 1 from homework h where h.id = homework_submissions.homework_id
    and (h.teacher_id = auth.uid() or auth_is_teacher_of_section(h.section_id))
  )
);

-- Quizzes / questions: same access model as homework. Students only see
-- published quizzes; question correct_answer is still fetched (Postgres RLS
-- is row-level, not column-level) — the API layer must avoid leaking
-- correct_answer to students before submission (see src/api/quizzes.ts).
create policy "quizzes_select" on quizzes for select using (
  teacher_id = auth.uid()
  or auth_is_staff()
  or (is_published and (
    exists (select 1 from student_profiles sp where sp.user_id = auth.uid() and sp.section_id = quizzes.section_id)
    or auth_is_teacher_of_section(section_id)
  ))
);
create policy "quizzes_write" on quizzes for all using (
  teacher_id = auth.uid() or auth_is_staff()
) with check (teacher_id = auth.uid() or auth_is_staff());

create policy "quiz_questions_select" on quiz_questions for select using (
  exists (
    select 1 from quizzes q where q.id = quiz_questions.quiz_id
    and (q.teacher_id = auth.uid() or auth_is_staff() or q.is_published)
  )
);
create policy "quiz_questions_write" on quiz_questions for all using (
  exists (select 1 from quizzes q where q.id = quiz_questions.quiz_id and (q.teacher_id = auth.uid() or auth_is_staff()))
) with check (
  exists (select 1 from quizzes q where q.id = quiz_questions.quiz_id and (q.teacher_id = auth.uid() or auth_is_staff()))
);

create policy "quiz_attempts_select" on quiz_attempts for select using (
  student_id = auth.uid()
  or auth_is_parent_of(student_id)
  or auth_is_staff()
  or exists (select 1 from quizzes q where q.id = quiz_attempts.quiz_id and q.teacher_id = auth.uid())
);
create policy "quiz_attempts_write" on quiz_attempts for insert with check (student_id = auth.uid());
create policy "quiz_attempts_update" on quiz_attempts for update using (student_id = auth.uid() or auth_is_staff());

-- Mistake book: student-owned.
create policy "mistakes_select" on mistakes for select using (student_id = auth.uid() or auth_is_staff());
create policy "mistakes_write" on mistakes for all using (student_id = auth.uid() or auth_is_staff())
  with check (student_id = auth.uid() or auth_is_staff());

-- Notifications: user-owned.
create policy "notifications_select" on notifications for select using (user_id = auth.uid());
create policy "notifications_update" on notifications for update using (user_id = auth.uid());
create policy "notifications_system_insert" on notifications for insert with check (true);

create policy "announcements_read" on announcements for select using (auth.role() = 'authenticated');
create policy "announcements_write" on announcements for all using (auth_is_staff()) with check (auth_is_staff());

create policy "certificates_select" on certificates for select using (user_id = auth.uid() or auth_is_staff());
create policy "certificates_write" on certificates for all using (auth_is_staff()) with check (auth_is_staff());
-- Public verification is handled via a SECURITY DEFINER RPC (verify_certificate), not direct table access.

create policy "audit_logs_staff_only" on audit_logs for select using (auth_is_staff());
create policy "audit_logs_insert" on audit_logs for insert with check (true);

-- Public certificate verification (no auth required) — returns minimal info only.
create or replace function verify_certificate(code text)
returns table (title text, full_name text, program_name text, issued_at timestamptz)
language sql
security definer
stable
as $$
  select c.title, p.full_name, pr.name, c.issued_at
  from certificates c
  join profiles p on p.id = c.user_id
  join programs pr on pr.id = c.program_id
  where c.certificate_code = code;
$$;

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
