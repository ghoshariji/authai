import { baseApi } from './baseApi';
import { Exam, Result, PaginatedResponse } from '../../types';

interface GetExamsParams {
  page?: number;
  limit?: number;
  classId?: string;
  subjectId?: string;
}

interface CreateExamData {
  name: string;
  type: string;
  date: string;
  startTime?: string;
  endTime?: string;
  totalMarks: number;
  passingMarks: number;
  subjectId: string;
  classId: string;
}

interface CreateResultData {
  studentId: string;
  examId: string;
  marksObtained: number;
  remarks?: string;
}

export const examApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getExams: builder.query<PaginatedResponse<Exam>, GetExamsParams>({
      query: params => ({ url: '/exams', params }),
      providesTags: ['Exam'],
    }),
    getExam: builder.query<Exam, string>({
      query: id => `/exams/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Exam', id }],
    }),
    createExam: builder.mutation<Exam, CreateExamData>({
      query: data => ({
        url: '/exams',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Exam'],
    }),
    updateExam: builder.mutation<Exam, { id: string; data: Partial<CreateExamData> }>({
      query: ({ id, data }) => ({
        url: `/exams/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Exam'],
    }),
    deleteExam: builder.mutation<void, string>({
      query: id => ({
        url: `/exams/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Exam'],
    }),
    getResults: builder.query<Result[], { examId?: string; classId?: string; studentId?: string }>({
      query: params => ({ url: '/results', params }),
      providesTags: ['Result'],
    }),
    createResult: builder.mutation<Result, CreateResultData>({
      query: data => ({
        url: '/results',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Result'],
    }),
    createBulkResults: builder.mutation<Result[], { examId: string; results: { studentId: string; marksObtained: number; remarks?: string }[] }>({
      query: data => ({
        url: '/results/bulk',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Result'],
    }),
    getMyResults: builder.query<Result[], void>({
      query: () => '/results/my-results',
      providesTags: ['Result'],
    }),
  }),
});

export const {
  useGetExamsQuery,
  useGetExamQuery,
  useCreateExamMutation,
  useUpdateExamMutation,
  useDeleteExamMutation,
  useGetResultsQuery,
  useCreateResultMutation,
  useCreateBulkResultsMutation,
  useGetMyResultsQuery,
} = examApi;
