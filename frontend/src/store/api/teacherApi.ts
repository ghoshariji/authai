import { baseApi } from './baseApi';
import { Teacher, PaginatedResponse } from '../../types';

interface GetTeachersParams {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
}

interface CreateTeacherData {
  name: string;
  email: string;
  departmentId: string;
  subjectIds?: string[];
  qualification?: string;
  experience?: number;
  designation?: string;
}

export const teacherApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getTeachers: builder.query<PaginatedResponse<Teacher>, GetTeachersParams>({
      query: params => ({ url: '/teachers', params }),
      providesTags: ['Teacher'],
    }),
    getTeacher: builder.query<Teacher, string>({
      query: id => `/teachers/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Teacher', id }],
    }),
    createTeacher: builder.mutation<Teacher, CreateTeacherData>({
      query: data => ({
        url: '/teachers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Teacher'],
    }),
    updateTeacher: builder.mutation<Teacher, { id: string; data: Partial<CreateTeacherData> }>({
      query: ({ id, data }) => ({
        url: `/teachers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Teacher', id }, 'Teacher'],
    }),
    deleteTeacher: builder.mutation<void, string>({
      query: id => ({
        url: `/teachers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Teacher'],
    }),
    getMyTeacherProfile: builder.query<Teacher, void>({
      query: () => '/teachers/my-profile',
      providesTags: ['Teacher'],
    }),
  }),
});

export const {
  useGetTeachersQuery,
  useGetTeacherQuery,
  useCreateTeacherMutation,
  useUpdateTeacherMutation,
  useDeleteTeacherMutation,
  useGetMyTeacherProfileQuery,
} = teacherApi;
