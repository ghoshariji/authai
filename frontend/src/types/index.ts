export type Role = 'SUPER_ADMIN' | 'COLLEGE_ADMIN' | 'TEACHER' | 'STUDENT';
export type PlanType = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';
export type NoticeType = 'GENERAL' | 'ACADEMIC' | 'URGENT' | 'EVENT';
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE';
export type ChatRoomType = 'DIRECT' | 'GROUP' | 'CLASS';

export interface PlanLimits {
  students: number;
  teachers: number;
  storage: number;
  departments: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  collegeId: string;
  avatar?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Subscription {
  plan: PlanType;
  status: SubscriptionStatus;
  currentPeriodEnd: string;
  currentPeriodStart: string;
  limits: PlanLimits;
  usage: {
    students: number;
    teachers: number;
    storage: number;
  };
}

export interface College {
  _id: string;
  name: string;
  code: string;
  email: string;
  phone?: string;
  address?: string;
  logo?: string;
  subscription: Subscription;
  isActive: boolean;
  createdAt: string;
  adminCount?: number;
  studentCount?: number;
  teacherCount?: number;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  collegeId: string;
  head?: Teacher;
  studentCount?: number;
  teacherCount?: number;
  createdAt: string;
}

export interface Subject {
  _id: string;
  name: string;
  code: string;
  credits: number;
  department: Department;
}

export interface Class {
  _id: string;
  name: string;
  section: string;
  year: number;
  department: Department;
  subjects: Subject[];
  students?: Student[];
}

export interface Student {
  _id: string;
  userId: User;
  studentId: string;
  rollNumber: string;
  class: Class;
  department: Department;
  parentName?: string;
  parentPhone?: string;
  dateOfBirth?: string;
  address?: string;
  cgpa?: number;
  createdAt: string;
}

export interface Teacher {
  _id: string;
  userId: User;
  teacherId: string;
  department: Department;
  subjects: Subject[];
  qualification?: string;
  experience?: number;
  classes?: Class[];
  createdAt: string;
}

export interface Attendance {
  _id: string;
  student: Student;
  date: string;
  status: AttendanceStatus;
  subject: Subject;
  class: Class;
  markedBy: Teacher;
  createdAt: string;
}

export interface AttendanceSummary {
  subject: Subject;
  totalClasses: number;
  attended: number;
  percentage: number;
}

export interface Notice {
  _id: string;
  title: string;
  content: string;
  type: NoticeType;
  targetRoles: Role[];
  createdBy: User;
  college: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Exam {
  _id: string;
  name: string;
  type: 'MIDTERM' | 'FINAL' | 'QUIZ' | 'ASSIGNMENT';
  date: string;
  totalMarks: number;
  passingMarks: number;
  subject: Subject;
  class: Class;
  createdBy: Teacher;
  createdAt: string;
}

export interface Result {
  _id: string;
  student: Student;
  exam: Exam;
  marksObtained: number;
  grade: string;
  percentage: number;
  remarks?: string;
  createdAt: string;
}

export interface Message {
  _id: string;
  sender: User;
  content: string;
  type: MessageType;
  fileUrl?: string;
  chatRoom: string;
  readBy: string[];
  createdAt: string;
}

export interface ChatRoom {
  _id: string;
  name: string;
  type: ChatRoomType;
  lastMessage?: Message;
  participants: User[];
  admin?: User;
  createdAt: string;
  unreadCount?: number;
}

export interface TimetableSlot {
  _id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: Subject;
  teacher: Teacher;
  class: Class;
  room?: string;
}

export interface CollegeStats {
  totalStudents: number;
  totalTeachers: number;
  totalDepartments: number;
  totalClasses: number;
  attendanceRate: number;
  subscriptionStatus: SubscriptionStatus;
  planType: PlanType;
}

export interface SuperAdminStats {
  totalColleges: number;
  totalRevenue: number;
  activeSubscriptions: number;
  totalUsers: number;
  revenueByMonth: { month: string; revenue: number }[];
  collegesByPlan: { plan: PlanType; count: number }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}
