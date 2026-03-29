import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';

export interface FeatureConfig {
  is_chat_feature_enabled: boolean;
  is_attendance_display: boolean;
  is_notice_display: boolean;
  is_results_display: boolean;
  is_timetable_display: boolean;
}

const DEFAULT_FEATURE_CONFIG: FeatureConfig = {
  is_chat_feature_enabled: true,
  is_attendance_display: true,
  is_notice_display: true,
  is_results_display: true,
  is_timetable_display: true,
};

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  featureConfig: FeatureConfig;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  featureConfig: DEFAULT_FEATURE_CONFIG,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        accessToken: string;
        refreshToken?: string;
        featureConfig?: FeatureConfig;
      }>,
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
      if (action.payload.featureConfig) {
        state.featureConfig = action.payload.featureConfig;
      }
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    setFeatureConfig: (state, action: PayloadAction<FeatureConfig>) => {
      state.featureConfig = action.payload;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
    logout: state => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.featureConfig = DEFAULT_FEATURE_CONFIG;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, updateUser, setAccessToken, logout, setLoading, setFeatureConfig } =
  authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.isAuthenticated;
export const selectAccessToken = (state: { auth: AuthState }) => state.auth.accessToken;
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectFeatureConfig = (state: { auth: AuthState }) => state.auth.featureConfig;
