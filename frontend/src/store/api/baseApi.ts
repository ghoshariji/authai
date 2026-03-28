import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../index';
import { API_BASE_URL } from '../../utils/constants';
import { setAccessToken, logout } from '../slices/authSlice';
import { storage, STORAGE_KEYS } from '../../utils/storage';

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshToken = await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh-token',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions,
      );

      if (refreshResult.data) {
        const { accessToken } = refreshResult.data as { accessToken: string };
        api.dispatch(setAccessToken(accessToken));
        await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        result = await baseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logout());
        await storage.multiRemove([
          STORAGE_KEYS.ACCESS_TOKEN,
          STORAGE_KEYS.REFRESH_TOKEN,
          STORAGE_KEYS.USER,
        ]);
      }
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'College',
    'Student',
    'Teacher',
    'Department',
    'Attendance',
    'Notice',
    'Exam',
    'Result',
    'ChatRoom',
    'Message',
    'Subscription',
    'Timetable',
  ],
  endpoints: () => ({}),
});
