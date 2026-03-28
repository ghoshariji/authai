import { baseApi } from './baseApi';
import { Attendance, AttendanceSummary } from '../../types';

interface MarkAttendanceRequest {
  classId: string;
  subjectId: string;
  date: string;
  records: Array<{
    studentId: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE';
    remarks?: string;
  }>;
}

interface GetAttendanceParams {
  classId: string;
  subjectId: string;
  date: string;
}

interface GetStudentAttendanceSummaryParams {
  studentId?: string;
  subjectId?: string;
  startDate?: string;
  endDate?: string;
}

export const attendanceApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    markAttendance: builder.mutation<Attendance[], MarkAttendanceRequest>({
      query: data => ({
        url: '/attendance/mark',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Attendance'],
    }),
    getAttendanceByClassDate: builder.query<Attendance[], GetAttendanceParams>({
      query: params => ({ url: '/attendance/class', params }),
      providesTags: ['Attendance'],
    }),
    getStudentAttendanceSummary: builder.query<AttendanceSummary[], GetStudentAttendanceSummaryParams>({
      query: params => ({ url: '/attendance/summary', params }),
      providesTags: ['Attendance'],
    }),
    getMyAttendanceSummary: builder.query<AttendanceSummary[], void>({
      query: () => '/attendance/my-summary',
      providesTags: ['Attendance'],
    }),
    getAttendanceReport: builder.query<any, { classId: string; subjectId?: string; startDate?: string; endDate?: string }>({
      query: params => ({ url: '/attendance/report', params }),
      providesTags: ['Attendance'],
    }),
  }),
});

export const {
  useMarkAttendanceMutation,
  useGetAttendanceByClassDateQuery,
  useGetStudentAttendanceSummaryQuery,
  useGetMyAttendanceSummaryQuery,
  useGetAttendanceReportQuery,
} = attendanceApi;
