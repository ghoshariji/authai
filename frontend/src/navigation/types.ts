import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

// Super Admin Stack
export type SuperAdminTabParamList = {
  Dashboard: undefined;
  Colleges: undefined;
  Analytics: undefined;
  Settings: undefined;
};

export type SuperAdminStackParamList = {
  CollegeDetail: { collegeId: string };
  Profile: undefined;
};

// College Admin Stack
export type CollegeAdminTabParamList = {
  Dashboard: undefined;
  Departments: undefined;
  Teachers: undefined;
  Students: undefined;
  More: undefined;
};

export type CollegeAdminStackParamList = {
  AddStudent: { studentId?: string };
  AddTeacher: { teacherId?: string };
  Notices: undefined;
  Subscription: undefined;
  Profile: undefined;
  StudentDetail: { studentId: string };
  TeacherDetail: { teacherId: string };
};

// Teacher Stack
export type TeacherTabParamList = {
  Dashboard: undefined;
  Classes: undefined;
  Attendance: undefined;
  Exams: undefined;
  Chat: undefined;
};

export type TeacherStackParamList = {
  AttendanceReport: { classId?: string; subjectId?: string };
  Results: { examId: string };
  CreateExam: { examId?: string };
  Profile: undefined;
  ChatRoom: { chatRoomId: string; name: string };
};

// Student Stack
export type StudentTabParamList = {
  Dashboard: undefined;
  Attendance: undefined;
  Results: undefined;
  Timetable: undefined;
  Chat: undefined;
};

export type StudentStackParamList = {
  Profile: undefined;
  Notices: undefined;
  ChatRoom: { chatRoomId: string; name: string };
  ResultDetail: { examId: string };
};

// Root Navigator
export type RootStackParamList = {
  Auth: undefined;
  SuperAdmin: undefined;
  CollegeAdmin: undefined;
  Teacher: undefined;
  Student: undefined;
};

// Navigation prop types
export type AuthNavProp = NativeStackNavigationProp<AuthStackParamList>;
export type SuperAdminTabNavProp = BottomTabNavigationProp<SuperAdminTabParamList>;
