import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { colors } from './colors';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background.light,
    surface: colors.surface.light,
    surfaceVariant: '#F0EEFF',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: colors.text.primary.light,
    onSurface: colors.text.primary.light,
    error: colors.error,
    outline: colors.border.light,
    elevation: {
      level0: 'transparent',
      level1: '#F5F3FF',
      level2: '#EDE8FF',
      level3: '#E5DEFF',
      level4: '#DDD5FF',
      level5: '#D5CCFF',
    },
  },
  custom: {
    colors,
    isDark: false,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background.dark,
    surface: colors.surface.dark,
    surfaceVariant: '#1E1E38',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: colors.text.primary.dark,
    onSurface: colors.text.primary.dark,
    error: colors.error,
    outline: colors.border.dark,
    elevation: {
      level0: 'transparent',
      level1: '#1E1E38',
      level2: '#252540',
      level3: '#2C2C48',
      level4: '#333350',
      level5: '#3A3A58',
    },
  },
  custom: {
    colors,
    isDark: true,
  },
};

export type AppTheme = typeof lightTheme;

export { colors };
export * from './typography';
export * from './spacing';
