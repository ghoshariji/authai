import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useGetCollegesQuery } from '../../store/api/collegeApi';
import { useTheme } from '../../hooks/useTheme';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import SearchBar from '../../components/common/SearchBar';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import { getPlanColor, getStatusColor } from '../../utils/helpers';
import { College } from '../../types';

const CollegesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch, isFetching } = useGetCollegesQuery({
    search,
    page,
    limit: 20,
  });

  const bgColor = isDark ? colors.background.dark : colors.background.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;
  const cardBg = isDark ? colors.card.dark : colors.card.light;

  const handleSearch = useCallback((query: string) => {
    setSearch(query);
    setPage(1);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: College }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: cardBg }, shadow.sm]}
      onPress={() => navigation.navigate('CollegeDetail', { collegeId: item._id })}
      activeOpacity={0.8}>
      <Avatar name={item.name} uri={item.logo} size={52} backgroundColor={getPlanColor(item.subscription.plan)} />
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: textColor }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.itemCode, { color: secondaryColor }]}>Code: {item.code}</Text>
        <View style={styles.itemMeta}>
          <Text style={[styles.metaText, { color: secondaryColor }]}>
            👥 {item.studentCount ?? 0} students
          </Text>
          <Text style={[styles.metaText, { color: secondaryColor }]}>
            👨‍🏫 {item.teacherCount ?? 0} teachers
          </Text>
        </View>
      </View>
      <View style={styles.badges}>
        <Badge
          label={item.subscription.plan}
          backgroundColor={getPlanColor(item.subscription.plan)}
          size="sm"
        />
        <View style={{ marginTop: spacing[1] }}>
          <Badge
            label={item.isActive ? 'Active' : 'Inactive'}
            backgroundColor={item.isActive ? colors.success : colors.error}
            size="sm"
          />
        </View>
        <Text style={[styles.arrow, { color: secondaryColor }]}>›</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: textColor }]}>Colleges</Text>
        <Text style={[styles.count, { color: secondaryColor }]}>
          {data?.total ?? 0} total
        </Text>
      </View>
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder="Search colleges..."
          onSearch={handleSearch}
          isDark={isDark}
        />
      </View>

      {isLoading && !refreshing ? (
        <Loader isDark={isDark} />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="🏫"
              title="No colleges found"
              description={search ? `No results for "${search}"` : 'No colleges registered yet'}
              isDark={isDark}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  count: { fontSize: fontSize.sm },
  searchContainer: { paddingHorizontal: spacing[5], marginBottom: spacing[4] },
  list: { paddingHorizontal: spacing[5], paddingBottom: spacing[8] },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    gap: spacing[3],
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: 2 },
  itemCode: { fontSize: fontSize.xs, marginBottom: spacing[1] },
  itemMeta: { flexDirection: 'row', gap: spacing[3] },
  metaText: { fontSize: fontSize.xs },
  badges: { alignItems: 'flex-end', gap: 2 },
  arrow: { fontSize: 20, marginTop: spacing[2] },
});

export default CollegesScreen;
