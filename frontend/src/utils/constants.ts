export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  COLLEGE_ADMIN: 'COLLEGE_ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
} as const;

export const PLAN_TYPES = {
  FREE: 'FREE',
  BASIC: 'BASIC',
  PRO: 'PRO',
  ENTERPRISE: 'ENTERPRISE',
} as const;

export const PLAN_LIMITS = {
  FREE: { students: 50, teachers: 5, storage: 1, departments: 2 },
  BASIC: { students: 200, teachers: 20, storage: 10, departments: 5 },
  PRO: { students: 1000, teachers: 100, storage: 50, departments: 20 },
  ENTERPRISE: { students: 10000, teachers: 500, storage: 500, departments: 100 },
};

export const PLAN_PRICES = {
  FREE: 0,
  BASIC: 49,
  PRO: 149,
  ENTERPRISE: 499,
};

export const API_BASE_URL = 'http://10.0.2.2:5000/api/v1';
export const SOCKET_URL = 'http://10.0.2.2:5000';

export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
} as const;

export const NOTICE_TYPES = {
  GENERAL: 'GENERAL',
  ACADEMIC: 'ACADEMIC',
  URGENT: 'URGENT',
  EVENT: 'EVENT',
} as const;

export const EXAM_TYPES = {
  MIDTERM: 'MIDTERM',
  FINAL: 'FINAL',
  QUIZ: 'QUIZ',
  ASSIGNMENT: 'ASSIGNMENT',
} as const;

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
};
