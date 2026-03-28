import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useCreateStudentMutation, useUpdateStudentMutation, useGetStudentQuery } from '../../store/api/studentApi';
import { useGetDepartmentsQuery } from '../../store/api/departmentApi';
import { useTheme } from '../../hooks/useTheme';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';

type RouteParams = { studentId?: string };

const AddStudentScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { isDark } = useTheme();
  const isEditing = !!route.params?.studentId;

  const [createStudent, { isLoading: creating }] = useCreateStudentMutation();
  const [updateStudent, { isLoading: updating }] = useUpdateStudentMutation();
  const { data: departments } = useGetDepartmentsQuery();
  const { data: student } = useGetStudentQuery(route.params?.studentId ?? '', { skip: !isEditing });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [classId, setClassId] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (student) {
      setName(student.userId?.name ?? '');
      setEmail(student.userId?.email ?? '');
      setRollNumber(student.rollNumber);
      setDepartmentId(student.department?._id ?? '');
      setParentName(student.parentName ?? '');
      setParentPhone(student.parentPhone ?? '');
      setAddress(student.address ?? '');
    }
  }, [student]);

  const bgColor = isDark ? colors.background.dark : colors.background.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;
  const cardBg = isDark ? colors.card.dark : colors.card.light;

  const handleSubmit = async () => {
    if (!name || !email || !rollNumber || !departmentId) {
      Toast.show({ type: 'error', text1: 'Fill in all required fields' });
      return;
    }
    try {
      if (isEditing && route.params?.studentId) {
        await updateStudent({
          id: route.params.studentId,
          data: { name, rollNumber, departmentId, parentName, parentPhone, address },
        }).unwrap();
        Toast.show({ type: 'success', text1: 'Student updated successfully' });
      } else {
        await createStudent({ name, email, rollNumber, departmentId, classId, parentName, parentPhone, address }).unwrap();
        Toast.show({ type: 'success', text1: 'Student added successfully' });
      }
      navigation.goBack();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error?.data?.message || 'Operation failed' });
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <Header
        title={isEditing ? 'Edit Student' : 'Add Student'}
        onBack={() => navigation.goBack()}
        isDark={isDark}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Personal Information</Text>
            <Input label="Full Name" placeholder="e.g. John Doe" value={name} onChangeText={setName} isDark={isDark} required />
            <Input label="Email Address" placeholder="student@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" isDark={isDark} required editable={!isEditing} />
            <Input label="Roll Number" placeholder="e.g. 2024CS001" value={rollNumber} onChangeText={setRollNumber} isDark={isDark} required />
            <Input label="Address" placeholder="Full address" value={address} onChangeText={setAddress} isDark={isDark} multiline numberOfLines={2} />
          </View>

          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Academic Information</Text>
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
          </View>

          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Parent / Guardian</Text>
            <Input label="Parent Name" placeholder="e.g. Jane Doe" value={parentName} onChangeText={setParentName} isDark={isDark} />
            <Input label="Parent Phone" placeholder="e.g. +1234567890" value={parentPhone} onChangeText={setParentPhone} keyboardType="phone-pad" isDark={isDark} />
          </View>

          <Button
            title={isEditing ? 'Update Student' : 'Add Student'}
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
  section: {
    borderRadius: 16,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: spacing[4] },
  pickerLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginBottom: spacing[2] },
  departmentList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  deptBtn: { marginBottom: spacing[2] },
  submitBtn: { marginTop: spacing[2] },
});

export default AddStudentScreen;
