// Data-access layer for the School LMS. Screens call these instead of
// talking to `supabase` directly, so the query shape lives in one place.
import { supabase } from "@/lib/supabase";
import type {
  AttendanceRecord,
  Chapter,
  Homework,
  HomeworkSubmission,
  Lesson,
  Quiz,
  QuizAttempt,
  QuizQuestion,
  StudentProfile,
  Subject,
  StudyMaterial,
  TimetableEntry,
} from "@/types/database";

export async function getMyStudentProfile(userId: string): Promise<StudentProfile | null> {
  const { data, error } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as StudentProfile | null;
}

export async function getSubjects(gradeId: string): Promise<Subject[]> {
  const { data, error } = await supabase.from("subjects").select("*").eq("grade_id", gradeId).order("name");
  if (error) throw error;
  return (data as Subject[]) ?? [];
}

export async function getChapters(subjectId: string): Promise<Chapter[]> {
  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("subject_id", subjectId)
    .order("sort_order");
  if (error) throw error;
  return (data as Chapter[]) ?? [];
}

export async function getLessons(chapterId: string): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("chapter_id", chapterId)
    .order("sort_order");
  if (error) throw error;
  return (data as Lesson[]) ?? [];
}

export async function getHomeworkForSection(
  sectionId: string,
  studentId: string
): Promise<Homework[]> {
  const { data, error } = await supabase
    .from("homework")
    .select("*, subject:subjects(*), my_submission:homework_submissions(*)")
    .eq("section_id", sectionId)
    .order("due_date", { ascending: true });
  if (error) throw error;
  return ((data as any[]) ?? []).map((row) => ({
    ...row,
    my_submission:
      (row.my_submission as any[])?.find((s: any) => s.student_id === studentId) ?? null,
  })) as Homework[];
}

export async function submitHomework(params: {
  homeworkId: string;
  studentId: string;
  contentText?: string;
  attachments?: { name: string; url: string }[];
}): Promise<HomeworkSubmission> {
  const { data, error } = await supabase
    .from("homework_submissions")
    .upsert(
      {
        homework_id: params.homeworkId,
        student_id: params.studentId,
        content_text: params.contentText ?? null,
        attachments: params.attachments ?? [],
        submitted_at: new Date().toISOString(),
        status: "submitted",
      },
      { onConflict: "homework_id,student_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data as HomeworkSubmission;
}

export async function evaluateHomework(params: {
  submissionId: string;
  marksAwarded: number;
  feedback?: string;
  evaluatorId: string;
}): Promise<void> {
  const { error } = await supabase
    .from("homework_submissions")
    .update({
      marks_awarded: params.marksAwarded,
      feedback: params.feedback ?? null,
      status: "evaluated",
      evaluated_by: params.evaluatorId,
      evaluated_at: new Date().toISOString(),
    })
    .eq("id", params.submissionId);
  if (error) throw error;
}

export async function createHomework(payload: Partial<Homework>): Promise<Homework> {
  const { data, error } = await supabase.from("homework").insert(payload).select().single();
  if (error) throw error;
  return data as Homework;
}

export async function getQuizzesForSection(
  sectionId: string,
  studentId: string
): Promise<Quiz[]> {
  const { data, error } = await supabase
    .from("quizzes")
    .select("*, subject:subjects(*), my_attempt:quiz_attempts(*)")
    .eq("section_id", sectionId)
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data as any[]) ?? []).map((row) => ({
    ...row,
    my_attempt: (row.my_attempt as any[])?.find((a: any) => a.student_id === studentId) ?? null,
  })) as Quiz[];
}

export async function createQuiz(
  quiz: Partial<Quiz>,
  questions: Omit<QuizQuestion, "id" | "quiz_id">[]
): Promise<Quiz> {
  const { data: created, error } = await supabase.from("quizzes").insert(quiz).select().single();
  if (error) throw error;
  const quizRow = created as Quiz;
  if (questions.length) {
    const { error: qError } = await supabase
      .from("quiz_questions")
      .insert(questions.map((q) => ({ ...q, quiz_id: quizRow.id })));
    if (qError) throw qError;
  }
  return quizRow;
}

