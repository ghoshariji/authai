import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useGetChatRoomsQuery } from '../../store/api/chatApi';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import { formatRelativeTime, truncateText } from '../../utils/helpers';
import { ChatRoom } from '../../types';

const ChatListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: chatRooms, isLoading, refetch } = useGetChatRoomsQuery();

  const bgColor = isDark ? colors.background.dark : colors.background.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;
  const cardBg = isDark ? colors.card.dark : colors.card.light;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getRoomName = (room: ChatRoom) => {
    if (room.type === 'DIRECT') {
      const other = room.participants?.find(p => p._id !== user?._id);
      return other?.name ?? room.name;
    }
    return room.name;
  };

  const getRoomAvatar = (room: ChatRoom) => {
    if (room.type === 'DIRECT') {
      const other = room.participants?.find(p => p._id !== user?._id);
      return other?.avatar;
    }
    return undefined;
  };

  const renderItem = ({ item }: { item: ChatRoom }) => {
    const name = getRoomName(item);
    const avatar = getRoomAvatar(item);
    const lastMsg = item.lastMessage;
    const hasUnread = (item.unreadCount ?? 0) > 0;

    return (
      <TouchableOpacity
        style={[styles.chatItem, { backgroundColor: cardBg }, shadow.sm]}
        onPress={() => navigation.navigate('ChatRoom', { chatRoomId: item._id, name })}
        activeOpacity={0.8}>
        <View style={styles.avatarWrapper}>
          <Avatar name={name} uri={avatar} size={52} backgroundColor={item.type === 'GROUP' ? colors.secondary : colors.primary} />
          {item.type === 'GROUP' && (
            <View style={[styles.groupBadge, { backgroundColor: colors.secondary }]}>
              <Text style={styles.groupBadgeText}>G</Text>
            </View>
          )}
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatName, { color: textColor, fontWeight: hasUnread ? fontWeight.bold : fontWeight.semibold }]}>
              {name}
            </Text>
            {lastMsg && typeof lastMsg === 'object' && 'createdAt' in lastMsg && (
              <Text style={[styles.chatTime, { color: secondaryColor }]}>
                {formatRelativeTime((lastMsg as any).createdAt)}
              </Text>
            )}
          </View>
          <View style={styles.chatFooter}>
            <Text
              style={[
                styles.lastMessage,
                { color: hasUnread ? textColor : secondaryColor, fontWeight: hasUnread ? fontWeight.medium : fontWeight.regular },
              ]}
              numberOfLines={1}>
              {lastMsg ? typeof lastMsg === 'string' ? lastMsg : truncateText((lastMsg as any).content ?? '', 50) : 'No messages yet'}
            </Text>
            {hasUnread && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Messages</Text>
      </View>

      {isLoading ? (
        <Loader isDark={isDark} />
      ) : (
        <FlatList
          data={chatRooms ?? []}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="💬"
              title="No conversations"
              description="Your chats will appear here"
              isDark={isDark}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: spacing[2] }} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[4] },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  list: { paddingHorizontal: spacing[5], paddingBottom: spacing[8] },
  chatItem: { flexDirection: 'row', padding: spacing[3], borderRadius: borderRadius.lg, gap: spacing[3] },
  avatarWrapper: { position: 'relative' },
  groupBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFF',
  },
  groupBadgeText: { color: '#FFF', fontSize: 8, fontWeight: fontWeight.bold },
  chatInfo: { flex: 1, justifyContent: 'center' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[1] },
  chatName: { fontSize: fontSize.md, flex: 1, marginRight: spacing[2] },
  chatTime: { fontSize: fontSize.xs },
  chatFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lastMessage: { fontSize: fontSize.sm, flex: 1 },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  unreadText: { color: '#FFF', fontSize: fontSize.xs, fontWeight: fontWeight.bold },
});

export default ChatListScreen;
