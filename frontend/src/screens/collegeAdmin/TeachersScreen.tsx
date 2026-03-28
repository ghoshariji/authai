import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useGetTeachersQuery, useDeleteTeacherMutation } from '../../store/api/teacherApi';
import { useTheme } from '../../hooks/useTheme';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import SearchBar from '../../components/common/SearchBar';
import Avatar from '../../components/common/Avatar';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Teacher } from '../../types';

const TeachersScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);

  const { data, isLoading, refetch } = useGetTeachersQuery({ search, page, limit: 20 });
  const [deleteTeacher] = useDeleteTeacherMutation();

  const bgColor = isDark ? colors.background.dark : colors.background.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;
  const cardBg = isDark ? colors.card.dark : colors.card.light;

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setPage(1);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTeacher(deleteTarget._id).unwrap();
      Toast.show({ type: 'success', text1: 'Teacher removed' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to remove teacher' });
    }
    setDeleteTarget(null);
  };

  const renderItem = ({ item }: { item: Teacher }) => (
    <View style={[styles.item, { backgroundColor: cardBg }, shadow.sm]}>
      <Avatar name={item.userId?.name ?? 'T'} uri={item.userId?.avatar} size={52} backgroundColor={colors.secondary} />
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: textColor }]}>{item.userId?.name}</Text>
        <Text style={[styles.itemDept, { color: colors.primary }]}>{item.department?.name}</Text>
        <Text style={[styles.itemDetail, { color: secondaryColor }]}>
          {item.subjects?.length ?? 0} subjects • {item.experience ?? 0} yrs exp
        </Text>
        <Text style={[styles.itemDetail, { color: secondaryColor }]}>{item.qualification}</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity onPress={() => navigation.navigate('AddTeacher', { teacherId: item._id })} style={styles.actionBtn}>
          <Text style={{ fontSize: 18 }}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDeleteTarget(item)} style={styles.actionBtn}>
          <Text style={{ fontSize: 18 }}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Teachers</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AddTeacher', {})}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.searchRow}>
        <SearchBar placeholder="Search teachers..." onSearch={handleSearch} isDark={isDark} />
      </View>
      <Text style={[styles.countText, { color: secondaryColor }]}>{data?.total ?? 0} teachers total</Text>
      {isLoading && !refreshing ? (
        <Loader isDark={isDark} />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="👨‍🏫"
              title="No teachers found"
              description="Add teachers to get started"
              actionLabel="Add Teacher"
              onAction={() => navigation.navigate('AddTeacher', {})}
              isDark={isDark}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
        />
      )}
      <ConfirmDialog
        visible={!!deleteTarget}
        title="Remove Teacher"
        message={`Remove ${deleteTarget?.userId?.name ?? 'this teacher'}?`}
        confirmLabel="Remove"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isDark={isDark}
        danger
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[2] },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  addBtn: { paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: borderRadius.md },
  addBtnText: { color: '#FFFFFF', fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  searchRow: { paddingHorizontal: spacing[5], marginBottom: spacing[2] },
  countText: { paddingHorizontal: spacing[5], fontSize: fontSize.sm, marginBottom: spacing[3] },
  list: { paddingHorizontal: spacing[5], paddingBottom: spacing[8] },
  item: { flexDirection: 'row', alignItems: 'center', padding: spacing[3], borderRadius: borderRadius.lg, gap: spacing[3] },
  itemInfo: { flex: 1 },
  itemName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  itemDept: { fontSize: fontSize.sm, marginTop: 2 },
  itemDetail: { fontSize: fontSize.xs, marginTop: 2 },
  itemActions: { flexDirection: 'row', gap: spacing[1] },
  actionBtn: { padding: spacing[2] },
});

export default TeachersScreen;
