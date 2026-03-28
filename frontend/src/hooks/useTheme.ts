import { useAppDispatch, useAppSelector } from '../store';
import { toggleTheme, selectIsDark } from '../store/slices/themeSlice';
import { lightTheme, darkTheme } from '../theme';
import { storage, STORAGE_KEYS } from '../utils/storage';

export const useTheme = () => {
  const dispatch = useAppDispatch();
  const isDark = useAppSelector(selectIsDark);
  const theme = isDark ? darkTheme : lightTheme;

  const toggle = async () => {
    dispatch(toggleTheme());
    await storage.setItem(STORAGE_KEYS.THEME, !isDark ? 'dark' : 'light');
  };

  return {
    theme,
    isDark,
    toggleTheme: toggle,
    colors: theme.custom.colors,
  };
};
