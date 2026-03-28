import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useGetMyProfileQuery } from '../../store/api/studentApi';
import { useGetMyAttendanceSummaryQuery } from '../../store/api/attendanceApi';
import { useGetMyResultsQuery } from '../../store/api/examApi';
import { useGetNoticesQuery } from '../../store/api/noticeApi';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import StatCard from '../../components/common/StatCard';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { calculateAttendancePercentage, getAttendanceColor, getGradeColor, getNoticeTypeColor, formatRelativeTime, truncateText } from '../../utils/helpers';

const StudentDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: profile, isLoading, refetch: refetchProfile } = useGetMyProfileQuery();
  const { data: attendanceSummary, refetch: refetchAttendance } = useGetMyAttendanceSummaryQuery();
  const { data: results, refetch: refetchResults } = useGetMyResultsQuery();
  const { data: noticesData, refetch: refetchNotices } = useGetNoticesQuery({ limit: 3 });

  const bgColor = isDark ? colors.background.dark : colors.background.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;
  const cardBg = isDark ? colors.card.dark : colors.card.light;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchProfile(), refetchAttendance(), refetchResults(), refetchNotices()]);
    setRefreshing(false);
  };

  // Calculate overall attendance
  const overallAttendance = attendanceSummary?.length
    ? Math.round(attendanceSummary.reduce((sum, s) => sum + calculateAttendancePercentage(s.attended, s.totalClasses), 0) / attendanceSummary.length)
    : 0;

  // Calculate CGPA (mock from results)
  const cgpa = profile?.cgpa ?? (results?.length
    ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length / 10 * 4) / 4 * 4
    : 0);

  if (isLoading) return <Loader fullScreen isDark={isDark} />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: secondaryColor }]}>Hello,</Text>
            <Text style={[styles.userName, { color: textColor }]}>{user?.name ?? 'Student'}</Text>
            <Text style={[styles.classInfo, { color: colors.primary }]}>
              {profile?.class?.name} {profile?.class?.section} • {profile?.department?.name}
            </Text>
          </View>
          <View style={styles.avatarContainer}>
            <Avatar name={user?.name ?? 'S'} uri={user?.avatar} size={52} />
            <Text style={[styles.rollNo, { color: secondaryColor }]}>{profile?.rollNumber}</Text>
          </View>
        </View>

        {/* Stats */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>My Performance</Text>
        <View style={styles.statsGrid}>
          <StatCard
            label="Attendance"
            value={`${overallAttendance}%`}
            icon="📊"
            color={getAttendanceColor(overallAttendance)}
            isDark={isDark}
            style={styles.statCard}
          />
          <StatCard
            label="CGPA"
            value={cgpa.toFixed(2)}
            icon="🎓"
            color={cgpa >= 7 ? colors.success : cgpa >= 5 ? colors.warning : colors.error}
            isDark={isDark}
            style={styles.statCard}
          />
        </View>
        <View style={styles.statsGrid}>
          <StatCard label="Exams Taken" value={results?.length ?? 0} icon="📝" color={colors.primary} isDark={isDark} style={styles.statCard} />
          <StatCard label="Subjects" value={profile?.class?.subjects?.length ?? 0} icon="📚" color={colors.info} isDark={isDark} style={styles.statCard} />
        </View>

        {/* Attendance Warning */}
        {overallAttendance < 75 && overallAttendance > 0 && (
          <View style={[styles.warningCard, { backgroundColor: `${colors.error}15`, borderColor: colors.error }]}>
            <Text style={{ fontSize: 24 }}>⚠️</Text>
            <View style={styles.warningText}>
              <Text style={[styles.warningTitle, { color: colors.error }]}>Low Attendance</Text>
              <Text style={[styles.warningDesc, { color: secondaryColor }]}>
                Your attendance is {overallAttendance}%. Minimum 75% required.
              </Text>
            </View>
          </View>
        )}

        {/* Subject Attendance Summary */}
        {attendanceSummary && attendanceSummary.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Subject Attendance</Text>
            {attendanceSummary.slice(0, 4).map((s, idx) => {
              const pct = calculateAttendancePercentage(s.attended, s.totalClasses);
              const atColor = getAttendanceColor(pct);
              return (
                <View key={idx} style={[styles.attendanceRow, { backgroundColor: cardBg }, shadow.sm]}>
                  <View style={styles.attendanceLeft}>
                    <Text style={[styles.subjectName, { color: textColor }]}>{s.subject?.name}</Text>
                    <Text style={[styles.classCount, { color: secondaryColor }]}>{s.attended}/{s.totalClasses} classes</Text>
                  </View>
                  <View style={styles.attendanceRight}>
                    <View style={[styles.progressBar, { backgroundColor: isDark ? colors.border.dark : '#E0E0E0' }]}>
                      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: atColor }]} />
                    </View>
                    <Text style={[styles.pctText, { color: atColor }]}>{pct}%</Text>
                  </View>
                </View>
              );
            })}
            <TouchableOpacity onPress={() => navigation.navigate('Attendance')} style={styles.viewAll}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All →</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Recent Results */}
        {results && results.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Recent Results</Text>
            {results.slice(0, 3).map(result => (
              <View key={result._id} style={[styles.resultCard, { backgroundColor: cardBg }, shadow.sm]}>
                <View style={styles.resultInfo}>
                  <Text style={[styles.resultExam, { color: textColor }]}>{result.exam?.name}</Text>
                  <Text style={[styles.resultSub, { color: secondaryColor }]}>{result.exam?.subject?.name}</Text>
                </View>
                <View style={styles.resultScore}>
                  <Text style={[styles.marks, { color: textColor }]}>
                    {result.marksObtained}/{result.exam?.totalMarks}
                  </Text>
                  <Badge label={result.grade} backgroundColor={getGradeColor(result.grade)} size="sm" />
                </View>
              </View>
            ))}
            <TouchableOpacity onPress={() => navigation.navigate('Results')} style={styles.viewAll}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All Results →</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Notices */}
        {noticesData && noticesData.data.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Latest Notices</Text>
            {noticesData.data.map(notice => (
              <View key={notice._id} style={[styles.noticeCard, { backgroundColor: cardBg }, shadow.sm]}>
                <Badge label={notice.type} backgroundColor={getNoticeTypeColor(notice.type)} size="sm" />
                <Text style={[styles.noticeTitle, { color: textColor }]} numberOfLines={1}>{notice.title}</Text>
                <Text style={[styles.noticeTime, { color: secondaryColor }]}>{formatRelativeTime(notice.createdAt)}</Text>
              </View>
            ))}
          </>
        )}

        <View style={{ height: spacing[8] }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[5] },
  greeting: { fontSize: fontSize.sm },
  userName: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  classInfo: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginTop: 2 },
  avatarContainer: { alignItems: 'center', gap: spacing[1] },
  rollNo: { fontSize: fontSize.xs },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, paddingHorizontal: spacing[5], marginBottom: spacing[3], marginTop: spacing[2] },
  statsGrid: { flexDirection: 'row', paddingHorizontal: spacing[5], gap: spacing[3], marginBottom: spacing[3] },
  statCard: { flex: 1 },
  warningCard: { flexDirection: 'row', marginHorizontal: spacing[5], borderRadius: borderRadius.lg, padding: spacing[4], borderWidth: 1.5, gap: spacing[3], marginBottom: spacing[4] },
  warningText: { flex: 1 },
  warningTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  warningDesc: { fontSize: fontSize.sm, marginTop: 2 },
  attendanceRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing[5], marginBottom: spacing[3], borderRadius: borderRadius.lg, padding: spacing[3], gap: spacing[3] },
  attendanceLeft: { flex: 1 },
  subjectName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  classCount: { fontSize: fontSize.xs, marginTop: 2 },
  attendanceRight: { width: 100, alignItems: 'flex-end' },
  progressBar: { width: 80, height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: spacing[1] },
  progressFill: { height: '100%', borderRadius: 3 },
  pctText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  viewAll: { alignItems: 'flex-end', paddingHorizontal: spacing[5], marginBottom: spacing[2] },
  viewAllText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  resultCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: spacing[5], marginBottom: spacing[3], borderRadius: borderRadius.lg, padding: spacing[3] },
  resultInfo: { flex: 1 },
  resultExam: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  resultSub: { fontSize: fontSize.xs, marginTop: 2 },
  resultScore: { alignItems: 'flex-end', gap: spacing[1] },
  marks: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  noticeCard: { marginHorizontal: spacing[5], marginBottom: spacing[3], borderRadius: borderRadius.lg, padding: spacing[3], gap: spacing[1] },
  noticeTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  noticeTime: { fontSize: fontSize.xs },
});

export default StudentDashboardScreen;
