import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { useAppSelector } from './src/store';
import { lightTheme, darkTheme } from './src/theme';

const AppContent: React.FC = () => {
  const isDark = useAppSelector(state => state.theme.isDark);
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar
            barStyle={isDark ? 'light-content' : 'dark-content'}
            backgroundColor={isDark ? '#1A1A2E' : '#F8F9FD'}
          />
          <AppNavigator />
          <Toast
            config={{
              success: props => <ToastSuccess {...props} />,
              error: props => <ToastError {...props} />,
              info: props => <ToastInfo {...props} />,
            }}
          />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </PaperProvider>
  );
};

import { View, Text, StyleSheet } from 'react-native';
import { colors } from './src/theme/colors';
import { borderRadius, spacing } from './src/theme/spacing';
import { fontSize, fontWeight } from './src/theme/typography';

const ToastBase = ({ text1, text2, bg }: { text1?: string; text2?: string; bg: string }) => (
  <View style={[toastStyles.container, { backgroundColor: bg }]}>
    <Text style={toastStyles.title}>{text1}</Text>
    {text2 && <Text style={toastStyles.subtitle}>{text2}</Text>}
  </View>
);

const ToastSuccess = (props: any) => <ToastBase {...props} bg={colors.success} />;
const ToastError = (props: any) => <ToastBase {...props} bg={colors.error} />;
const ToastInfo = (props: any) => <ToastBase {...props} bg={colors.info} />;

const toastStyles = StyleSheet.create({
  container: {
    width: '90%',
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: fontSize.sm,
    marginTop: 2,
  },
});

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;
