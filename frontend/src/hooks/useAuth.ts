import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { logout as logoutAction, selectCurrentUser, selectIsAuthenticated } from '../store/slices/authSlice';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { socketService } from '../services/socket';
import { baseApi } from '../store/api/baseApi';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const logout = useCallback(async () => {
    socketService.disconnect();
    await storage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER,
    ]);
    dispatch(logoutAction());
    dispatch(baseApi.util.resetApiState());
  }, [dispatch]);

  return {
    user,
    role: user?.role ?? null,
    isAuthenticated,
    logout,
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    isCollegeAdmin: user?.role === 'COLLEGE_ADMIN',
    isTeacher: user?.role === 'TEACHER',
    isStudent: user?.role === 'STUDENT',
  };
};
