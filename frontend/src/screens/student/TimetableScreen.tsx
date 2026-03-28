import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetMyTimetableQuery } from '../../store/api/timetableApi';
import { useTheme } from '../../hooks/useTheme';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { DAYS_OF_WEEK } from '../../utils/constants';
import { TimetableSlot } from '../../types';

const SUBJECT_COLORS = [colors.primary, colors.secondary, colors.info, colors.success, colors.warning, '#9C27B0', '#FF5722'];

const TimetableScreen: React.FC = () => {
  const { isDark } = useTheme();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK.includes(today) ? today : DAYS_OF_WEEK[0]);

  const { data: timetable, isLoading } = useGetMyTimetableQuery();

  const bgColor = isDark ? colors.background.dark : colors.background.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;
  const cardBg = isDark ? colors.card.dark : colors.card.light;

  const daySlots = (timetable ?? []).filter(s => s.day === selectedDay).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const getSubjectColor = (subjectId: string) => {
    const index = (timetable ?? []).findIndex(s => s.subject?._id === subjectId);
    return SUBJECT_COLORS[Math.abs(index) % SUBJECT_COLORS.length];
  };

  if (isLoading) return <Loader fullScreen isDark={isDark} />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Timetable</Text>
        <Text style={[styles.dateText, { color: secondaryColor }]}>
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </Text>
      </View>

      {/* Day Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daySelectorContainer}>
        {DAYS_OF_WEEK.map(day => {
          const isToday = day === today;
          const isSelected = day === selectedDay;
          const daySlotCount = (timetable ?? []).filter(s => s.day === day).length;
          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayBtn,
                {
                  backgroundColor: isSelected ? colors.primary : isDark ? colors.card.dark : colors.card.light,
                  borderWidth: isToday && !isSelected ? 1.5 : 0,
                  borderColor: colors.primary,
                },
                isSelected && shadow.sm,
              ]}
              onPress={() => setSelectedDay(day)}>
              <Text style={[styles.dayLabel, { color: isSelected ? '#FFF' : secondaryColor }]}>
                {day.slice(0, 3)}
              </Text>
              {daySlotCount > 0 && (
                <View style={[styles.dotIndicator, { backgroundColor: isSelected ? '#FFF' : colors.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Today's label */}
      <View style={styles.selectedDayHeader}>
        <Text style={[styles.selectedDayText, { color: textColor }]}>
          {selectedDay} {selectedDay === today ? '(Today)' : ''}
        </Text>
        <Text style={[styles.classCount, { color: secondaryColor }]}>
          {daySlots.length} class{daySlots.length !== 1 ? 'es' : ''}
        </Text>
      </View>

      {daySlots.length === 0 ? (
        <EmptyState
          icon={selectedDay === today ? '🎉' : '📅'}
          title={selectedDay === today ? 'No classes today!' : 'No classes'}
          description={`Enjoy your ${selectedDay === today ? 'day off' : selectedDay}`}
          isDark={isDark}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {daySlots.map((slot, idx) => {
            const subColor = getSubjectColor(slot.subject?._id ?? idx.toString());
            const isCurrentClass = selectedDay === today && isCurrentTime(slot.startTime, slot.endTime);
            return (
              <View
                key={slot._id ?? idx}
                style={[
                  styles.slotCard,
                  { backgroundColor: cardBg, borderLeftColor: subColor, borderLeftWidth: 4 },
                  isCurrentClass && styles.currentClass,
                  shadow.sm,
                ]}>
                <View style={styles.slotTime}>
                  <Text style={[styles.startTime, { color: subColor }]}>{slot.startTime}</Text>
                  <View style={[styles.timeLine, { backgroundColor: isDark ? colors.border.dark : '#E0E0E0' }]} />
                  <Text style={[styles.endTime, { color: secondaryColor }]}>{slot.endTime}</Text>
                </View>
                <View style={styles.slotContent}>
                  <Text style={[styles.subjectName, { color: textColor }]}>{slot.subject?.name}</Text>
                  <Text style={[styles.subjectCode, { color: subColor }]}>{slot.subject?.code}</Text>
                  {slot.teacher && (
                    <Text style={[styles.teacherName, { color: secondaryColor }]}>
                      👨‍🏫 {slot.teacher?.userId?.name}
                    </Text>
                  )}
                  {slot.room && (
                    <Text style={[styles.room, { color: secondaryColor }]}>🏫 Room {slot.room}</Text>
                  )}
                </View>
                {isCurrentClass && (
                  <View style={[styles.liveBadge, { backgroundColor: colors.success }]}>
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                )}
              </View>
            );
          })}
          <View style={{ height: spacing[8] }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const isCurrentTime = (start: string, end: string): boolean => {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  return nowMinutes >= startH * 60 + startM && nowMinutes <= endH * 60 + endM;
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[2] },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  dateText: { fontSize: fontSize.sm, marginTop: 2 },
  daySelectorContainer: { paddingHorizontal: spacing[5], paddingVertical: spacing[3], gap: spacing[2] },
  dayBtn: { paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderRadius: borderRadius.lg, minWidth: 60, alignItems: 'center' },
  dayLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  dotIndicator: { width: 6, height: 6, borderRadius: 3, marginTop: spacing[1] },
  selectedDayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[5], paddingBottom: spacing[3] },
  selectedDayText: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  classCount: { fontSize: fontSize.sm },
  scroll: { paddingHorizontal: spacing[5] },
  slotCard: { flexDirection: 'row', borderRadius: borderRadius.lg, marginBottom: spacing[3], overflow: 'hidden' },
  currentClass: { borderColor: colors.success, borderWidth: 1 },
  slotTime: { width: 70, padding: spacing[3], alignItems: 'center', justifyContent: 'center' },
  startTime: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  timeLine: { width: 1, height: 20, marginVertical: spacing[1] },
  endTime: { fontSize: fontSize.xs },
  slotContent: { flex: 1, padding: spacing[3] },
  subjectName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: 2 },
  subjectCode: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, marginBottom: spacing[1] },
  teacherName: { fontSize: fontSize.xs, marginBottom: 2 },
  room: { fontSize: fontSize.xs },
  liveBadge: { justifyContent: 'center', paddingHorizontal: spacing[3] },
  liveText: { color: '#FFF', fontSize: 9, fontWeight: fontWeight.extrabold, letterSpacing: 1 },
});

export default TimetableScreen;
