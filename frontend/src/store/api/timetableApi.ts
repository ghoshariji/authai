import { baseApi } from './baseApi';
import { TimetableSlot } from '../../types';

export const timetableApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getTimetable: builder.query<TimetableSlot[], { classId?: string; teacherId?: string }>({
      query: params => ({ url: '/timetable', params }),
      providesTags: ['Timetable'],
    }),
    getMyTimetable: builder.query<TimetableSlot[], void>({
      query: () => '/timetable/my-schedule',
      providesTags: ['Timetable'],
    }),
    createTimetableSlot: builder.mutation<TimetableSlot, Partial<TimetableSlot>>({
      query: data => ({
        url: '/timetable',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Timetable'],
    }),
    deleteTimetableSlot: builder.mutation<void, string>({
      query: id => ({
        url: `/timetable/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Timetable'],
    }),
  }),
});

export const {
  useGetTimetableQuery,
  useGetMyTimetableQuery,
  useCreateTimetableSlotMutation,
  useDeleteTimetableSlotMutation,
} = timetableApi;
