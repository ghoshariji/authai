import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal,
  RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useGetNoticesQuery, useCreateNoticeMutation, useDeleteNoticeMutation } from '../../store/api/noticeApi';
import { useTheme } from '../../hooks/useTheme';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Badge from '../../components/common/Badge';
import { getNoticeTypeColor, formatRelativeTime } from '../../utils/helpers';
import { Notice } from '../../types';

const NOTICE_TYPES = ['GENERAL', 'ACADEMIC', 'URGENT', 'EVENT'];
const FILTER_OPTIONS = ['ALL', 'GENERAL', 'ACADEMIC', 'URGENT', 'EVENT'];

const NoticesScreen: React.FC = () => {
  const { isDark } = useTheme();
  const [filterType, setFilterType] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Notice | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedType, setSelectedType] = useState('GENERAL');

  const { data, isLoading, refetch } = useGetNoticesQuery({
    type: filterType === 'ALL' ? undefined : filterType,
    limit: 50,
  });
  const [createNotice, { isLoading: creating }] = useCreateNoticeMutation();
  const [deleteNotice] = useDeleteNoticeMutation();

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
    if (!title.trim() || !content.trim()) {
      Toast.show({ type: 'error', text1: 'Title and content are required' });
      return;
    }
    try {
      await createNotice({
        title,
        content,
        type: selectedType,
        targetRoles: ['STUDENT', 'TEACHER', 'COLLEGE_ADMIN'],
      }).unwrap();
      Toast.show({ type: 'success', text1: 'Notice posted successfully' });
      setModalVisible(false);
      setTitle('');
      setContent('');
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to post notice' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteNotice(deleteTarget._id).unwrap();
      Toast.show({ type: 'success', text1: 'Notice deleted' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to delete notice' });
    }
    setDeleteTarget(null);
  };

  const renderItem = ({ item }: { item: Notice }) => (
    <View style={[styles.noticeCard, { backgroundColor: cardBg }, shadow.sm]}>
      <View style={styles.noticeHeader}>
        <Badge label={item.type} backgroundColor={getNoticeTypeColor(item.type)} size="sm" />
        <Text style={[styles.noticeTime, { color: secondaryColor }]}>{formatRelativeTime(item.createdAt)}</Text>
      </View>
      <Text style={[styles.noticeTitle, { color: textColor }]}>{item.title}</Text>
      <Text style={[styles.noticeContent, { color: secondaryColor }]} numberOfLines={3}>{item.content}</Text>
      <TouchableOpacity onPress={() => setDeleteTarget(item)} style={styles.deleteBtn}>
        <Text style={{ color: colors.error, fontSize: fontSize.sm }}>🗑️ Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Notices</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Post</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <FlatList
        horizontal
        data={FILTER_OPTIONS}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, { backgroundColor: filterType === item ? colors.primary : `${colors.primary}15` }]}
            onPress={() => setFilterType(item)}>
            <Text style={[styles.filterText, { color: filterType === item ? '#FFFFFF' : colors.primary }]}>{item}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.filters}
        showsHorizontalScrollIndicator={false}
      />

      {isLoading ? (
        <Loader isDark={isDark} />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState icon="📢" title="No notices yet" description="Post your first notice" isDark={isDark} />
          }
          ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create Notice Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Post Notice</Text>
            <Text style={[styles.typeLabel, { color: secondaryColor }]}>Notice Type</Text>
            <View style={styles.typeRow}>
              {NOTICE_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, { backgroundColor: selectedType === t ? getNoticeTypeColor(t) : `${getNoticeTypeColor(t)}20` }]}
                  onPress={() => setSelectedType(t)}>
                  <Text style={{ color: selectedType === t ? '#FFF' : getNoticeTypeColor(t), fontSize: fontSize.xs, fontWeight: fontWeight.bold }}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input label="Title" placeholder="Notice title" value={title} onChangeText={setTitle} isDark={isDark} />
            <Input label="Content" placeholder="Write the notice content..." value={content} onChangeText={setContent} isDark={isDark} multiline numberOfLines={4} style={{ height: 100, textAlignVertical: 'top' }} />
            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} variant="outline" style={styles.modalBtn} />
              <Button title="Post Notice" onPress={handleCreate} loading={creating} style={styles.modalBtn} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete Notice"
        message={`Delete "${deleteTarget?.title}"?`}
        confirmLabel="Delete"
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
  filters: { paddingHorizontal: spacing[5], paddingBottom: spacing[3], gap: spacing[2] },
  filterChip: { paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: borderRadius.full },
  filterText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  list: { paddingHorizontal: spacing[5], paddingBottom: spacing[8] },
  noticeCard: { borderRadius: borderRadius.lg, padding: spacing[4] },
  noticeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] },
  noticeTime: { fontSize: fontSize.xs },
  noticeTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: spacing[1] },
  noticeContent: { fontSize: fontSize.sm, lineHeight: 20 },
  deleteBtn: { alignSelf: 'flex-end', marginTop: spacing[2] },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modal: { borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing[6], paddingBottom: spacing[10] },
  modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: spacing[4] },
  typeLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginBottom: spacing[2] },
  typeRow: { flexDirection: 'row', gap: spacing[2], marginBottom: spacing[4], flexWrap: 'wrap' },
  typeChip: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: borderRadius.full },
  modalActions: { flexDirection: 'row', gap: spacing[3], marginTop: spacing[2] },
  modalBtn: { flex: 1 },
});

export default NoticesScreen;
