// Hand-written types mirroring supabase/migrations/0001_init.sql.
// Once you have a live Supabase project, you can replace this file with
// generated types via:
//   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
// (the app code only relies on the row shapes below, so a generated file is
// a drop-in upgrade, not a rewrite.)

export type AppRole =
  | "super_admin"
  | "admin"
  | "teacher"
  | "trainer"
  | "student"
  | "trainee"
  | "parent";

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
}

export interface Program {
  id: string;
  key: string;
  name: string;
  description: string | null;
  accent_color: string;
  is_active: boolean;
  sort_order: number;
}

export interface Enrollment {
  id: string;
  user_id: string;
  program_id: string;
  status: "active" | "paused" | "completed" | "cancelled";
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface Grade {
  id: string;
  program_id: string;
  name: string;
  level: number;
}

export interface Section {
  id: string;
  grade_id: string;
  academic_year_id: string;
  name: string;
}

export interface Subject {
  id: string;
  program_id: string;
  grade_id: string | null;
  name: string;
  color: string;
}

export interface Chapter {
  id: string;
  subject_id: string;
  title: string;
  sort_order: number;
}

export type LessonContentType =
  | "video"
  | "notes"
  | "document"
  | "audio"
  | "presentation";

export interface Lesson {
  id: string;
  chapter_id: string;
  title: string;
  content_type: LessonContentType;
  content_url: string | null;
  body: string | null;
  sort_order: number;
  created_at: string;
}

export interface StudentProfile {
  user_id: string;
  grade_id: string | null;
  section_id: string | null;
  academic_year_id: string | null;
  roll_number: string | null;
}

export interface TeacherAssignment {
  id: string;
  teacher_id: string;
  grade_id: string;
  section_id: string | null;
  subject_id: string;
  academic_year_id: string;
}

export interface TimetableEntry {
  id: string;
  grade_id: string;
  section_id: string;
  subject_id: string;
  teacher_id: string | null;
  academic_year_id: string;
  day_of_week: number; // 1 = Monday
  period: number;
  start_time: string;
  end_time: string;
  room: string | null;
  // joined client-side for display:
  subject?: Subject;
}

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface AttendanceRecord {
  id: string;
  student_id: string;
  grade_id: string;
  section_id: string;
  date: string;
  status: AttendanceStatus;
  marked_by: string | null;
  remarks: string | null;
  created_at: string;
}

export type HomeworkSubmissionType =
  | "text"
  | "pdf"
  | "image"
  | "document"
  | "video"
  | "any";

export interface Homework {
  id: string;
  teacher_id: string;
  subject_id: string;
  chapter_id: string | null;
  grade_id: string;
  section_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  due_date: string;
  max_marks: number | null;
  submission_type: HomeworkSubmissionType;
  attachments: { name: string; url: string }[];
  created_at: string;
  // joined:
  subject?: Subject;
  my_submission?: HomeworkSubmission | null;
}

export type HomeworkStatus =
  | "assigned"
  | "submitted"
  | "late"
  | "evaluated"
  | "returned"
  | "resubmission_required";

export interface HomeworkSubmission {
  id: string;
  homework_id: string;
  student_id: string;
  content_text: string | null;
  attachments: { name: string; url: string }[];
  submitted_at: string | null;
  status: HomeworkStatus;
  marks_awarded: number | null;
  feedback: string | null;
  evaluated_by: string | null;
  evaluated_at: string | null;
}

export type QuestionType =
  | "mcq"
  | "multiple_answer"
  | "true_false"
  | "fill_blank"
  | "numerical"
  | "short_answer";

export interface QuizOption {
  id: string;
  text: string;
}

export interface Quiz {
  id: string;
  teacher_id: string;
  subject_id: string;
  chapter_id: string | null;
  grade_id: string;
  section_id: string;
  title: string;
  description: string | null;
  timer_seconds: number;
  shuffle_questions: boolean;
  is_published: boolean;
  available_from: string | null;
  available_to: string | null;
  created_at: string;
  subject?: Subject;
  question_count?: number;
  my_attempt?: QuizAttempt | null;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_type: QuestionType;
  question_text: string;
  options: QuizOption[];
  correct_answer: unknown; // withheld from students until after submission
  explanation: string | null;
  marks: number;
  sort_order: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  started_at: string;
  submitted_at: string | null;
  answers: Record<string, unknown>;
  score: number | null;
  max_score: number | null;
  status: "in_progress" | "submitted" | "auto_submitted";
}

export interface StudyMaterial {
  id: string;
  subject_id: string | null;
  chapter_id: string | null;
  lesson_id: string | null;
  title: string;
  type:
    | "pdf"
    | "video"
    | "audio"
    | "image"
    | "presentation"
    | "document"
    | "notes"
    | "worksheet"
    | "question_paper";
  url: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface Mistake {
  id: string;
  student_id: string;
  source_type: "quiz" | "exam" | "practice";
  source_id: string;
  question_text: string;
  student_answer: unknown;
  correct_answer: unknown;
  explanation: string | null;
  subject_id: string | null;
  chapter_id: string | null;
  is_mastered: boolean;
  notes: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  program_id: string;
  title: string;
  issued_at: string;
  certificate_code: string;
  verification_url: string | null;
}

// Minimal Supabase generic Database type so `createClient<Database>` type-checks.
// Left permissive (each table = Row shape with partial Insert/Update) rather
// than the full generated form, to avoid hand-maintaining every variant.
export interface Database {
  public: {
    Tables: Record<string, { Row: any; Insert: any; Update: any }>;
    Views: Record<string, { Row: any }>;
    Functions: Record<string, { Args: any; Returns: any }>;
  };
}
