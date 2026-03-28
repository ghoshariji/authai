import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useCreateTeacherMutation, useUpdateTeacherMutation, useGetTeacherQuery } from '../../store/api/teacherApi';
import { useGetDepartmentsQuery } from '../../store/api/departmentApi';
import { useTheme } from '../../hooks/useTheme';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

type RouteParams = { teacherId?: string };

const AddTeacherScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { isDark } = useTheme();
  const isEditing = !!route.params?.teacherId;

  const [createTeacher, { isLoading: creating }] = useCreateTeacherMutation();
  const [updateTeacher, { isLoading: updating }] = useUpdateTeacherMutation();
  const { data: departments } = useGetDepartmentsQuery();
  const { data: teacher } = useGetTeacherQuery(route.params?.teacherId ?? '', { skip: !isEditing });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [designation, setDesignation] = useState('');

  useEffect(() => {
    if (teacher) {
      setName(teacher.userId?.name ?? '');
      setEmail(teacher.userId?.email ?? '');
      setDepartmentId(teacher.department?._id ?? '');
      setQualification(teacher.qualification ?? '');
      setExperience(String(teacher.experience ?? ''));
      setDesignation('');
    }
  }, [teacher]);

  const bgColor = isDark ? colors.background.dark : colors.background.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;
  const cardBg = isDark ? colors.card.dark : colors.card.light;

  const handleSubmit = async () => {
    if (!name || !email || !departmentId) {
      Toast.show({ type: 'error', text1: 'Fill in all required fields' });
      return;
    }
    try {
      if (isEditing && route.params?.teacherId) {
        await updateTeacher({ id: route.params.teacherId, data: { name, departmentId, qualification, experience: Number(experience) } }).unwrap();
        Toast.show({ type: 'success', text1: 'Teacher updated' });
      } else {
        await createTeacher({ name, email, departmentId, qualification, experience: Number(experience), designation }).unwrap();
        Toast.show({ type: 'success', text1: 'Teacher added' });
      }
      navigation.goBack();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error?.data?.message || 'Operation failed' });
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <Header title={isEditing ? 'Edit Teacher' : 'Add Teacher'} onBack={() => navigation.goBack()} isDark={isDark} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Personal Information</Text>
            <Input label="Full Name" placeholder="e.g. Dr. John Smith" value={name} onChangeText={setName} isDark={isDark} required />
            <Input label="Email Address" placeholder="teacher@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" isDark={isDark} required editable={!isEditing} />
            <Input label="Designation" placeholder="e.g. Professor, Lecturer" value={designation} onChangeText={setDesignation} isDark={isDark} />
          </View>

          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Academic Details</Text>
            <Text style={[styles.pickerLabel, { color: secondaryColor }]}>Department *</Text>
            <View style={styles.departmentList}>
              {(departments ?? []).map(dept => (
                <Button
                  key={dept._id}
                  title={dept.name}
                  onPress={() => setDepartmentId(dept._id)}
                  variant={departmentId === dept._id ? 'primary' : 'outline'}
                  size="sm"
                  style={styles.deptBtn}
                />
              ))}
            </View>
            <Input label="Qualification" placeholder="e.g. Ph.D. Computer Science" value={qualification} onChangeText={setQualification} isDark={isDark} />
            <Input label="Years of Experience" placeholder="e.g. 5" value={experience} onChangeText={setExperience} keyboardType="number-pad" isDark={isDark} />
          </View>

          <Button
            title={isEditing ? 'Update Teacher' : 'Add Teacher'}
            onPress={handleSubmit}
            loading={creating || updating}
            fullWidth
            size="lg"
            style={styles.submitBtn}
          />
          <View style={{ height: spacing[8] }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { padding: spacing[5] },
  section: { borderRadius: 16, padding: spacing[4], marginBottom: spacing[4] },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: spacing[4] },
  pickerLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginBottom: spacing[2] },
  departmentList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[4] },
  deptBtn: { marginBottom: 0 },
  submitBtn: { marginTop: spacing[2] },
});

export default AddTeacherScreen;
