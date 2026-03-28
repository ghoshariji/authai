import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetSuperAdminStatsQuery } from '../../store/api/collegeApi';
import { useTheme } from '../../hooks/useTheme';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import Loader from '../../components/common/Loader';
import { formatCurrency, getPlanColor } from '../../utils/helpers';

const { width } = Dimensions.get('window');

const AnalyticsScreen: React.FC = () => {
  const { isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const { data: stats, isLoading, refetch } = useGetSuperAdminStatsQuery();

  const bgColor = isDark ? colors.background.dark : colors.background.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;
  const cardBg = isDark ? colors.card.dark : colors.card.light;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) return <Loader fullScreen isDark={isDark} />;

  const maxRevenue = Math.max(...(stats?.revenueByMonth?.map(r => r.revenue) ?? [1]));
  const chartWidth = width - spacing[5] * 2 - spacing[4] * 2;
  const barWidth = stats?.revenueByMonth?.length
    ? (chartWidth / stats.revenueByMonth.length) - 8
    : 24;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}>

        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Analytics</Text>
          <Text style={[styles.subtitle, { color: secondaryColor }]}>Platform performance overview</Text>
        </View>

        {/* Key Metrics */}
        <View style={[styles.card, { backgroundColor: cardBg }, shadow.md]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>Key Metrics</Text>
          <View style={styles.metricsGrid}>
            {[
              { label: 'Total Colleges', value: stats?.totalColleges ?? 0, icon: '🏫', color: colors.primary },
              { label: 'Active Subscriptions', value: stats?.activeSubscriptions ?? 0, icon: '✅', color: colors.success },
              { label: 'Total Revenue', value: formatCurrency(stats?.totalRevenue ?? 0), icon: '💰', color: colors.warning },
              { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: '👥', color: colors.info },
            ].map(metric => (
              <View key={metric.label} style={[styles.metricBox, { backgroundColor: `${metric.color}15`, borderRadius: borderRadius.md }]}>
                <Text style={styles.metricIcon}>{metric.icon}</Text>
                <Text style={[styles.metricValue, { color: metric.color }]}>{metric.value}</Text>
                <Text style={[styles.metricLabel, { color: secondaryColor }]}>{metric.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Revenue Chart */}
        {stats?.revenueByMonth && stats.revenueByMonth.length > 0 && (
          <View style={[styles.card, { backgroundColor: cardBg }, shadow.md]}>
            <Text style={[styles.cardTitle, { color: textColor }]}>Monthly Revenue</Text>
            <View style={styles.chart}>
              {stats.revenueByMonth.map((item, index) => {
                const barH = maxRevenue > 0 ? (item.revenue / maxRevenue) * 120 : 0;
                return (
                  <View key={index} style={styles.barWrapper}>
                    <Text style={[styles.barValue, { color: colors.primary }]}>
                      ${item.revenue >= 1000 ? `${(item.revenue / 1000).toFixed(1)}k` : item.revenue}
                    </Text>
                    <View
                      style={[
                        styles.bar,
                        { height: barH || 4, width: barWidth, backgroundColor: colors.primary },
                      ]}
                    />
                    <Text style={[styles.barLabel, { color: secondaryColor }]}>
                      {item.month.slice(0, 3)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Plan Distribution */}
        {stats?.collegesByPlan && (
          <View style={[styles.card, { backgroundColor: cardBg }, shadow.md]}>
            <Text style={[styles.cardTitle, { color: textColor }]}>Colleges by Plan</Text>
            {stats.collegesByPlan.map(item => {
              const total = stats.totalColleges || 1;
              const pct = Math.round((item.count / total) * 100);
              return (
                <View key={item.plan} style={styles.planRow}>
                  <View style={styles.planLeft}>
                    <View style={[styles.planDot, { backgroundColor: getPlanColor(item.plan) }]} />
                    <Text style={[styles.planName, { color: textColor }]}>{item.plan}</Text>
                  </View>
                  <View style={styles.planBarWrapper}>
                    <View style={[styles.planBar, { backgroundColor: isDark ? colors.border.dark : '#E0E0E0' }]}>
                      <View style={[styles.planBarFill, { width: `${pct}%`, backgroundColor: getPlanColor(item.plan) }]} />
                    </View>
                  </View>
                  <Text style={[styles.planStat, { color: textColor }]}>{item.count} ({pct}%)</Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: spacing[8] }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[2] },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  subtitle: { fontSize: fontSize.sm, marginTop: 2 },
  card: {
    margin: spacing[5],
    marginBottom: 0,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginTop: spacing[4],
  },
  cardTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginBottom: spacing[4] },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  metricBox: { width: '47%', padding: spacing[3], alignItems: 'center' },
  metricIcon: { fontSize: 28, marginBottom: spacing[1] },
  metricValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  metricLabel: { fontSize: fontSize.xs, textAlign: 'center', marginTop: 2 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 160 },
  barWrapper: { alignItems: 'center', gap: spacing[1] },
  bar: { borderRadius: 4 },
  barValue: { fontSize: 8, fontWeight: fontWeight.bold },
  barLabel: { fontSize: 9 },
  planRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing[3] },
  planLeft: { flexDirection: 'row', alignItems: 'center', width: 100 },
  planDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing[2] },
  planName: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  planBarWrapper: { flex: 1, marginHorizontal: spacing[2] },
  planBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  planBarFill: { height: '100%', borderRadius: 4 },
  planStat: { width: 70, fontSize: fontSize.xs, textAlign: 'right' },
});

export default AnalyticsScreen;
