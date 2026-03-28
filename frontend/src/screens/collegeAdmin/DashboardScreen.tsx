import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useGetCollegeStatsQuery } from '../../store/api/collegeApi';
import { useGetNoticesQuery } from '../../store/api/noticeApi';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import Avatar from '../../components/common/Avatar';
import { getPlanColor, getNoticeTypeColor, formatRelativeTime, truncateText } from '../../utils/helpers';

const CollegeAdminDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useGetCollegeStatsQuery();
  const { data: noticesData, refetch: refetchNotices } = useGetNoticesQuery({ page: 1, limit: 3 });

  const bgColor = isDark ? colors.background.dark : colors.background.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;
  const cardBg = isDark ? colors.card.dark : colors.card.light;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchNotices()]);
    setRefreshing(false);
  };

  if (statsLoading) return <Loader fullScreen isDark={isDark} />;

  const quickActions = [
    { label: 'Add Student', icon: '🎓', screen: 'AddStudent', color: colors.primary },
    { label: 'Add Teacher', icon: '👨‍🏫', screen: 'AddTeacher', color: colors.secondary },
    { label: 'Post Notice', icon: '📢', screen: 'Notices', color: colors.info },
    { label: 'Subscription', icon: '💳', screen: 'Subscription', color: colors.warning },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: secondaryColor }]}>Welcome back,</Text>
            <Text style={[styles.userName, { color: textColor }]}>{user?.name ?? 'Admin'}</Text>
          </View>
          <View style={styles.headerRight}>
            <Badge
              label={stats?.planType ?? 'FREE'}
              backgroundColor={getPlanColor(stats?.planType ?? 'FREE')}
              style={styles.planBadge}
            />
            <Avatar name={user?.name ?? 'A'} uri={user?.avatar} size={44} />
          </View>
        </View>

        {/* Stats */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Students" value={stats?.totalStudents ?? 0} icon="🎓" color={colors.primary} isDark={isDark} style={styles.statCard} />
          <StatCard label="Teachers" value={stats?.totalTeachers ?? 0} icon="👨‍🏫" color={colors.secondary} isDark={isDark} style={styles.statCard} />
        </View>
        <View style={styles.statsGrid}>
          <StatCard label="Departments" value={stats?.totalDepartments ?? 0} icon="🏛️" color={colors.info} isDark={isDark} style={styles.statCard} />
          <StatCard label="Attendance" value={`${stats?.attendanceRate ?? 0}%`} icon="📊" color={colors.success} isDark={isDark} style={styles.statCard} />
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {quickActions.map(action => (
            <TouchableOpacity
              key={action.label}
              style={[styles.quickAction, { backgroundColor: `${action.color}15` }]}
              onPress={() => navigation.navigate(action.screen)}>
              <Text style={styles.quickActionIcon}>{action.icon}</Text>
              <Text style={[styles.quickActionLabel, { color: action.color }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Notices */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>Recent Notices</Text>
        {(noticesData?.data ?? []).map(notice => (
          <TouchableOpacity
            key={notice._id}
            style={[styles.noticeCard, { backgroundColor: cardBg }, shadow.sm]}
            onPress={() => navigation.navigate('Notices')}>
            <View style={[styles.noticeType, { backgroundColor: `${getNoticeTypeColor(notice.type)}20` }]}>
              <Text style={[styles.noticeTypeText, { color: getNoticeTypeColor(notice.type) }]}>{notice.type}</Text>
            </View>
            <View style={styles.noticeContent}>
              <Text style={[styles.noticeTitle, { color: textColor }]} numberOfLines={1}>{notice.title}</Text>
              <Text style={[styles.noticePreview, { color: secondaryColor }]} numberOfLines={2}>
                {truncateText(notice.content, 100)}
              </Text>
              <Text style={[styles.noticeTime, { color: secondaryColor }]}>{formatRelativeTime(notice.createdAt)}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Subscription Info */}
        {stats && (
          <View style={[styles.subscriptionCard, { backgroundColor: `${getPlanColor(stats.planType)}15`, borderColor: getPlanColor(stats.planType) }]}>
            <Text style={{ fontSize: 32 }}>💳</Text>
            <View style={styles.subInfo}>
              <Text style={[styles.subPlan, { color: getPlanColor(stats.planType) }]}>{stats.planType} Plan</Text>
              <Text style={[styles.subStatus, { color: secondaryColor }]}>
                Status: {stats.subscriptionStatus}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.upgradeBtn, { backgroundColor: getPlanColor(stats.planType) }]}
              onPress={() => navigation.navigate('Subscription')}>
              <Text style={styles.upgradeBtnText}>Manage</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: spacing[8] }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[5],
  },
  greeting: { fontSize: fontSize.sm },
  userName: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  planBadge: { marginRight: spacing[1] },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    paddingHorizontal: spacing[5],
    marginBottom: spacing[3],
    marginTop: spacing[2],
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing[5],
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  statCard: { flex: 1 },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing[5],
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  quickAction: {
    width: '47%',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  quickActionIcon: { fontSize: 32, marginBottom: spacing[2] },
  quickActionLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, textAlign: 'center' },
  noticeCard: {
    flexDirection: 'row',
    marginHorizontal: spacing[5],
    marginBottom: spacing[3],
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    gap: spacing[3],
  },
  noticeType: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    minWidth: 60,
    alignItems: 'center',
  },
  noticeTypeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  noticeContent: { flex: 1 },
  noticeTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, marginBottom: 2 },
  noticePreview: { fontSize: fontSize.xs, marginBottom: 4 },
  noticeTime: { fontSize: fontSize.xs },
  subscriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing[5],
    marginTop: spacing[4],
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1.5,
    gap: spacing[3],
  },
  subInfo: { flex: 1 },
  subPlan: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  subStatus: { fontSize: fontSize.sm, marginTop: 2 },
  upgradeBtn: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
  },
  upgradeBtnText: { color: '#FFFFFF', fontSize: fontSize.sm, fontWeight: fontWeight.bold },
});

export default CollegeAdminDashboardScreen;
