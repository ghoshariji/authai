import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetMyAttendanceSummaryQuery } from '../../store/api/attendanceApi';
import { useTheme } from '../../hooks/useTheme';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import { calculateAttendancePercentage, getAttendanceColor } from '../../utils/helpers';
import { AttendanceSummary } from '../../types';

const StudentAttendanceScreen: React.FC = () => {
  const { isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const { data: summary, isLoading, refetch } = useGetMyAttendanceSummaryQuery();

  const bgColor = isDark ? colors.background.dark : colors.background.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;
  const cardBg = isDark ? colors.card.dark : colors.card.light;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const overallPct = summary?.length
    ? Math.round(summary.reduce((sum, s) => sum + calculateAttendancePercentage(s.attended, s.totalClasses), 0) / summary.length)
    : 0;

  const overallColor = getAttendanceColor(overallPct);

  const renderItem = ({ item }: { item: AttendanceSummary }) => {
    const pct = calculateAttendancePercentage(item.attended, item.totalClasses);
    const atColor = getAttendanceColor(pct);
    return (
      <View style={[styles.card, { backgroundColor: cardBg }, shadow.sm]}>
        <View style={styles.cardHeader}>
          <View style={styles.subjectInfo}>
            <Text style={[styles.subjectName, { color: textColor }]}>{item.subject?.name}</Text>
            <Text style={[styles.subjectCode, { color: colors.primary }]}>{item.subject?.code}</Text>
          </View>
          <View style={[styles.pctBadge, { backgroundColor: `${atColor}20` }]}>
            <Text style={[styles.pctText, { color: atColor }]}>{pct}%</Text>
          </View>
        </View>
        <View style={[styles.progressBar, { backgroundColor: isDark ? colors.border.dark : '#E0E0E0' }]}>
          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: atColor }]} />
        </View>
        <View style={styles.cardFooter}>
          <Text style={[styles.footerText, { color: secondaryColor }]}>
            Present: {item.attended}
          </Text>
          <Text style={[styles.footerText, { color: secondaryColor }]}>
            Absent: {item.totalClasses - item.attended}
          </Text>
          <Text style={[styles.footerText, { color: secondaryColor }]}>
            Total: {item.totalClasses}
          </Text>
        </View>
        {pct < 75 && (
          <View style={[styles.warningBanner, { backgroundColor: `${colors.error}10` }]}>
            <Text style={{ fontSize: 12, color: colors.error }}>
              ⚠️ Need {Math.ceil((0.75 * item.totalClasses - item.attended) / 0.25)} more classes to reach 75%
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: textColor }]}>Attendance</Text>
      </View>

      {/* Overall Gauge */}
      {summary && summary.length > 0 && (
        <View style={[styles.overallCard, { backgroundColor: `${overallColor}15`, borderColor: overallColor }]}>
          <View style={styles.overallLeft}>
            <Text style={[styles.overallLabel, { color: secondaryColor }]}>Overall Attendance</Text>
            <Text style={[styles.overallPct, { color: overallColor }]}>{overallPct}%</Text>
            <Text style={[styles.overallStatus, { color: overallColor }]}>
              {overallPct >= 75 ? '✓ Good Standing' : '⚠️ Below Required'}
            </Text>
          </View>
          <View style={styles.overallRight}>
            <View style={styles.circleGauge}>
              <View style={[styles.circleInner, { borderColor: overallColor }]}>
                <Text style={[styles.circleText, { color: overallColor }]}>{overallPct}%</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {isLoading ? (
        <Loader isDark={isDark} />
      ) : (
        <FlatList
          data={summary ?? []}
          keyExtractor={(_, idx) => idx.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState icon="📊" title="No attendance data" description="Attendance will appear here once classes begin" isDark={isDark} />
          }
          ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: { paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[2] },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  overallCard: {
    margin: spacing[5],
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  overallLeft: { flex: 1 },
  overallLabel: { fontSize: fontSize.sm },
  overallPct: { fontSize: fontSize['4xl'], fontWeight: fontWeight.extrabold, marginTop: spacing[1] },
  overallStatus: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginTop: spacing[1] },
  overallRight: { alignItems: 'center', justifyContent: 'center' },
  circleGauge: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
  circleInner: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, justifyContent: 'center', alignItems: 'center' },
  circleText: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  list: { paddingHorizontal: spacing[5], paddingBottom: spacing[8] },
  card: { borderRadius: borderRadius.lg, padding: spacing[4] },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[3] },
  subjectInfo: { flex: 1 },
  subjectName: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  subjectCode: { fontSize: fontSize.sm, marginTop: 2 },
  pctBadge: { paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: borderRadius.full },
  pctText: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: spacing[3] },
  progressFill: { height: '100%', borderRadius: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: fontSize.sm },
  warningBanner: { marginTop: spacing[3], borderRadius: borderRadius.sm, padding: spacing[2] },
});

export default StudentAttendanceScreen;
