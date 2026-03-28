import { baseApi } from './baseApi';
import { Department, PaginatedResponse } from '../../types';

interface CreateDepartmentData {
  name: string;
  code: string;
  headId?: string;
}

export const departmentApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getDepartments: builder.query<Department[], void>({
      query: () => '/departments',
      providesTags: ['Department'],
    }),
    getDepartment: builder.query<Department, string>({
      query: id => `/departments/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Department', id }],
    }),
    createDepartment: builder.mutation<Department, CreateDepartmentData>({
      query: data => ({
        url: '/departments',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Department'],
    }),
    updateDepartment: builder.mutation<Department, { id: string; data: Partial<CreateDepartmentData> }>({
      query: ({ id, data }) => ({
        url: `/departments/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Department'],
    }),
    deleteDepartment: builder.mutation<void, string>({
      query: id => ({
        url: `/departments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Department'],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useGetDepartmentQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentApi;
