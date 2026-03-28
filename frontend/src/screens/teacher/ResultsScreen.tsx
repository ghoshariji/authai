import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useGetExamQuery, useGetResultsQuery, useCreateBulkResultsMutation } from '../../store/api/examApi';
import { useGetStudentsQuery } from '../../store/api/studentApi';
import { useTheme } from '../../hooks/useTheme';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import Loader from '../../components/common/Loader';
import Badge from '../../components/common/Badge';
import { getGradeColor } from '../../utils/helpers';

type RouteParams = { examId: string };

const ResultsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { isDark } = useTheme();
  const { examId } = route.params;

  const [marksMap, setMarksMap] = useState<Record<string, string>>({});

  const { data: exam, isLoading: examLoading } = useGetExamQuery(examId);
  const { data: existingResults } = useGetResultsQuery({ examId });
  const { data: studentsData, isLoading: studentsLoading } = useGetStudentsQuery(
    { classId: exam?.class?._id, limit: 100 },
    { skip: !exam?.class?._id },
  );
  const [createBulkResults, { isLoading: submitting }] = useCreateBulkResultsMutation();

  const bgColor = isDark ? colors.background.dark : colors.background.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;
  const cardBg = isDark ? colors.card.dark : colors.card.light;

  useEffect(() => {
    if (existingResults) {
      const map: Record<string, string> = {};
      existingResults.forEach(r => {
        map[r.student?._id ?? ''] = String(r.marksObtained);
      });
      setMarksMap(map);
    }
  }, [existingResults]);

  const calculateGrade = (obtained: number, total: number): string => {
    const pct = (obtained / total) * 100;
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 40) return 'D';
    return 'F';
  };

  const handleSubmit = async () => {
    const students = studentsData?.data ?? [];
    const results = students.map(s => ({
      studentId: s._id,
      marksObtained: Number(marksMap[s._id] ?? 0),
    }));

    try {
      await createBulkResults({ examId, results }).unwrap();
      Toast.show({ type: 'success', text1: 'Results saved successfully!' });
      navigation.goBack();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error?.data?.message || 'Failed to save results' });
    }
  };

  if (examLoading) return <Loader fullScreen isDark={isDark} />;

  const students = studentsData?.data ?? [];
  const submitted = students.filter(s => marksMap[s._id] !== undefined).length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <Header title="Enter Results" onBack={() => navigation.goBack()} isDark={isDark} />

      {/* Exam Info */}
      {exam && (
        <View style={[styles.examInfo, { backgroundColor: cardBg }]}>
          <Text style={[styles.examName, { color: textColor }]}>{exam.name}</Text>
          <Text style={[styles.examSub, { color: colors.primary }]}>{exam.subject?.name} • {exam.class?.name}</Text>
          <View style={styles.examStats}>
            <Text style={[styles.examStat, { color: secondaryColor }]}>Total: {exam.totalMarks}</Text>
            <Text style={[styles.examStat, { color: secondaryColor }]}>Pass: {exam.passingMarks}</Text>
            <Text style={[styles.examStat, { color: secondaryColor }]}>Entered: {submitted}/{students.length}</Text>
          </View>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        {studentsLoading ? (
          <Loader isDark={isDark} />
        ) : (
          <FlatList
            data={students}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const marks = marksMap[item._id] ?? '';
              const numMarks = Number(marks);
              const grade = marks && exam ? calculateGrade(numMarks, exam.totalMarks) : '';
              const isPassed = exam ? numMarks >= exam.passingMarks : false;
              const gradeColor = grade ? getGradeColor(grade) : secondaryColor;

              return (
                <View style={[styles.studentCard, { backgroundColor: cardBg }, shadow.sm]}>
                  <Avatar name={item.userId?.name ?? 'S'} size={44} />
                  <View style={styles.studentInfo}>
                    <Text style={[styles.studentName, { color: textColor }]}>{item.userId?.name}</Text>
                    <Text style={[styles.rollNo, { color: secondaryColor }]}>{item.rollNumber}</Text>
                  </View>
                  <View style={styles.inputArea}>
                    <View style={[styles.marksInput, { borderColor: marks ? (isPassed ? colors.success : colors.error) : (isDark ? colors.border.dark : colors.border.light) }]}>
                      <TextInput
                        value={marks}
                        onChangeText={v => {
                          const num = Number(v);
                          if (exam && num > exam.totalMarks) return;
                          setMarksMap(prev => ({ ...prev, [item._id]: v }));
                        }}
                        keyboardType="number-pad"
                        style={[styles.marksInputText, { color: textColor }]}
                        placeholder="0"
                        placeholderTextColor={secondaryColor}
                        maxLength={4}
                      />
                      <Text style={[styles.maxMarks, { color: secondaryColor }]}>/{exam?.totalMarks}</Text>
                    </View>
                    {grade && (
                      <Badge label={grade} backgroundColor={gradeColor} size="sm" style={{ marginTop: spacing[1] }} />
                    )}
                  </View>
                </View>
              );
            }}
            ItemSeparatorComponent={() => <View style={{ height: spacing[2] }} />}
          />
        )}

        <View style={styles.footer}>
          <Button
            title={`Save Results (${submitted}/${students.length})`}
            onPress={handleSubmit}
            loading={submitting}
            fullWidth
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  examInfo: { margin: spacing[5], marginBottom: spacing[3], borderRadius: borderRadius.lg, padding: spacing[4] },
  examName: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  examSub: { fontSize: fontSize.sm, marginTop: 2 },
  examStats: { flexDirection: 'row', gap: spacing[4], marginTop: spacing[2] },
  examStat: { fontSize: fontSize.sm },
  list: { paddingHorizontal: spacing[5], paddingBottom: spacing[2] },
  studentCard: { flexDirection: 'row', alignItems: 'center', padding: spacing[3], borderRadius: borderRadius.lg, gap: spacing[3] },
  studentInfo: { flex: 1 },
  studentName: { fontSize: fontSize.md, fontWeight: fontWeight.medium },
  rollNo: { fontSize: fontSize.xs, marginTop: 2 },
  inputArea: { alignItems: 'center' },
  marksInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: borderRadius.md, paddingHorizontal: spacing[2], paddingVertical: spacing[1], minWidth: 80 },
  marksInputText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, flex: 1, textAlign: 'center' },
  maxMarks: { fontSize: fontSize.xs },
  footer: { padding: spacing[5], paddingTop: spacing[3] },
});

export default ResultsScreen;
