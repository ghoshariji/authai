import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal,
  RefreshControl, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { useGetExamsQuery, useCreateExamMutation } from '../../store/api/examApi';
import { useGetMyTeacherProfileQuery } from '../../store/api/teacherApi';
import { useTheme } from '../../hooks/useTheme';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import { formatDate, getExamTypeLabel } from '../../utils/helpers';
import { EXAM_TYPES } from '../../utils/constants';
import { Exam } from '../../types';

const TeacherExamsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [name, setName] = useState('');
  const [examType, setExamType] = useState('MIDTERM');
  const [date, setDate] = useState(new Date());
  const [totalMarks, setTotalMarks] = useState('100');
  const [passingMarks, setPassingMarks] = useState('35');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');

  const { data: profile } = useGetMyTeacherProfileQuery();
  const { data: examsData, isLoading, refetch } = useGetExamsQuery({});
  const [createExam, { isLoading: creating }] = useCreateExamMutation();

  const bgColor = isDark ? colors.background.dark : colors.background.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;
  const cardBg = isDark ? colors.card.dark : colors.card.light;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!name || !subjectId || !classId) {
      Toast.show({ type: 'error', text1: 'Fill in all required fields' });
      return;
    }
    try {
      await createExam({
        name,
        type: examType,
        date: date.toISOString(),
        totalMarks: Number(totalMarks),
        passingMarks: Number(passingMarks),
        subjectId,
        classId,
      }).unwrap();
      Toast.show({ type: 'success', text1: 'Exam created successfully' });
      setModalVisible(false);
      setName('');
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error?.data?.message || 'Failed to create exam' });
    }
  };

  const EXAM_TYPE_COLORS: Record<string, string> = {
    MIDTERM: colors.primary,
    FINAL: colors.error,
    QUIZ: colors.info,
    ASSIGNMENT: colors.success,
  };

  const renderItem = ({ item }: { item: Exam }) => (
    <TouchableOpacity
      style={[styles.examCard, { backgroundColor: cardBg }, shadow.sm]}
      onPress={() => navigation.navigate('Results', { examId: item._id })}
      activeOpacity={0.8}>
      <View style={[styles.examTypeBar, { backgroundColor: EXAM_TYPE_COLORS[item.type] ?? colors.primary }]} />
      <View style={styles.examContent}>
        <View style={styles.examHeader}>
          <Text style={[styles.examName, { color: textColor }]}>{item.name}</Text>
          <Badge label={getExamTypeLabel(item.type)} backgroundColor={EXAM_TYPE_COLORS[item.type]} size="sm" />
        </View>
        <Text style={[styles.examSub, { color: colors.primary }]}>{item.subject?.name}</Text>
        <Text style={[styles.examClass, { color: secondaryColor }]}>{item.class?.name} {item.class?.section}</Text>
        <View style={styles.examMeta}>
          <Text style={[styles.metaText, { color: secondaryColor }]}>📅 {formatDate(item.date)}</Text>
          <Text style={[styles.metaText, { color: secondaryColor }]}>📊 {item.totalMarks} marks</Text>
          <Text style={[styles.metaText, { color: secondaryColor }]}>✅ Pass: {item.passingMarks}</Text>
        </View>
      </View>
      <Text style={[styles.arrow, { color: secondaryColor }]}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Exams</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Create</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <Loader isDark={isDark} />
      ) : (
        <FlatList
          data={examsData?.data ?? []}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon="📝" title="No exams yet" description="Create your first exam" isDark={isDark} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <ScrollView>
            <View style={[styles.modal, { backgroundColor: cardBg }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Create Exam</Text>
              <Input label="Exam Name" placeholder="e.g. Unit Test 1" value={name} onChangeText={setName} isDark={isDark} required />

              <Text style={[styles.fieldLabel, { color: secondaryColor }]}>Exam Type</Text>
              <View style={styles.typeRow}>
                {Object.values(EXAM_TYPES).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, { backgroundColor: examType === t ? (EXAM_TYPE_COLORS[t] ?? colors.primary) : `${EXAM_TYPE_COLORS[t] ?? colors.primary}20` }]}
                    onPress={() => setExamType(t)}>
                    <Text style={{ color: examType === t ? '#FFF' : (EXAM_TYPE_COLORS[t] ?? colors.primary), fontSize: fontSize.xs, fontWeight: fontWeight.bold }}>
                      {getExamTypeLabel(t)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: secondaryColor }]}>Date</Text>
              <TouchableOpacity style={[styles.dateBtn, { borderColor: colors.primary }]} onPress={() => setShowDatePicker(true)}>
                <Text style={{ color: colors.primary, fontWeight: fontWeight.medium }}>📅 {formatDate(date.toISOString())}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  minimumDate={new Date()}
                  onChange={(_, d) => { setShowDatePicker(false); if (d) setDate(d); }}
                />
              )}

              <View style={styles.marksRow}>
                <View style={styles.marksField}>
                  <Input label="Total Marks" value={totalMarks} onChangeText={setTotalMarks} keyboardType="number-pad" isDark={isDark} />
                </View>
                <View style={styles.marksField}>
                  <Input label="Passing Marks" value={passingMarks} onChangeText={setPassingMarks} keyboardType="number-pad" isDark={isDark} />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { color: secondaryColor }]}>Subject *</Text>
              <View style={styles.chipGrid}>
                {(profile?.subjects ?? []).map(s => (
                  <TouchableOpacity key={s._id} style={[styles.chip, { backgroundColor: subjectId === s._id ? colors.primary : `${colors.primary}15` }]} onPress={() => setSubjectId(s._id)}>
                    <Text style={{ color: subjectId === s._id ? '#FFF' : colors.primary, fontSize: fontSize.sm }}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: secondaryColor }]}>Class *</Text>
              <View style={styles.chipGrid}>
                {(profile?.classes ?? []).map(c => (
                  <TouchableOpacity key={c._id} style={[styles.chip, { backgroundColor: classId === c._id ? colors.secondary : `${colors.secondary}15` }]} onPress={() => setClassId(c._id)}>
                    <Text style={{ color: classId === c._id ? '#FFF' : colors.secondary, fontSize: fontSize.sm }}>{c.name} {c.section}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <Button title="Cancel" onPress={() => setModalVisible(false)} variant="outline" style={styles.modalBtn} />
                <Button title="Create Exam" onPress={handleCreate} loading={creating} style={styles.modalBtn} />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[4] },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  addBtn: { paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: borderRadius.md },
  addBtnText: { color: '#FFFFFF', fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  list: { paddingHorizontal: spacing[5], paddingBottom: spacing[8] },
  examCard: { flexDirection: 'row', borderRadius: borderRadius.lg, overflow: 'hidden' },
  examTypeBar: { width: 5 },
  examContent: { flex: 1, padding: spacing[4] },
  examHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[1] },
  examName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, flex: 1, marginRight: spacing[2] },
  examSub: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginBottom: 2 },
  examClass: { fontSize: fontSize.xs, marginBottom: spacing[2] },
  examMeta: { flexDirection: 'row', gap: spacing[3], flexWrap: 'wrap' },
  metaText: { fontSize: fontSize.xs },
  arrow: { fontSize: 20, alignSelf: 'center', paddingRight: spacing[3] },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modal: { borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing[6], paddingBottom: spacing[10] },
  modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: spacing[4] },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginBottom: spacing[2] },
  typeRow: { flexDirection: 'row', gap: spacing[2], marginBottom: spacing[4], flexWrap: 'wrap' },
  typeChip: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: borderRadius.full },
  dateBtn: { borderWidth: 1.5, borderRadius: borderRadius.md, padding: spacing[3], alignItems: 'center', marginBottom: spacing[4] },
  marksRow: { flexDirection: 'row', gap: spacing[3] },
  marksField: { flex: 1 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[4] },
  chip: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: borderRadius.full },
  modalActions: { flexDirection: 'row', gap: spacing[3], marginTop: spacing[2] },
  modalBtn: { flex: 1 },
});

export default TeacherExamsScreen;
