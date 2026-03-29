import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch,
  TouchableOpacity, ActivityIndicator, StatusBar,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../hooks/useTheme';
import { selectFeatureConfig, setFeatureConfig, FeatureConfig } from '../../store/slices/authSlice';
import { colors } from '../../theme/colors';
import Header from '../../components/common/Header';

interface FeatureRow {
  key: keyof FeatureConfig;
  label: string;
  description: string;
  icon: string;
}

const FEATURES: FeatureRow[] = [
  { key: 'is_chat_feature_enabled', label: 'Chat System', description: 'Allow students and teachers to use the in-app messaging and group chat', icon: '💬' },
  { key: 'is_attendance_display', label: 'Attendance Display', description: 'Show attendance records and percentage to students', icon: '✅' },
  { key: 'is_notice_display', label: 'Notice Board', description: 'Show notices and announcements to students and teachers', icon: '📢' },
  { key: 'is_results_display', label: 'Results Display', description: 'Allow students to view their exam results and grades', icon: '📊' },
  { key: 'is_timetable_display', label: 'Timetable Display', description: 'Show class schedule and timetable to students', icon: '📅' },
];

const FeatureConfigScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isDark } = useTheme();
  const dispatch = useDispatch();
  const savedConfig = useSelector(selectFeatureConfig);

  const [config, setConfig] = useState<FeatureConfig>({ ...savedConfig });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const bg = isDark ? '#1A1A2E' : '#F8F9FD';
  const cardBg = isDark ? '#16213E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1A1A2E';
  const subtextColor = isDark ? '#A0A0B0' : '#666680';
  const borderColor = isDark ? '#2D2D4E' : '#E8E8F0';

  const handleToggle = (key: keyof FeatureConfig) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Call API to update feature config
      const { api } = require('../../services/api');
      const response = await api.put('/colleges/feature-config', config);
      const updated = response.data?.data;
      if (updated) {
        dispatch(setFeatureConfig(updated));
        setHasChanges(false);
        Toast.show({ type: 'success', text1: 'Saved!', text2: 'Feature settings updated for all college users.' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Failed to save', text2: err?.response?.data?.message || 'Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setConfig({ ...savedConfig });
    setHasChanges(false);
  };

  const enabledCount = Object.values(config).filter(Boolean).length;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bg} />
      <Header title="Feature Settings" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: isDark ? 'rgba(108,99,255,0.15)' : 'rgba(108,99,255,0.08)', borderColor: colors.primary }]}>
          <Text style={styles.infoIcon}>⚙️</Text>
          <View style={styles.infoText}>
            <Text style={[styles.infoTitle, { color: colors.primary }]}>Tenant Feature Control</Text>
            <Text style={[styles.infoDesc, { color: subtextColor }]}>
              Toggle features for all users in your college. Changes take effect immediately.
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={[styles.statsRow, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>{enabledCount}</Text>
            <Text style={[styles.statLabel, { color: subtextColor }]}>Enabled</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.error }]}>{FEATURES.length - enabledCount}</Text>
            <Text style={[styles.statLabel, { color: subtextColor }]}>Disabled</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: textColor }]}>{FEATURES.length}</Text>
            <Text style={[styles.statLabel, { color: subtextColor }]}>Total</Text>
          </View>
        </View>

        {/* Feature Toggles */}
        <Text style={[styles.sectionTitle, { color: subtextColor }]}>FEATURES</Text>
        {FEATURES.map((feature, index) => {
          const isEnabled = config[feature.key];
          return (
            <View
              key={feature.key}
              style={[
                styles.featureCard,
                { backgroundColor: cardBg, borderColor },
                index === FEATURES.length - 1 && { marginBottom: 0 },
              ]}>
              <View style={[styles.featureIcon, { backgroundColor: isEnabled ? 'rgba(108,99,255,0.1)' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                <Text style={styles.featureEmoji}>{feature.icon}</Text>
              </View>
              <View style={styles.featureInfo}>
                <Text style={[styles.featureLabel, { color: textColor }]}>{feature.label}</Text>
                <Text style={[styles.featureDesc, { color: subtextColor }]} numberOfLines={2}>
                  {feature.description}
                </Text>
                <View style={[styles.featureStatus, { backgroundColor: isEnabled ? 'rgba(76,175,80,0.1)' : 'rgba(244,67,54,0.1)' }]}>
                  <Text style={[styles.featureStatusText, { color: isEnabled ? colors.success : colors.error }]}>
                    {isEnabled ? 'ENABLED' : 'DISABLED'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isEnabled}
                onValueChange={() => handleToggle(feature.key)}
                trackColor={{ false: '#767577', true: 'rgba(108,99,255,0.4)' }}
                thumbColor={isEnabled ? colors.primary : '#f4f3f4'}
                ios_backgroundColor="#767577"
              />
            </View>
          );
        })}

        {/* Action Buttons */}
        {hasChanges && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.resetBtn, { borderColor }]}
              onPress={handleReset}>
              <Text style={[styles.resetBtnText, { color: subtextColor }]}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { opacity: isSaving ? 0.7 : 1 }]}
              onPress={handleSave}
              disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {!hasChanges && (
          <View style={[styles.savedNote, { borderColor }]}>
            <Text style={[styles.savedNoteText, { color: subtextColor }]}>✓ All settings are saved and applied</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 16, borderRadius: 12, borderWidth: 1,
    marginBottom: 16, gap: 12,
  },
  infoIcon: { fontSize: 24 },
  infoText: { flex: 1 },
  infoTitle: { fontWeight: '700', fontSize: 15, marginBottom: 4 },
  infoDesc: { fontSize: 13, lineHeight: 18 },
  statsRow: {
    flexDirection: 'row', borderRadius: 12, borderWidth: 1,
    padding: 16, marginBottom: 24,
    justifyContent: 'space-around', alignItems: 'center',
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, height: 40 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  featureCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12,
  },
  featureIcon: {
    width: 48, height: 48, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  featureEmoji: { fontSize: 22 },
  featureInfo: { flex: 1 },
  featureLabel: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  featureDesc: { fontSize: 12, lineHeight: 16, marginBottom: 6 },
  featureStatus: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  featureStatusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  resetBtn: {
    flex: 1, height: 50, borderRadius: 12, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  resetBtnText: { fontWeight: '600', fontSize: 15 },
  saveBtn: {
    flex: 2, height: 50, borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  savedNote: {
    marginTop: 20, padding: 14, borderRadius: 10, borderWidth: 1,
    alignItems: 'center',
  },
  savedNoteText: { fontSize: 13, fontWeight: '500' },
});

export default FeatureConfigScreen;
