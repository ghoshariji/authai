import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useGetCollegeQuery, useToggleCollegeStatusMutation } from '../../store/api/collegeApi';
import { useTheme } from '../../hooks/useTheme';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import Header from '../../components/common/Header';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { getPlanColor, getStatusColor, formatDate } from '../../utils/helpers';
import { PLAN_PRICES } from '../../utils/constants';

type RouteParams = { collegeId: string };

const CollegeDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const { collegeId } = route.params;
  const [confirmToggle, setConfirmToggle] = useState(false);

  const { data: college, isLoading } = useGetCollegeQuery(collegeId);
  const [toggleStatus, { isLoading: toggling }] = useToggleCollegeStatusMutation();

  const bgColor = isDark ? colors.background.dark : colors.background.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;
  const cardBg = isDark ? colors.card.dark : colors.card.light;

  const handleToggleStatus = async () => {
    try {
      await toggleStatus(collegeId).unwrap();
      Toast.show({ type: 'success', text1: 'Status Updated' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update status' });
    }
    setConfirmToggle(false);
  };

  if (isLoading) return <Loader fullScreen isDark={isDark} />;
  if (!college) return null;

  const usagePercent = (used: number, limit: number) => Math.min((used / limit) * 100, 100);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <Header
        title="College Details"
        onBack={() => navigation.goBack()}
        isDark={isDark}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* College Header */}
        <View style={[styles.profileCard, { backgroundColor: cardBg }, shadow.md]}>
          <Avatar name={college.name} uri={college.logo} size={72} backgroundColor={getPlanColor(college.subscription.plan)} />
          <View style={styles.profileInfo}>
            <Text style={[styles.collegeName, { color: textColor }]}>{college.name}</Text>
            <Text style={[styles.collegeEmail, { color: secondaryColor }]}>{college.email}</Text>
            <View style={styles.badges}>
              <Badge label={college.subscription.plan} backgroundColor={getPlanColor(college.subscription.plan)} />
              <Badge
                label={college.isActive ? 'Active' : 'Inactive'}
                backgroundColor={college.isActive ? colors.success : colors.error}
              />
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.section, { backgroundColor: cardBg }, shadow.sm]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Statistics</Text>
          <View style={styles.statsRow}>
            {[
              { label: 'Students', value: college.studentCount ?? 0, icon: '🎓' },
              { label: 'Teachers', value: college.teacherCount ?? 0, icon: '👨‍🏫' },
              { label: 'Admins', value: college.adminCount ?? 0, icon: '👤' },
            ].map(stat => (
              <View key={stat.label} style={styles.statBox}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
                <Text style={[styles.statValue, { color: colors.primary }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: secondaryColor }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Subscription */}
        <View style={[styles.section, { backgroundColor: cardBg }, shadow.sm]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Subscription</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: secondaryColor }]}>Plan</Text>
            <Badge label={college.subscription.plan} backgroundColor={getPlanColor(college.subscription.plan)} />
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: secondaryColor }]}>Status</Text>
            <Badge
              label={college.subscription.status}
              backgroundColor={getStatusColor(college.subscription.status)}
            />
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: secondaryColor }]}>Renews</Text>
            <Text style={[styles.infoValue, { color: textColor }]}>
              {formatDate(college.subscription.currentPeriodEnd)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: secondaryColor }]}>Monthly Revenue</Text>
            <Text style={[styles.infoValue, { color: colors.success, fontWeight: fontWeight.bold }]}>
              ${PLAN_PRICES[college.subscription.plan]}/mo
            </Text>
          </View>

          {/* Usage */}
          <Text style={[styles.usageTitle, { color: textColor }]}>Usage</Text>
          {[
            { label: 'Students', used: college.subscription.usage?.students ?? 0, limit: college.subscription.limits.students },
            { label: 'Teachers', used: college.subscription.usage?.teachers ?? 0, limit: college.subscription.limits.teachers },
          ].map(u => (
            <View key={u.label} style={styles.usageItem}>
              <View style={styles.usageHeader}>
                <Text style={[styles.usageLabel, { color: secondaryColor }]}>{u.label}</Text>
                <Text style={[styles.usageCount, { color: textColor }]}>{u.used}/{u.limit}</Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: isDark ? colors.border.dark : colors.border.light }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${usagePercent(u.used, u.limit)}%`,
                      backgroundColor: usagePercent(u.used, u.limit) > 80 ? colors.error : colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* College Info */}
        <View style={[styles.section, { backgroundColor: cardBg }, shadow.sm]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Information</Text>
          {[
            { label: 'College Code', value: college.code },
            { label: 'Phone', value: college.phone ?? 'N/A' },
            { label: 'Address', value: college.address ?? 'N/A' },
            { label: 'Registered', value: formatDate(college.createdAt) },
          ].map(info => (
            <View key={info.label} style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: secondaryColor }]}>{info.label}</Text>
              <Text style={[styles.infoValue, { color: textColor }]} numberOfLines={2}>{info.value}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title={college.isActive ? 'Deactivate College' : 'Activate College'}
            onPress={() => setConfirmToggle(true)}
            variant={college.isActive ? 'danger' : 'primary'}
            loading={toggling}
            fullWidth
            size="lg"
          />
        </View>

        <View style={{ height: spacing[8] }} />
      </ScrollView>

      <ConfirmDialog
        visible={confirmToggle}
        title={college.isActive ? 'Deactivate College' : 'Activate College'}
        message={`Are you sure you want to ${college.isActive ? 'deactivate' : 'activate'} ${college.name}?`}
        confirmLabel={college.isActive ? 'Deactivate' : 'Activate'}
        onConfirm={handleToggleStatus}
        onCancel={() => setConfirmToggle(false)}
        isDark={isDark}
        danger={college.isActive}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing[5],
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    gap: spacing[4],
  },
  profileInfo: { flex: 1 },
  collegeName: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: 4 },
  collegeEmail: { fontSize: fontSize.sm, marginBottom: spacing[2] },
  badges: { flexDirection: 'row', gap: spacing[2] },
  section: {
    marginHorizontal: spacing[5],
    marginBottom: spacing[4],
    borderRadius: borderRadius.lg,
    padding: spacing[4],
  },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginBottom: spacing[4] },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statBox: { alignItems: 'center' },
  statIcon: { fontSize: 28, marginBottom: spacing[1] },
  statValue: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  statLabel: { fontSize: fontSize.xs, marginTop: 2 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.1)',
  },
  infoLabel: { fontSize: fontSize.sm },
  infoValue: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, maxWidth: '60%', textAlign: 'right' },
  usageTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, marginTop: spacing[4], marginBottom: spacing[3] },
  usageItem: { marginBottom: spacing[3] },
  usageHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing[1] },
  usageLabel: { fontSize: fontSize.sm },
  usageCount: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  actions: { paddingHorizontal: spacing[5], marginBottom: spacing[4] },
});

export default CollegeDetailScreen;
