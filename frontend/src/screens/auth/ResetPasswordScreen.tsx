import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useResetPasswordMutation } from '../../store/api/authApi';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  navigation: any;
  route: any;
}

const ResetPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
  const { token, email } = route.params || {};
  const { colors, isDark } = useTheme();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = async () => {
    if (!validate()) return;
    try {
      await resetPassword({ token, email, password: form.password }).unwrap();
      Toast.show({ type: 'success', text1: 'Password Reset!', text2: 'You can now login with your new password.' });
      navigation.replace('Login');
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Failed', text2: err?.data?.message || 'Reset failed. Try again.' });
    }
  };

  const bg = isDark ? '#1A1A2E' : '#F8F9FD';
  const cardBg = isDark ? '#16213E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1A1A2E';
  const subtextColor = isDark ? '#A0A0B0' : '#666680';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bg} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.topSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.lockEmoji}>🔐</Text>
          </View>
          <Text style={[styles.title, { color: textColor }]}>Create New Password</Text>
          <Text style={[styles.subtitle, { color: subtextColor }]}>
            Your new password must be different from your previous password.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Input
            label="New Password"
            value={form.password}
            onChangeText={v => setForm(f => ({ ...f, password: v }))}
            secureTextEntry={!showPassword}
            error={errors.password}
            leftIcon="lock"
            rightIcon={showPassword ? 'eye-off' : 'eye'}
            onRightIconPress={() => setShowPassword(p => !p)}
            placeholder="Enter new password"
          />

          <Input
            label="Confirm Password"
            value={form.confirmPassword}
            onChangeText={v => setForm(f => ({ ...f, confirmPassword: v }))}
            secureTextEntry={!showPassword}
            error={errors.confirmPassword}
            leftIcon="lock-check"
            placeholder="Re-enter new password"
          />

          <View style={styles.requirements}>
            <Text style={[styles.reqTitle, { color: subtextColor }]}>Password must have:</Text>
            {[
              { text: 'At least 8 characters', met: form.password.length >= 8 },
              { text: 'One uppercase letter', met: /[A-Z]/.test(form.password) },
              { text: 'One lowercase letter', met: /[a-z]/.test(form.password) },
              { text: 'One number', met: /\d/.test(form.password) },
            ].map((req, i) => (
              <View key={i} style={styles.req}>
                <Text style={{ color: req.met ? '#4CAF50' : subtextColor, fontSize: 12 }}>
                  {req.met ? '✓' : '○'} {req.text}
                </Text>
              </View>
            ))}
          </View>

          <Button
            title="Reset Password"
            onPress={handleReset}
            loading={isLoading}
            style={styles.button}
          />

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backLink}>
            <Text style={[styles.backText, { color: '#6C63FF' }]}>← Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  topSection: { alignItems: 'center', marginBottom: 32 },
  iconContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  lockEmoji: { fontSize: 36 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 },
  card: {
    borderRadius: 16, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  requirements: { marginTop: 8, marginBottom: 16, padding: 12, backgroundColor: 'rgba(108, 99, 255, 0.05)', borderRadius: 8 },
  reqTitle: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  req: { marginVertical: 2 },
  button: { marginTop: 8 },
  backLink: { alignItems: 'center', marginTop: 16 },
  backText: { fontSize: 14, fontWeight: '500' },
});

export default ResetPasswordScreen;
