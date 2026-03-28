import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetStudentAttendanceSummaryQuery } from '../../store/api/attendanceApi';
import { useGetMyTeacherProfileQuery } from '../../store/api/teacherApi';
import { useTheme } from '../../hooks/useTheme';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { calculateAttendancePercentage, getAttendanceColor } from '../../utils/helpers';
import { AttendanceSummary } from '../../types';

const AttendanceReportScreen: React.FC = () => {
  const { isDark } = useTheme();
  const [selectedClassId, setSelectedClassId] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: profile } = useGetMyTeacherProfileQuery();
  const { data: summaryData, isLoading, refetch } = useGetStudentAttendanceSummaryQuery(
    { subjectId: undefined },
    { skip: false },
  );

  const bgColor = isDark ? colors.background.dark : colors.background.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;
  const cardBg = isDark ? colors.card.dark : colors.card.light;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: AttendanceSummary }) => {
    const pct = calculateAttendancePercentage(item.attended, item.totalClasses);
    const atColor = getAttendanceColor(pct);
    return (
      <View style={[styles.item, { backgroundColor: cardBg }, shadow.sm]}>
        <View style={styles.itemLeft}>
          <Text style={[styles.subjectName, { color: textColor }]}>{item.subject?.name}</Text>
          <Text style={[styles.subjectCode, { color: secondaryColor }]}>{item.subject?.code}</Text>
          <Text style={[styles.classes, { color: secondaryColor }]}>
            {item.attended}/{item.totalClasses} classes
          </Text>
        </View>
        <View style={styles.itemRight}>
          <View style={styles.gaugeContainer}>
            <View style={[styles.gauge, { backgroundColor: isDark ? colors.border.dark : '#E0E0E0' }]}>
              <View style={[styles.gaugeFill, { width: `${pct}%`, backgroundColor: atColor }]} />
            </View>
            <Text style={[styles.pctText, { color: atColor }]}>{pct}%</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Attendance Report</Text>
      </View>

      {/* Class Filter */}
      {profile?.classes && profile.classes.length > 0 && (
        <FlatList
          horizontal
          data={[{ _id: '', name: 'All', section: '' }, ...(profile.classes ?? [])]}
          keyExtractor={item => item._id || 'all'}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, { backgroundColor: selectedClassId === item._id ? colors.primary : `${colors.primary}15` }]}
              onPress={() => setSelectedClassId(item._id)}>
              <Text style={[styles.filterText, { color: selectedClassId === item._id ? '#FFF' : colors.primary }]}>
                {item.name} {item.section}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filters}
          showsHorizontalScrollIndicator={false}
        />
      )}

      {isLoading ? (
        <Loader isDark={isDark} />
      ) : (
        <FlatList
          data={summaryData ?? []}
          keyExtractor={(_, idx) => idx.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState icon="📊" title="No attendance data" description="Mark attendance to see reports" isDark={isDark} />
          }
          ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
          ListHeaderComponent={
            <View style={[styles.legend, { backgroundColor: cardBg }]}>
              {[{ color: colors.success, label: '≥75% Good' }, { color: colors.warning, label: '60-74% Warning' }, { color: colors.error, label: '<60% Critical' }].map(l => (
                <View key={l.label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                  <Text style={[styles.legendLabel, { color: secondaryColor }]}>{l.label}</Text>
                </View>
              ))}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[2] },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  filters: { paddingHorizontal: spacing[5], paddingBottom: spacing[3], gap: spacing[2] },
  filterChip: { paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: borderRadius.full },
  filterText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  list: { paddingHorizontal: spacing[5], paddingBottom: spacing[8] },
  legend: { flexDirection: 'row', borderRadius: borderRadius.md, padding: spacing[3], marginBottom: spacing[3], justifyContent: 'space-around' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: fontSize.xs },
  item: { flexDirection: 'row', alignItems: 'center', padding: spacing[4], borderRadius: borderRadius.lg, gap: spacing[3] },
  itemLeft: { flex: 1 },
  subjectName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  subjectCode: { fontSize: fontSize.xs, marginTop: 2 },
  classes: { fontSize: fontSize.xs, marginTop: 4 },
  itemRight: { alignItems: 'flex-end', minWidth: 100 },
  gaugeContainer: { width: 100 },
  gauge: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: spacing[1] },
  gaugeFill: { height: '100%', borderRadius: 4 },
  pctText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, textAlign: 'right' },
});

export default AttendanceReportScreen;
