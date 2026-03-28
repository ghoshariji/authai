import { baseApi } from './baseApi';
import { Student, AttendanceSummary, Result, PaginatedResponse } from '../../types';

interface GetStudentsParams {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  classId?: string;
}

interface CreateStudentData {
  name: string;
  email: string;
  rollNumber: string;
  departmentId: string;
  classId: string;
  parentName?: string;
  parentPhone?: string;
  dateOfBirth?: string;
  address?: string;
}

export const studentApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getStudents: builder.query<PaginatedResponse<Student>, GetStudentsParams>({
      query: params => ({ url: '/students', params }),
      providesTags: ['Student'],
    }),
    getStudent: builder.query<Student, string>({
      query: id => `/students/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Student', id }],
    }),
    createStudent: builder.mutation<Student, CreateStudentData>({
      query: data => ({
        url: '/students',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Student'],
    }),
    updateStudent: builder.mutation<Student, { id: string; data: Partial<CreateStudentData> }>({
      query: ({ id, data }) => ({
        url: `/students/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Student', id }, 'Student'],
    }),
    deleteStudent: builder.mutation<void, string>({
      query: id => ({
        url: `/students/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Student'],
    }),
    getStudentAttendance: builder.query<AttendanceSummary[], string>({
      query: id => `/students/${id}/attendance-summary`,
      providesTags: ['Attendance'],
    }),
    getStudentResults: builder.query<Result[], string>({
      query: id => `/students/${id}/results`,
      providesTags: ['Result'],
    }),
    getMyProfile: builder.query<Student, void>({
      query: () => '/students/my-profile',
      providesTags: ['Student'],
    }),
  }),
});

export const {
  useGetStudentsQuery,
  useGetStudentQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useGetStudentAttendanceQuery,
  useGetStudentResultsQuery,
  useGetMyProfileQuery,
} = studentApi;
