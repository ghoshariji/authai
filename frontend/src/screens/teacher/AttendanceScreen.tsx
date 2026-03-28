import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { useGetMyTeacherProfileQuery } from '../../store/api/teacherApi';
import { useGetStudentsQuery } from '../../store/api/studentApi';
import { useMarkAttendanceMutation, useGetAttendanceByClassDateQuery } from '../../store/api/attendanceApi';
import { useTheme } from '../../hooks/useTheme';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/helpers';
import { AttendanceStatus } from '../../types';

const STATUS_OPTIONS: { label: string; value: AttendanceStatus; color: string; icon: string }[] = [
  { label: 'P', value: 'PRESENT', color: colors.success, icon: '✅' },
  { label: 'A', value: 'ABSENT', color: colors.error, icon: '❌' },
  { label: 'L', value: 'LATE', color: colors.warning, icon: '⏰' },
];

const TeacherAttendanceScreen: React.FC = () => {
  const { isDark } = useTheme();
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [step, setStep] = useState<'select' | 'mark'>('select');

  const { data: profile, isLoading: profileLoading } = useGetMyTeacherProfileQuery();
  const { data: studentsData, isLoading: studentsLoading } = useGetStudentsQuery(
    { classId: selectedClassId, limit: 100 },
    { skip: !selectedClassId },
  );
  const [markAttendance, { isLoading: marking }] = useMarkAttendanceMutation();

  const bgColor = isDark ? colors.background.dark : colors.background.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;
  const cardBg = isDark ? colors.card.dark : colors.card.light;

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const students = studentsData?.data ?? [];
    const newMap: Record<string, AttendanceStatus> = {};
    students.forEach(s => { newMap[s._id] = status; });
    setAttendanceMap(newMap);
  };

  const handleSubmit = async () => {
    const students = studentsData?.data ?? [];
    const records = students.map(s => ({
      studentId: s._id,
      status: attendanceMap[s._id] ?? 'ABSENT',
    }));

    if (!selectedClassId || !selectedSubjectId) {
      Toast.show({ type: 'error', text1: 'Select class and subject' });
      return;
    }

    try {
      await markAttendance({
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        date: date.toISOString().split('T')[0],
        records,
      }).unwrap();
      Toast.show({ type: 'success', text1: 'Attendance submitted successfully!' });
      setStep('select');
      setAttendanceMap({});
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error?.data?.message || 'Failed to mark attendance' });
    }
  };

  if (profileLoading) return <Loader fullScreen isDark={isDark} />;

  const classes = profile?.classes ?? [];
  const subjects = profile?.subjects ?? [];

  const presentCount = Object.values(attendanceMap).filter(s => s === 'PRESENT').length;
  const absentCount = Object.values(attendanceMap).filter(s => s === 'ABSENT').length;
  const lateCount = Object.values(attendanceMap).filter(s => s === 'LATE').length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Mark Attendance</Text>
      </View>

      {step === 'select' ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Class Selection */}
          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Select Class</Text>
            <View style={styles.chipGrid}>
              {classes.map(cls => (
                <TouchableOpacity
                  key={cls._id}
                  style={[styles.chip, { backgroundColor: selectedClassId === cls._id ? colors.primary : `${colors.primary}15`, borderColor: selectedClassId === cls._id ? colors.primary : 'transparent', borderWidth: 1.5 }]}
                  onPress={() => setSelectedClassId(cls._id)}>
                  <Text style={[styles.chipText, { color: selectedClassId === cls._id ? '#FFFFFF' : colors.primary }]}>
                    {cls.name} {cls.section}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Subject Selection */}
          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Select Subject</Text>
            <View style={styles.chipGrid}>
              {subjects.map(sub => (
                <TouchableOpacity
                  key={sub._id}
                  style={[styles.chip, { backgroundColor: selectedSubjectId === sub._id ? colors.secondary : `${colors.secondary}15`, borderColor: selectedSubjectId === sub._id ? colors.secondary : 'transparent', borderWidth: 1.5 }]}
                  onPress={() => setSelectedSubjectId(sub._id)}>
                  <Text style={[styles.chipText, { color: selectedSubjectId === sub._id ? '#FFFFFF' : colors.secondary }]}>
                    {sub.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date */}
          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Date</Text>
            <TouchableOpacity
              style={[styles.dateBtn, { borderColor: colors.primary }]}
              onPress={() => setShowDatePicker(true)}>
              <Text style={[styles.dateBtnText, { color: colors.primary }]}>📅 {formatDate(date.toISOString())}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                maximumDate={new Date()}
                onChange={(_, d) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (d) setDate(d);
                }}
              />
            )}
          </View>

          <Button
            title="Proceed to Mark Attendance"
            onPress={() => {
              if (!selectedClassId || !selectedSubjectId) {
                Toast.show({ type: 'error', text1: 'Please select class and subject' });
                return;
              }
              setStep('mark');
            }}
            fullWidth
            size="lg"
            style={styles.proceedBtn}
            disabled={!selectedClassId || !selectedSubjectId}
          />
        </ScrollView>
      ) : (
        <View style={styles.markView}>
          {/* Summary Bar */}
          <View style={[styles.summaryBar, { backgroundColor: cardBg }]}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: colors.success }]}>{presentCount}</Text>
              <Text style={[styles.summaryLabel, { color: secondaryColor }]}>Present</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: colors.error }]}>{absentCount}</Text>
              <Text style={[styles.summaryLabel, { color: secondaryColor }]}>Absent</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: colors.warning }]}>{lateCount}</Text>
              <Text style={[styles.summaryLabel, { color: secondaryColor }]}>Late</Text>
            </View>
          </View>

          {/* Mark All Buttons */}
          <View style={styles.markAllRow}>
            <Text style={[styles.markAllLabel, { color: secondaryColor }]}>Mark all as:</Text>
            <TouchableOpacity onPress={() => handleMarkAll('PRESENT')} style={[styles.markAllBtn, { backgroundColor: `${colors.success}20` }]}>
              <Text style={{ color: colors.success, fontSize: fontSize.xs, fontWeight: fontWeight.bold }}>✅ Present</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMarkAll('ABSENT')} style={[styles.markAllBtn, { backgroundColor: `${colors.error}20` }]}>
              <Text style={{ color: colors.error, fontSize: fontSize.xs, fontWeight: fontWeight.bold }}>❌ Absent</Text>
            </TouchableOpacity>
          </View>

          {studentsLoading ? (
            <Loader isDark={isDark} />
          ) : (
            <FlatList
              data={studentsData?.data ?? []}
              keyExtractor={item => item._id}
              renderItem={({ item }) => {
                const currentStatus = attendanceMap[item._id] ?? 'ABSENT';
                return (
                  <View style={[styles.studentRow, { backgroundColor: cardBg }, shadow.sm]}>
                    <Avatar name={item.userId?.name ?? 'S'} size={40} />
                    <View style={styles.studentInfo}>
                      <Text style={[styles.studentName, { color: textColor }]}>{item.userId?.name}</Text>
                      <Text style={[styles.studentRoll, { color: secondaryColor }]}>{item.rollNumber}</Text>
                    </View>
                    <View style={styles.statusBtns}>
                      {STATUS_OPTIONS.map(opt => (
                        <TouchableOpacity
                          key={opt.value}
                          style={[
                            styles.statusBtn,
                            { backgroundColor: currentStatus === opt.value ? opt.color : `${opt.color}20` },
                          ]}
                          onPress={() => handleStatusChange(item._id, opt.value)}>
                          <Text style={{ color: currentStatus === opt.value ? '#FFF' : opt.color, fontWeight: fontWeight.bold, fontSize: fontSize.xs }}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              }}
              contentContainerStyle={styles.studentList}
              ItemSeparatorComponent={() => <View style={{ height: spacing[2] }} />}
            />
          )}

          <View style={styles.submitArea}>
            <Button title="Back" onPress={() => setStep('select')} variant="outline" style={styles.backBtn} />
            <Button title="Submit Attendance" onPress={handleSubmit} loading={marking} style={styles.submitBtn} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[2] },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  scroll: { padding: spacing[5] },
  section: { borderRadius: borderRadius.lg, padding: spacing[4], marginBottom: spacing[4] },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: spacing[3] },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: borderRadius.full },
  chipText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  dateBtn: { borderWidth: 1.5, borderRadius: borderRadius.md, padding: spacing[3], alignItems: 'center' },
  dateBtnText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  proceedBtn: {},
  markView: { flex: 1 },
  summaryBar: { flexDirection: 'row', padding: spacing[4], justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.1)' },
  summaryItem: { alignItems: 'center' },
  summaryNum: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  summaryLabel: { fontSize: fontSize.xs },
  markAllRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[5], paddingVertical: spacing[3], gap: spacing[2] },
  markAllLabel: { fontSize: fontSize.sm, flex: 1 },
  markAllBtn: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: borderRadius.full },
  studentList: { paddingHorizontal: spacing[5], paddingBottom: spacing[2] },
  studentRow: { flexDirection: 'row', alignItems: 'center', padding: spacing[3], borderRadius: borderRadius.lg, gap: spacing[3] },
  studentInfo: { flex: 1 },
  studentName: { fontSize: fontSize.md, fontWeight: fontWeight.medium },
  studentRoll: { fontSize: fontSize.xs },
  statusBtns: { flexDirection: 'row', gap: spacing[1] },
  statusBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  submitArea: { flexDirection: 'row', padding: spacing[5], gap: spacing[3] },
  backBtn: { flex: 1 },
  submitBtn: { flex: 2 },
});

export default TeacherAttendanceScreen;
