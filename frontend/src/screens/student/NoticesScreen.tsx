import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, RefreshControl, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetNoticesQuery } from '../../store/api/noticeApi';
import { useTheme } from '../../hooks/useTheme';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import Badge from '../../components/common/Badge';
import { getNoticeTypeColor, formatDate, formatRelativeTime } from '../../utils/helpers';
import { Notice } from '../../types';

const StudentNoticesScreen: React.FC = () => {
  const { isDark } = useTheme();
  const [filterType, setFilterType] = useState('ALL');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useGetNoticesQuery({
    type: filterType === 'ALL' ? undefined : filterType,
    limit: 50,
  });

  const bgColor = isDark ? colors.background.dark : colors.background.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;
  const cardBg = isDark ? colors.card.dark : colors.card.light;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const FILTERS = ['ALL', 'GENERAL', 'ACADEMIC', 'URGENT', 'EVENT'];

  const renderItem = ({ item }: { item: Notice }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: cardBg }, shadow.sm]}
      onPress={() => setSelectedNotice(item)}
      activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <Badge label={item.type} backgroundColor={getNoticeTypeColor(item.type)} size="sm" />
        <Text style={[styles.time, { color: secondaryColor }]}>{formatRelativeTime(item.createdAt)}</Text>
      </View>
      <Text style={[styles.noticeTitle, { color: textColor }]}>{item.title}</Text>
      <Text style={[styles.preview, { color: secondaryColor }]} numberOfLines={2}>{item.content}</Text>
      <Text style={[styles.readMore, { color: colors.primary }]}>Read more →</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Notices</Text>
      </View>

      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, { backgroundColor: filterType === item ? colors.primary : `${colors.primary}15` }]}
            onPress={() => setFilterType(item)}>
            <Text style={[styles.filterText, { color: filterType === item ? '#FFF' : colors.primary }]}>{item}</Text>
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
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon="📢" title="No notices" description="Check back later for announcements" isDark={isDark} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
        />
      )}

      {/* Notice Detail Modal */}
      <Modal visible={!!selectedNotice} transparent animationType="slide" onRequestClose={() => setSelectedNotice(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              {selectedNotice && <Badge label={selectedNotice.type} backgroundColor={getNoticeTypeColor(selectedNotice.type)} />}
              <TouchableOpacity onPress={() => setSelectedNotice(null)} style={styles.closeBtn}>
                <Text style={{ fontSize: 22, color: secondaryColor }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalTitle, { color: textColor }]}>{selectedNotice?.title}</Text>
            <Text style={[styles.modalDate, { color: secondaryColor }]}>
              {selectedNotice && formatDate(selectedNotice.createdAt)}
            </Text>
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalText, { color: textColor }]}>{selectedNotice?.content}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[2] },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  filters: { paddingHorizontal: spacing[5], paddingBottom: spacing[3], gap: spacing[2] },
  filterChip: { paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: borderRadius.full },
  filterText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  list: { paddingHorizontal: spacing[5], paddingBottom: spacing[8] },
  card: { borderRadius: borderRadius.lg, padding: spacing[4] },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] },
  time: { fontSize: fontSize.xs },
  noticeTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: spacing[1] },
  preview: { fontSize: fontSize.sm, lineHeight: 20, marginBottom: spacing[2] },
  readMore: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing[6], maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] },
  closeBtn: { padding: spacing[1] },
  modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: spacing[1] },
  modalDate: { fontSize: fontSize.sm, marginBottom: spacing[4] },
  modalContent: { maxHeight: 400 },
  modalText: { fontSize: fontSize.md, lineHeight: 24 },
});

export default StudentNoticesScreen;
