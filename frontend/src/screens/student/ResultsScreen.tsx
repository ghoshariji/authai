import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetMyResultsQuery } from '../../store/api/examApi';
import { useTheme } from '../../hooks/useTheme';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import Badge from '../../components/common/Badge';
import { getGradeColor, formatDate, getExamTypeLabel } from '../../utils/helpers';
import { Result } from '../../types';

const StudentResultsScreen: React.FC = () => {
  const { isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const { data: results, isLoading, refetch } = useGetMyResultsQuery();

  const bgColor = isDark ? colors.background.dark : colors.background.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;
  const cardBg = isDark ? colors.card.dark : colors.card.light;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const avgPercentage = results?.length
    ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
    : 0;

  const renderItem = ({ item }: { item: Result }) => {
    const gradeColor = getGradeColor(item.grade);
    const isPassed = item.marksObtained >= (item.exam?.passingMarks ?? 0);

    return (
      <View style={[styles.card, { backgroundColor: cardBg }, shadow.sm]}>
        <View style={styles.cardLeft}>
          <View style={[styles.gradeBox, { backgroundColor: `${gradeColor}20` }]}>
            <Text style={[styles.gradeText, { color: gradeColor }]}>{item.grade}</Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.examName, { color: textColor }]}>{item.exam?.name}</Text>
          <Text style={[styles.subject, { color: colors.primary }]}>{item.exam?.subject?.name}</Text>
          <Text style={[styles.date, { color: secondaryColor }]}>{formatDate(item.createdAt)}</Text>
          <View style={styles.marksRow}>
            <View style={[styles.progressBar, { backgroundColor: isDark ? colors.border.dark : '#E0E0E0' }]}>
              <View style={[styles.progressFill, { width: `${item.percentage}%`, backgroundColor: gradeColor }]} />
            </View>
            <Text style={[styles.marksText, { color: textColor }]}>
              {item.marksObtained}/{item.exam?.totalMarks}
            </Text>
          </View>
          <View style={styles.footer}>
            <Badge label={getExamTypeLabel(item.exam?.type ?? '')} backgroundColor={colors.info} size="sm" />
            <Badge
              label={isPassed ? 'PASSED' : 'FAILED'}
              backgroundColor={isPassed ? colors.success : colors.error}
              size="sm"
            />
          </View>
        </View>
        <View style={styles.pctContainer}>
          <Text style={[styles.pct, { color: gradeColor }]}>{item.percentage}%</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: textColor }]}>Results</Text>
        {results && results.length > 0 && (
          <Text style={[styles.avg, { color: secondaryColor }]}>Avg: {avgPercentage}%</Text>
        )}
      </View>

      {/* Summary Card */}
      {results && results.length > 0 && (
        <View style={[styles.summaryCard, { backgroundColor: cardBg }, shadow.md]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{results.length}</Text>
            <Text style={[styles.summaryLabel, { color: secondaryColor }]}>Total Exams</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {results.filter(r => r.marksObtained >= (r.exam?.passingMarks ?? 0)).length}
            </Text>
            <Text style={[styles.summaryLabel, { color: secondaryColor }]}>Passed</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: getGradeColor(avgPercentage >= 90 ? 'A' : avgPercentage >= 70 ? 'B' : avgPercentage >= 50 ? 'C' : 'F') }]}>
              {avgPercentage}%
            </Text>
            <Text style={[styles.summaryLabel, { color: secondaryColor }]}>Average</Text>
          </View>
        </View>
      )}

      {isLoading ? (
        <Loader isDark={isDark} />
      ) : (
        <FlatList
          data={results ?? []}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState icon="📊" title="No results yet" description="Your exam results will appear here" isDark={isDark} />
          }
          ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[2] },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  avg: { fontSize: fontSize.sm },
  summaryCard: { flexDirection: 'row', margin: spacing[5], borderRadius: borderRadius.xl, padding: spacing[4] },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  summaryLabel: { fontSize: fontSize.xs, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: 'rgba(128,128,128,0.2)' },
  list: { paddingHorizontal: spacing[5], paddingBottom: spacing[8] },
  card: { flexDirection: 'row', borderRadius: borderRadius.lg, padding: spacing[4], gap: spacing[3] },
  cardLeft: { justifyContent: 'center' },
  gradeBox: { width: 52, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  gradeText: { fontSize: fontSize.xl, fontWeight: fontWeight.extrabold },
  cardContent: { flex: 1 },
  examName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: 2 },
  subject: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginBottom: 2 },
  date: { fontSize: fontSize.xs, marginBottom: spacing[2] },
  marksRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] },
  progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  marksText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, minWidth: 60, textAlign: 'right' },
  footer: { flexDirection: 'row', gap: spacing[2] },
  pctContainer: { justifyContent: 'center' },
  pct: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
});

export default StudentResultsScreen;
