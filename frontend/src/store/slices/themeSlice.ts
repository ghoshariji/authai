import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
}

const initialState: ThemeState = {
  mode: 'light',
  isDark: false,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
    },
    toggleTheme: state => {
      state.isDark = !state.isDark;
      state.mode = state.isDark ? 'dark' : 'light';
    },
    setIsDark: (state, action: PayloadAction<boolean>) => {
      state.isDark = action.payload;
      state.mode = action.payload ? 'dark' : 'light';
    },
  },
});

export const { setThemeMode, toggleTheme, setIsDark } = themeSlice.actions;

export default themeSlice.reducer;

export const selectThemeMode = (state: { theme: ThemeState }) => state.theme.mode;
export const selectIsDark = (state: { theme: ThemeState }) => state.theme.isDark;
