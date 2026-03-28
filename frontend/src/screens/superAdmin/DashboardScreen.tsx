import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetSuperAdminStatsQuery, useGetCollegesQuery } from '../../store/api/collegeApi';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import Avatar from '../../components/common/Avatar';
import { formatCurrency, getPlanColor, formatDate } from '../../utils/helpers';
import { College } from '../../types';

const SuperAdminDashboardScreen: React.FC = () => {
  const { isDark, colors: tc } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useGetSuperAdminStatsQuery();
  const { data: collegesData, isLoading: collegesLoading, refetch: refetchColleges } = useGetCollegesQuery({ page: 1, limit: 5 });

  const bgColor = isDark ? colors.background.dark : colors.background.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;
  const cardBg = isDark ? colors.card.dark : colors.card.light;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchColleges()]);
    setRefreshing(false);
  };

  const renderCollegeItem = ({ item }: { item: College }) => (
    <View style={[styles.collegeItem, { backgroundColor: cardBg }, shadow.sm]}>
      <Avatar name={item.name} size={44} />
      <View style={styles.collegeInfo}>
        <Text style={[styles.collegeName, { color: textColor }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.collegeCode, { color: secondaryColor }]}>{item.code}</Text>
      </View>
      <View style={styles.collegeMeta}>
        <Badge
          label={item.subscription.plan}
          backgroundColor={getPlanColor(item.subscription.plan)}
          size="sm"
        />
        <Text style={[styles.studentCount, { color: secondaryColor }]}>
          {item.studentCount ?? 0} students
        </Text>
      </View>
    </View>
  );

  if (statsLoading) return <Loader fullScreen isDark={isDark} />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: secondaryColor }]}>Good day,</Text>
            <Text style={[styles.userName, { color: textColor }]}>{user?.name ?? 'Super Admin'}</Text>
          </View>
          <Avatar name={user?.name ?? 'SA'} uri={user?.avatar} size={48} />
        </View>

        {/* Stats Grid */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            label="Total Colleges"
            value={stats?.totalColleges ?? 0}
            icon="🏫"
            color={colors.primary}
            isDark={isDark}
            style={styles.statCard}
          />
          <StatCard
            label="Active Subs"
            value={stats?.activeSubscriptions ?? 0}
            icon="✅"
            color={colors.success}
            isDark={isDark}
            style={styles.statCard}
          />
        </View>
        <View style={styles.statsGrid}>
          <StatCard
            label="Total Revenue"
            value={formatCurrency(stats?.totalRevenue ?? 0)}
            icon="💰"
            color={colors.warning}
            isDark={isDark}
            style={styles.statCard}
          />
          <StatCard
            label="Total Users"
            value={stats?.totalUsers ?? 0}
            icon="👥"
            color={colors.info}
            isDark={isDark}
            style={styles.statCard}
          />
        </View>

        {/* Revenue by Plan */}
        {stats?.collegesByPlan && (
          <View>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Colleges by Plan</Text>
            <View style={[styles.planBreakdown, { backgroundColor: cardBg }, shadow.md]}>
              {stats.collegesByPlan.map(item => (
                <View key={item.plan} style={styles.planRow}>
                  <View style={styles.planLeft}>
                    <View style={[styles.planDot, { backgroundColor: getPlanColor(item.plan) }]} />
                    <Text style={[styles.planName, { color: textColor }]}>{item.plan}</Text>
                  </View>
                  <View style={styles.planBar}>
                    <View
                      style={[
                        styles.planBarFill,
                        {
                          backgroundColor: getPlanColor(item.plan),
                          width: `${(item.count / (stats.totalColleges || 1)) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.planCount, { color: textColor }]}>{item.count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Colleges */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>Recent Colleges</Text>
        {collegesLoading ? (
          <Loader isDark={isDark} />
        ) : (
          <View style={styles.collegesList}>
            {(collegesData?.data ?? []).map(college => renderCollegeItem({ item: college }))}
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
  planBreakdown: {
    marginHorizontal: spacing[5],
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  planLeft: { flexDirection: 'row', alignItems: 'center', width: 100 },
  planDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing[2] },
  planName: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  planBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginHorizontal: spacing[2],
    overflow: 'hidden',
  },
  planBarFill: { height: '100%', borderRadius: 4 },
  planCount: { width: 28, fontSize: fontSize.sm, fontWeight: fontWeight.bold, textAlign: 'right' },
  collegesList: { paddingHorizontal: spacing[5], gap: spacing[3] },
  collegeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    gap: spacing[3],
  },
  collegeInfo: { flex: 1 },
  collegeName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  collegeCode: { fontSize: fontSize.xs, marginTop: 2 },
  collegeMeta: { alignItems: 'flex-end', gap: spacing[1] },
  studentCount: { fontSize: fontSize.xs },
});

export default SuperAdminDashboardScreen;
