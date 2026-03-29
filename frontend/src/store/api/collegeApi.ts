import { baseApi } from './baseApi';
import { College, CollegeStats, SuperAdminStats, PaginatedResponse } from '../../types';

interface GetCollegesParams {
  page?: number;
  limit?: number;
  search?: string;
  plan?: string;
  status?: string;
}

export const collegeApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getColleges: builder.query<PaginatedResponse<College>, GetCollegesParams>({
      query: params => ({
        url: '/colleges',
        params,
      }),
      providesTags: ['College'],
    }),
    getCollege: builder.query<College, string>({
      query: id => `/colleges/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'College', id }],
    }),
    updateCollege: builder.mutation<College, { id: string; data: Partial<College> }>({
      query: ({ id, data }) => ({
        url: `/colleges/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'College', id }],
    }),
    getCollegeStats: builder.query<CollegeStats, void>({
      query: () => '/colleges/stats/my-college',
      providesTags: ['College'],
    }),
    getSuperAdminStats: builder.query<SuperAdminStats, void>({
      query: () => '/colleges/stats/super-admin',
    }),
    toggleCollegeStatus: builder.mutation<College, string>({
      query: id => ({
        url: `/colleges/${id}/toggle-status`,
        method: 'PATCH',
      }),
      invalidatesTags: ['College'],
    }),
    getFeatureConfig: builder.query<any, void>({
      query: () => '/colleges/feature-config',
      providesTags: ['College'],
    }),
    updateFeatureConfig: builder.mutation<any, Record<string, boolean>>({
      query: (data) => ({
        url: '/colleges/feature-config',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['College'],
    }),
  }),
});

export const {
  useGetCollegesQuery,
  useGetCollegeQuery,
  useUpdateCollegeMutation,
  useGetCollegeStatsQuery,
  useGetSuperAdminStatsQuery,
  useToggleCollegeStatusMutation,
  useGetFeatureConfigQuery,
  useUpdateFeatureConfigMutation,
} = collegeApi;