export async function getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
  const { data, error } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("quiz_id", quizId)
    .order("sort_order");
  if (error) throw error;
  return (data as QuizQuestion[]) ?? [];
}

export async function startQuizAttempt(quizId: string, studentId: string): Promise<QuizAttempt> {
  const { data: existing } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("quiz_id", quizId)
    .eq("student_id", studentId)
    .maybeSingle();
  if (existing) return existing as QuizAttempt;

  const { data, error } = await supabase
    .from("quiz_attempts")
    .insert({ quiz_id: quizId, student_id: studentId, status: "in_progress" })
    .select()
    .single();
  if (error) throw error;
  return data as QuizAttempt;
}

/**
 * Auto-grades objective question types client-side (mcq / multiple_answer /
 * true_false / numerical / fill_blank) and stores the result. `short_answer`
 * questions are left ungraded (score contribution 0) for manual teacher
 * review — a production build would flag those for the teacher dashboard.
 */
export function gradeQuiz(
  questions: QuizQuestion[],
  answers: Record<string, unknown>
): { score: number; maxScore: number; correctCount: number } {
  let score = 0;
  let maxScore = 0;
  let correctCount = 0;

  for (const q of questions) {
    maxScore += q.marks;
    const given = answers[q.id];
    if (given === undefined || given === null) continue;

    let isCorrect = false;
    switch (q.question_type) {
      case "mcq":
      case "true_false":
        isCorrect = given === q.correct_answer;
        break;
      case "multiple_answer": {
        const correctSet = new Set(q.correct_answer as string[]);
        const givenSet = new Set(given as string[]);
        isCorrect =
          correctSet.size === givenSet.size &&
          [...correctSet].every((v) => givenSet.has(v));
        break;
      }
      case "numerical":
        isCorrect = Number(given) === Number(q.correct_answer);
        break;
      case "fill_blank":
        isCorrect =
          String(given).trim().toLowerCase() ===
          String(q.correct_answer).trim().toLowerCase();
        break;
      case "short_answer":
      default:
        isCorrect = false; // needs manual grading
    }
    if (isCorrect) {
      score += q.marks;
      correctCount += 1;
    }
  }
  return { score, maxScore, correctCount };
}

export async function submitQuizAttempt(params: {
  attemptId: string;
  answers: Record<string, unknown>;
  score: number;
  maxScore: number;
  autoSubmitted?: boolean;
}): Promise<void> {
  const { error } = await supabase
    .from("quiz_attempts")
    .update({
      answers: params.answers,
      score: params.score,
      max_score: params.maxScore,
      submitted_at: new Date().toISOString(),
      status: params.autoSubmitted ? "auto_submitted" : "submitted",
    })
    .eq("id", params.attemptId);
  if (error) throw error;
}

export async function getAttendanceForStudent(studentId: string): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("student_id", studentId)
    .order("date", { ascending: false })
    .limit(90);
  if (error) throw error;
  return (data as AttendanceRecord[]) ?? [];
}

export async function markAttendanceBulk(
  records: Omit<AttendanceRecord, "id" | "created_at">[]
): Promise<void> {
  const { error } = await supabase
    .from("attendance_records")
    .upsert(records, { onConflict: "student_id,date" });
  if (error) throw error;
}

export async function getTimetableForSection(sectionId: string): Promise<TimetableEntry[]> {
  const { data, error } = await supabase
    .from("timetable_entries")
    .select("*, subject:subjects(*)")
    .eq("section_id", sectionId)
    .order("day_of_week")
    .order("period");
  if (error) throw error;
  return (data as TimetableEntry[]) ?? [];
}

export async function getStudyMaterials(subjectId: string): Promise<StudyMaterial[]> {
  const { data, error } = await supabase
    .from("study_materials")
    .select("*")
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as StudyMaterial[]) ?? [];
}

export async function getSectionRoster(sectionId: string) {
  const { data, error } = await supabase
    .from("student_profiles")
    .select("user_id, roll_number, profile:profiles(full_name, avatar_url)")
    .eq("section_id", sectionId);
  if (error) throw error;
  return (data as any[]) ?? [];
}
