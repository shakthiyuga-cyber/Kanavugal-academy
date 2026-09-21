export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

// One flat stack for the signed-in app. AppShell (rendered inside each
// screen) provides the sidebar / bottom-tab chrome, so we don't need nested
// tab/drawer navigators duplicated per breakpoint — see src/components/layout/AppShell.tsx.
export type AppStackParamList = {
  ProgramHub: undefined;
  Profile: undefined;
  Notifications: undefined;

  // School LMS
  LmsDashboard: undefined;
  LmsSubjects: undefined;
  LmsChapters: { subjectId: string; subjectName: string };
  LmsLessons: { chapterId: string; chapterTitle: string };
  LmsLessonDetail: { lessonId: string };
  LmsHomeworkList: undefined;
  LmsHomeworkDetail: { homeworkId: string };
  LmsQuizList: undefined;
  LmsQuizAttempt: { quizId: string };
  LmsQuizResult: { attemptId: string; quizId: string };
  LmsAttendance: undefined;
  LmsTimetable: undefined;
  LmsStudyMaterials: undefined;

  // Teacher tools
  TeacherCreateHomework: undefined;
  TeacherCreateQuiz: undefined;
  TeacherMarkAttendance: undefined;
  TeacherEvaluateHomework: { homeworkId: string };

  // Admin tools
  AdminManageSubjects: undefined;
  AdminManageUsers: undefined;
  AdminDashboard: undefined;
};
