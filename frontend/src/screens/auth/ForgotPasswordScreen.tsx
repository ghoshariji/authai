import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { useForgotPasswordMutation, useResetPasswordMutation } from '../../store/api/authApi';
import { useTheme } from '../../hooks/useTheme';
import { AuthStackParamList } from '../../navigation/types';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
};

type Step = 'email' | 'otp' | 'newPassword';

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { isDark } = useTheme();
  const [forgotPassword, { isLoading: isSendingOtp }] = useForgotPasswordMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const bgColor = isDark ? colors.background.dark : colors.background.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;
  const cardBg = isDark ? colors.card.dark : colors.card.light;

  const handleSendOtp = async () => {
    if (!email.trim()) {
      Toast.show({ type: 'error', text1: 'Enter your email' });
      return;
    }
    try {
      await forgotPassword({ email: email.trim() }).unwrap();
      Toast.show({ type: 'success', text1: 'OTP Sent', text2: 'Check your email for the OTP' });
      setStep('otp');
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error?.data?.message || 'Failed to send OTP' });
    }
  };

  const handleVerifyOtp = () => {
    if (otp.length < 4) {
      Toast.show({ type: 'error', text1: 'Enter the OTP sent to your email' });
      return;
    }
    setStep('newPassword');
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Toast.show({ type: 'error', text1: 'Password must be at least 6 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Passwords do not match' });
      return;
    }
    try {
      await resetPassword({ token: otp, password: newPassword }).unwrap();
      Toast.show({ type: 'success', text1: 'Password Reset', text2: 'You can now login with your new password' });
      navigation.navigate('Login');
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error?.data?.message || 'Failed to reset password' });
    }
  };

  const stepConfig = {
    email: { title: 'Forgot Password', subtitle: 'Enter your email to receive an OTP', icon: '📧' },
    otp: { title: 'Verify OTP', subtitle: `Enter the 6-digit code sent to ${email}`, icon: '🔐' },
    newPassword: { title: 'New Password', subtitle: 'Create a new secure password', icon: '🔒' },
  };

  const { title, subtitle, icon } = stepConfig[step];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Back */}
          <TouchableOpacity onPress={() => step === 'email' ? navigation.goBack() : setStep(step === 'newPassword' ? 'otp' : 'email')} style={styles.backBtn}>
            <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerIcon}>{icon}</Text>
            <Text style={[styles.title, { color: textColor }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: secondaryColor }]}>{subtitle}</Text>
          </View>

          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            {(['email', 'otp', 'newPassword'] as Step[]).map((s, index) => (
              <View key={s} style={styles.stepItem}>
                <View style={[
                  styles.stepDot,
                  {
                    backgroundColor: step === s || (s === 'email' && ['otp', 'newPassword'].includes(step)) || (s === 'otp' && step === 'newPassword')
                      ? colors.primary
                      : isDark ? colors.border.dark : colors.border.light,
                  },
                ]}>
                  <Text style={styles.stepNum}>{index + 1}</Text>
                </View>
                {index < 2 && (
                  <View style={[styles.stepLine, { backgroundColor: isDark ? colors.border.dark : colors.border.light }]} />
                )}
              </View>
            ))}
          </View>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            {step === 'email' && (
              <>
                <Input
                  label="Email Address"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  isDark={isDark}
                  leftIcon={<Text>✉️</Text>}
                />
                <Button
                  title="Send OTP"
                  onPress={handleSendOtp}
                  loading={isSendingOtp}
                  fullWidth
                  size="lg"
                />
              </>
            )}

            {step === 'otp' && (
              <>
                <Input
                  label="OTP Code"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  isDark={isDark}
                  leftIcon={<Text>🔢</Text>}
                />
                <Button
                  title="Verify OTP"
                  onPress={handleVerifyOtp}
                  fullWidth
                  size="lg"
                />
                <TouchableOpacity onPress={handleSendOtp} style={styles.resendBtn}>
                  <Text style={[styles.resendText, { color: colors.primary }]}>
                    Resend OTP
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'newPassword' && (
              <>
                <Input
                  label="New Password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  isDark={isDark}
                  leftIcon={<Text>🔒</Text>}
                  rightIcon={<Text>{showPassword ? '🙈' : '👁️'}</Text>}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                />
                <Input
                  label="Confirm Password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  isDark={isDark}
                  leftIcon={<Text>🔒</Text>}
                />
                <Button
                  title="Reset Password"
                  onPress={handleResetPassword}
                  loading={isResetting}
                  fullWidth
                  size="lg"
                />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing[5] },
  backBtn: { marginBottom: spacing[4] },
  backText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  header: { alignItems: 'center', marginBottom: spacing[6] },
  headerIcon: { fontSize: 56, marginBottom: spacing[3] },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, marginBottom: spacing[1] },
  subtitle: { fontSize: fontSize.sm, textAlign: 'center' },
  stepIndicator: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: spacing[6] },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  stepNum: { color: '#FFFFFF', fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  stepLine: { width: 40, height: 2, marginHorizontal: spacing[1] },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resendBtn: { alignItems: 'center', marginTop: spacing[4] },
  resendText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
});

export default ForgotPasswordScreen;
