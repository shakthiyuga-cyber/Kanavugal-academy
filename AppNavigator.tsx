import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AppStackParamList } from "@/navigation/types";

import ProgramHubScreen from "@/screens/ProgramHubScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import NotificationsScreen from "@/screens/NotificationsScreen";

import LmsDashboardScreen from "@/screens/lms/DashboardScreen";
import SubjectsScreen from "@/screens/lms/SubjectsScreen";
import ChaptersScreen from "@/screens/lms/ChaptersScreen";
import LessonsScreen from "@/screens/lms/LessonsScreen";
import LessonDetailScreen from "@/screens/lms/LessonDetailScreen";
import HomeworkListScreen from "@/screens/lms/HomeworkListScreen";
import HomeworkDetailScreen from "@/screens/lms/HomeworkDetailScreen";
import QuizListScreen from "@/screens/lms/QuizListScreen";
import QuizAttemptScreen from "@/screens/lms/QuizAttemptScreen";
import QuizResultScreen from "@/screens/lms/QuizResultScreen";
import AttendanceScreen from "@/screens/lms/AttendanceScreen";
import TimetableScreen from "@/screens/lms/TimetableScreen";
import StudyMaterialsScreen from "@/screens/lms/StudyMaterialsScreen";

import CreateHomeworkScreen from "@/screens/teacher/CreateHomeworkScreen";
import CreateQuizScreen from "@/screens/teacher/CreateQuizScreen";
import MarkAttendanceScreen from "@/screens/teacher/MarkAttendanceScreen";
import EvaluateHomeworkScreen from "@/screens/teacher/EvaluateHomeworkScreen";

import AdminDashboardScreen from "@/screens/admin/AdminDashboardScreen";
import ManageSubjectsScreen from "@/screens/admin/ManageSubjectsScreen";
import ManageUsersScreen from "@/screens/admin/ManageUsersScreen";

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProgramHub" component={ProgramHubScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />

      <Stack.Screen name="LmsDashboard" component={LmsDashboardScreen} />
      <Stack.Screen name="LmsSubjects" component={SubjectsScreen} />
      <Stack.Screen name="LmsChapters" component={ChaptersScreen} />
      <Stack.Screen name="LmsLessons" component={LessonsScreen} />
      <Stack.Screen name="LmsLessonDetail" component={LessonDetailScreen} />
      <Stack.Screen name="LmsHomeworkList" component={HomeworkListScreen} />
      <Stack.Screen name="LmsHomeworkDetail" component={HomeworkDetailScreen} />
      <Stack.Screen name="LmsQuizList" component={QuizListScreen} />
      <Stack.Screen name="LmsQuizAttempt" component={QuizAttemptScreen} />
      <Stack.Screen name="LmsQuizResult" component={QuizResultScreen} />
      <Stack.Screen name="LmsAttendance" component={AttendanceScreen} />
      <Stack.Screen name="LmsTimetable" component={TimetableScreen} />
      <Stack.Screen name="LmsStudyMaterials" component={StudyMaterialsScreen} />

      <Stack.Screen name="TeacherCreateHomework" component={CreateHomeworkScreen} />
      <Stack.Screen name="TeacherCreateQuiz" component={CreateQuizScreen} />
      <Stack.Screen name="TeacherMarkAttendance" component={MarkAttendanceScreen} />
      <Stack.Screen name="TeacherEvaluateHomework" component={EvaluateHomeworkScreen} />

      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminManageSubjects" component={ManageSubjectsScreen} />
      <Stack.Screen name="AdminManageUsers" component={ManageUsersScreen} />
    </Stack.Navigator>
  );
}
