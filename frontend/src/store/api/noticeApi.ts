import { baseApi } from './baseApi';
import { Notice, PaginatedResponse } from '../../types';

interface GetNoticesParams {
  page?: number;
  limit?: number;
  type?: string;
}

interface CreateNoticeData {
  title: string;
  content: string;
  type: string;
  targetRoles: string[];
}

export const noticeApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getNotices: builder.query<PaginatedResponse<Notice>, GetNoticesParams>({
      query: params => ({ url: '/notices', params }),
      providesTags: ['Notice'],
    }),
    getNotice: builder.query<Notice, string>({
      query: id => `/notices/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Notice', id }],
    }),
    createNotice: builder.mutation<Notice, CreateNoticeData>({
      query: data => ({
        url: '/notices',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Notice'],
    }),
    updateNotice: builder.mutation<Notice, { id: string; data: Partial<CreateNoticeData> }>({
      query: ({ id, data }) => ({
        url: `/notices/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Notice'],
    }),
    deleteNotice: builder.mutation<void, string>({
      query: id => ({
        url: `/notices/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notice'],
    }),
  }),
});

export const {
  useGetNoticesQuery,
  useGetNoticeQuery,
  useCreateNoticeMutation,
  useUpdateNoticeMutation,
  useDeleteNoticeMutation,
} = noticeApi;
