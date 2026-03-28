import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetMyTeacherProfileQuery } from '../../store/api/teacherApi';
import { useGetExamsQuery } from '../../store/api/examApi';
import { useGetMyTimetableQuery } from '../../store/api/timetableApi';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import StatCard from '../../components/common/StatCard';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { formatDate, formatTime } from '../../utils/helpers';

const TeacherDashboardScreen: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: profile, isLoading, refetch: refetchProfile } = useGetMyTeacherProfileQuery();
  const { data: examsData, refetch: refetchExams } = useGetExamsQuery({}, { skip: !profile });
  const { data: timetable, refetch: refetchTimetable } = useGetMyTimetableQuery();

  const bgColor = isDark ? colors.background.dark : colors.background.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;
  const cardBg = isDark ? colors.card.dark : colors.card.light;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchProfile(), refetchExams(), refetchTimetable()]);
    setRefreshing(false);
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaySlots = (timetable ?? []).filter(s => s.day === today);
  const upcomingExams = (examsData?.data ?? []).filter(e => new Date(e.date) >= new Date()).slice(0, 3);

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
            <Text style={[styles.userName, { color: textColor }]}>{user?.name ?? 'Teacher'}</Text>
            <Text style={[styles.dept, { color: colors.primary }]}>{profile?.department?.name ?? ''}</Text>
          </View>
          <Avatar name={user?.name ?? 'T'} uri={user?.avatar} size={52} backgroundColor={colors.secondary} />
        </View>

        {/* Stats */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard label="My Subjects" value={profile?.subjects?.length ?? 0} icon="📚" color={colors.primary} isDark={isDark} style={styles.statCard} />
          <StatCard label="My Classes" value={profile?.classes?.length ?? 0} icon="🏫" color={colors.secondary} isDark={isDark} style={styles.statCard} />
        </View>
        <View style={styles.statsGrid}>
          <StatCard label="Upcoming Exams" value={upcomingExams.length} icon="📝" color={colors.warning} isDark={isDark} style={styles.statCard} />
          <StatCard label="Today's Classes" value={todaySlots.length} icon="✅" color={colors.success} isDark={isDark} style={styles.statCard} />
        </View>

        {/* Today's Schedule */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>Today's Schedule ({today})</Text>
        {todaySlots.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardBg }]}>
            <Text style={{ fontSize: 32 }}>🎉</Text>
            <Text style={[styles.emptyText, { color: secondaryColor }]}>No classes today</Text>
          </View>
        ) : (
          todaySlots.map((slot, idx) => (
            <View key={idx} style={[styles.scheduleCard, { backgroundColor: cardBg }, shadow.sm]}>
              <View style={[styles.timeBlock, { backgroundColor: `${colors.primary}20` }]}>
                <Text style={[styles.timeText, { color: colors.primary }]}>{slot.startTime}</Text>
                <Text style={[styles.timeText, { color: colors.primary }]}>{slot.endTime}</Text>
              </View>
              <View style={styles.scheduleInfo}>
                <Text style={[styles.subjectName, { color: textColor }]}>{slot.subject?.name}</Text>
                <Text style={[styles.className, { color: secondaryColor }]}>{slot.class?.name} {slot.class?.section}</Text>
                {slot.room && <Text style={[styles.room, { color: secondaryColor }]}>Room: {slot.room}</Text>}
              </View>
            </View>
          ))
        )}

        {/* Upcoming Exams */}
        {upcomingExams.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Upcoming Exams</Text>
            {upcomingExams.map(exam => (
              <View key={exam._id} style={[styles.examCard, { backgroundColor: cardBg }, shadow.sm]}>
                <View style={styles.examInfo}>
                  <Text style={[styles.examName, { color: textColor }]}>{exam.name}</Text>
                  <Text style={[styles.examSub, { color: secondaryColor }]}>{exam.subject?.name} • {exam.class?.name}</Text>
                </View>
                <View style={styles.examMeta}>
                  <Text style={[styles.examDate, { color: colors.primary }]}>{formatDate(exam.date)}</Text>
                  <Badge label={exam.type} backgroundColor={colors.info} size="sm" />
                </View>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[5] },
  greeting: { fontSize: fontSize.sm },
  userName: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  dept: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginTop: 2 },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, paddingHorizontal: spacing[5], marginBottom: spacing[3], marginTop: spacing[2] },
  statsGrid: { flexDirection: 'row', paddingHorizontal: spacing[5], gap: spacing[3], marginBottom: spacing[3] },
  statCard: { flex: 1 },
  emptyCard: { marginHorizontal: spacing[5], borderRadius: borderRadius.lg, padding: spacing[6], alignItems: 'center', gap: spacing[2] },
  emptyText: { fontSize: fontSize.md },
  scheduleCard: { flexDirection: 'row', marginHorizontal: spacing[5], marginBottom: spacing[3], borderRadius: borderRadius.lg, padding: spacing[3], gap: spacing[3] },
  timeBlock: { borderRadius: borderRadius.md, padding: spacing[2], minWidth: 64, alignItems: 'center' },
  timeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  scheduleInfo: { flex: 1, justifyContent: 'center' },
  subjectName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  className: { fontSize: fontSize.sm, marginTop: 2 },
  room: { fontSize: fontSize.xs, marginTop: 2 },
  examCard: { flexDirection: 'row', marginHorizontal: spacing[5], marginBottom: spacing[3], borderRadius: borderRadius.lg, padding: spacing[4] },
  examInfo: { flex: 1 },
  examName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  examSub: { fontSize: fontSize.sm, marginTop: 2 },
  examMeta: { alignItems: 'flex-end', gap: spacing[1] },
  examDate: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
});

export default TeacherDashboardScreen;
