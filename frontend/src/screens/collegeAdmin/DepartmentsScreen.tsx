import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} from '../../store/api/departmentApi';
import { useTheme } from '../../hooks/useTheme';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Department } from '../../types';

const DepartmentsScreen: React.FC = () => {
  const { isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: departments, isLoading, refetch } = useGetDepartmentsQuery();
  const [createDept, { isLoading: creating }] = useCreateDepartmentMutation();
  const [updateDept, { isLoading: updating }] = useUpdateDepartmentMutation();
  const [deleteDept, { isLoading: deleting }] = useDeleteDepartmentMutation();

  const bgColor = isDark ? colors.background.dark : colors.background.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;
  const cardBg = isDark ? colors.card.dark : colors.card.light;

  const openModal = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setName(dept.name);
      setCode(dept.code);
    } else {
      setEditingDept(null);
      setName('');
      setCode('');
    }
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !code.trim()) {
      Toast.show({ type: 'error', text1: 'Name and code are required' });
      return;
    }
    try {
      if (editingDept) {
        await updateDept({ id: editingDept._id, data: { name, code } }).unwrap();
        Toast.show({ type: 'success', text1: 'Department updated' });
      } else {
        await createDept({ name, code }).unwrap();
        Toast.show({ type: 'success', text1: 'Department created' });
      }
      setModalVisible(false);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error?.data?.message || 'Operation failed' });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteDept(deleteConfirm._id).unwrap();
      Toast.show({ type: 'success', text1: 'Department deleted' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to delete department' });
    }
    setDeleteConfirm(null);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Department }) => (
    <View style={[styles.item, { backgroundColor: cardBg }, shadow.sm]}>
      <View style={[styles.itemIcon, { backgroundColor: `${colors.primary}20` }]}>
        <Text style={{ fontSize: 24 }}>🏛️</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: textColor }]}>{item.name}</Text>
        <Text style={[styles.itemCode, { color: secondaryColor }]}>Code: {item.code}</Text>
        <Text style={[styles.itemCount, { color: secondaryColor }]}>
          {item.studentCount ?? 0} students • {item.teacherCount ?? 0} teachers
        </Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity onPress={() => openModal(item)} style={styles.actionBtn}>
          <Text style={{ fontSize: 18 }}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDeleteConfirm(item)} style={styles.actionBtn}>
          <Text style={{ fontSize: 18 }}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Departments</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => openModal()}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <Loader isDark={isDark} />
      ) : (
        <FlatList
          data={departments ?? []}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="🏛️"
              title="No departments yet"
              description="Add departments to organize your college"
              actionLabel="Add Department"
              onAction={() => openModal()}
              isDark={isDark}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
        />
      )}

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              {editingDept ? 'Edit Department' : 'Add Department'}
            </Text>
            <Input
              label="Department Name"
              placeholder="e.g. Computer Science"
              value={name}
              onChangeText={setName}
              isDark={isDark}
            />
            <Input
              label="Department Code"
              placeholder="e.g. CS"
              value={code}
              onChangeText={t => setCode(t.toUpperCase())}
              autoCapitalize="characters"
              isDark={isDark}
            />
            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} variant="outline" style={styles.modalBtn} />
              <Button
                title={editingDept ? 'Update' : 'Create'}
                onPress={handleSubmit}
                loading={creating || updating}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmDialog
        visible={!!deleteConfirm}
        title="Delete Department"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        isDark={isDark}
        danger
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  addBtn: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
  },
  addBtnText: { color: '#FFFFFF', fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  list: { paddingHorizontal: spacing[5], paddingBottom: spacing[8] },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    gap: spacing[3],
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  itemCode: { fontSize: fontSize.xs, marginTop: 2 },
  itemCount: { fontSize: fontSize.xs, marginTop: 2 },
  itemActions: { flexDirection: 'row', gap: spacing[2] },
  actionBtn: { padding: spacing[1] },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing[6],
    paddingBottom: spacing[10],
  },
  modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: spacing[5] },
  modalActions: { flexDirection: 'row', gap: spacing[3], marginTop: spacing[2] },
  modalBtn: { flex: 1 },
});

export default DepartmentsScreen;
