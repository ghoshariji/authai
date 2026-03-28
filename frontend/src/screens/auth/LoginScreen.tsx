import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { useAppDispatch } from '../../store';
import { setCredentials } from '../../store/slices/authSlice';
import { useLoginMutation } from '../../store/api/authApi';
import { storage, STORAGE_KEYS } from '../../utils/storage';
import { socketService } from '../../services/socket';
import { useTheme } from '../../hooks/useTheme';
import { AuthStackParamList } from '../../navigation/types';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

type RoleOption = { label: string; value: string };

const ROLE_OPTIONS: RoleOption[] = [
  { label: 'Student', value: 'STUDENT' },
  { label: 'Teacher', value: 'TEACHER' },
  { label: 'College Admin', value: 'COLLEGE_ADMIN' },
];

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isDark, colors: themeColors } = useTheme();
  const [login, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('STUDENT');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const bgColor = isDark ? colors.background.dark : colors.background.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;
  const cardBg = isDark ? colors.card.dark : colors.card.light;

  const validate = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    if (!email.trim()) {
      setEmailError('Email is required');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Enter a valid email');
      valid = false;
    }
    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    }
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      const result = await login({ email: email.trim(), password }).unwrap();
      await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, result.accessToken);
      await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken);
      await storage.setObject(STORAGE_KEYS.USER, result.user);
      dispatch(setCredentials({ user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken }));
      socketService.connect(result.accessToken);
      Toast.show({ type: 'success', text1: 'Welcome back!', text2: `Logged in as ${result.user.name}` });
    } catch (error: any) {
      const message = error?.data?.message || 'Login failed. Please try again.';
      Toast.show({ type: 'error', text1: 'Login Failed', text2: message });
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Header / Branding */}
          <View style={styles.branding}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🎓</Text>
            </View>
            <Text style={[styles.appName, { color: colors.primary }]}>EduManage</Text>
            <Text style={[styles.tagline, { color: secondaryColor }]}>
              College Management System
            </Text>
          </View>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.welcomeTitle, { color: textColor }]}>Welcome Back</Text>
            <Text style={[styles.welcomeSubtitle, { color: secondaryColor }]}>
              Sign in to your account
            </Text>

            {/* Role Selector */}
            <Text style={[styles.roleLabel, { color: secondaryColor }]}>Login as</Text>
            <View style={styles.roleContainer}>
              {ROLE_OPTIONS.map(role => (
                <TouchableOpacity
                  key={role.value}
                  style={[
                    styles.roleChip,
                    {
                      backgroundColor:
                        selectedRole === role.value
                          ? colors.primary
                          : isDark
                          ? colors.border.dark
                          : '#F0EEFF',
                      borderColor:
                        selectedRole === role.value ? colors.primary : 'transparent',
                    },
                  ]}
                  onPress={() => setSelectedRole(role.value)}>
                  <Text
                    style={[
                      styles.roleChipText,
                      {
                        color:
                          selectedRole === role.value
                            ? '#FFFFFF'
                            : isDark
                            ? colors.text.secondary.dark
                            : colors.text.secondary.light,
                      },
                    ]}>
                    {role.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Inputs */}
            <Input
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={emailError}
              isDark={isDark}
              leftIcon={<Text style={{ fontSize: 16 }}>✉️</Text>}
            />
            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              error={passwordError}
              isDark={isDark}
              leftIcon={<Text style={{ fontSize: 16 }}>🔒</Text>}
              rightIcon={
                <Text style={{ fontSize: 16 }}>{showPassword ? '🙈' : '👁️'}</Text>
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotContainer}>
              <Text style={[styles.forgotText, { color: colors.primary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              size="lg"
              style={styles.loginButton}
            />
          </View>

          <Text style={[styles.footer, { color: secondaryColor }]}>
            © 2026 EduManage. All rights reserved.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing[5],
    paddingBottom: spacing[8],
  },
  branding: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  logoEmoji: { fontSize: 48 },
  appName: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.extrabold,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: fontSize.sm,
    marginTop: spacing[1],
  },
  card: {
    borderRadius: borderRadius['2xl'],
    padding: spacing[6],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  welcomeTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    marginBottom: spacing[1],
  },
  welcomeSubtitle: {
    fontSize: fontSize.md,
    marginBottom: spacing[5],
  },
  roleLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing[2],
  },
  roleContainer: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[5],
    flexWrap: 'wrap',
  },
  roleChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
  },
  roleChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginTop: -spacing[2],
    marginBottom: spacing[4],
  },
  forgotText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  loginButton: {
    marginTop: spacing[2],
  },
  footer: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    marginTop: spacing[6],
  },
});

export default LoginScreen;
