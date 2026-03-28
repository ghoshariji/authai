import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { colors } from '../theme/colors';
import { PlanType } from '../types';

export const formatDate = (dateString: string, formatStr = 'MMM dd, yyyy'): string => {
  try {
    return format(parseISO(dateString), formatStr);
  } catch {
    return dateString;
  }
};

export const formatTime = (dateString: string): string => {
  try {
    return format(parseISO(dateString), 'hh:mm a');
  } catch {
    return dateString;
  }
};

export const formatRelativeTime = (dateString: string): string => {
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  } catch {
    return dateString;
  }
};

export const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const getPlanColor = (plan: PlanType): string => {
  return colors.plan[plan] || colors.plan.FREE;
};

export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    ACTIVE: colors.success,
    INACTIVE: colors.error,
    TRIAL: colors.info,
    EXPIRED: colors.error,
    CANCELLED: colors.warning,
    PENDING: colors.warning,
  };
  return statusColors[status] || colors.text.secondary.light;
};

export const calculateAttendancePercentage = (
  attended: number,
  total: number,
): number => {
  if (total === 0) return 0;
  return Math.round((attended / total) * 100);
};

export const getAttendanceColor = (percentage: number): string => {
  if (percentage >= 75) return colors.success;
  if (percentage >= 60) return colors.warning;
  return colors.error;
};

export const getGradeColor = (grade: string): string => {
  const gradeColors: Record<string, string> = {
    'A+': colors.grade.A,
    A: colors.grade.A,
    'A-': colors.grade.A,
    'B+': colors.grade.B,
    B: colors.grade.B,
    'B-': colors.grade.B,
    'C+': colors.grade.C,
    C: colors.grade.C,
    'C-': colors.grade.C,
    'D+': colors.grade.D,
    D: colors.grade.D,
    F: colors.grade.F,
  };
  return gradeColors[grade] || colors.text.secondary.light;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
  return phoneRegex.test(phone);
};

export const getNoticeTypeColor = (type: string): string => {
  const typeColors: Record<string, string> = {
    GENERAL: colors.info,
    ACADEMIC: colors.primary,
    URGENT: colors.error,
    EVENT: colors.success,
  };
  return typeColors[type] || colors.info;
};

export const getExamTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    MIDTERM: 'Mid Term',
    FINAL: 'Final Exam',
    QUIZ: 'Quiz',
    ASSIGNMENT: 'Assignment',
  };
  return labels[type] || type;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};
