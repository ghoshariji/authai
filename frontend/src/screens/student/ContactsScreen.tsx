import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, StatusBar, RefreshControl,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../hooks/useTheme';
import { colors } from '../../theme/colors';
import Header from '../../components/common/Header';
import SearchBar from '../../components/common/SearchBar';
import Avatar from '../../components/common/Avatar';
import EmptyState from '../../components/common/EmptyState';
import { useGetContactsQuery, useGetOrCreateDirectChatMutation } from '../../store/api/chatApi';

interface Contact {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

const getRoleBadge = (role: string) => {
  const map: Record<string, { label: string; color: string }> = {
    STUDENT: { label: 'Student', color: colors.info },
    TEACHER: { label: 'Teacher', color: colors.success },
    COLLEGE_ADMIN: { label: 'Admin', color: colors.warning },
  };
  return map[role] || { label: role, color: colors.primary };
};

const ContactItem: React.FC<{
  contact: Contact;
  onPress: (contact: Contact) => void;
  isLoading: boolean;
  isDark: boolean;
}> = ({ contact, onPress, isLoading, isDark }) => {
  const cardBg = isDark ? '#16213E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1A1A2E';
  const subtextColor = isDark ? '#A0A0B0' : '#666680';
  const borderColor = isDark ? '#2D2D4E' : '#E8E8F0';
  const badge = getRoleBadge(contact.role);

  return (
    <TouchableOpacity
      style={[styles.contactCard, { backgroundColor: cardBg, borderColor }]}
      onPress={() => onPress(contact)}
      disabled={isLoading}
      activeOpacity={0.7}>
      <Avatar name={contact.name} imageUrl={contact.avatar} size={50} />
      <View style={styles.contactInfo}>
        <Text style={[styles.contactName, { color: textColor }]}>{contact.name}</Text>
        <Text style={[styles.contactEmail, { color: subtextColor }]} numberOfLines={1}>{contact.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: `${badge.color}18` }]}>
          <Text style={[styles.roleBadgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>
      <View style={[styles.chatBtn, { backgroundColor: `${colors.primary}15` }]}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={styles.chatBtnIcon}>💬</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const ContactsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [startingChatWith, setStartingChatWith] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useGetContactsQuery({ search });
  const [getOrCreateDirectChat] = useGetOrCreateDirectChatMutation();

  const contacts: Contact[] = (data as any)?.data || [];

  const bg = isDark ? '#1A1A2E' : '#F8F9FD';
  const textColor = isDark ? '#FFFFFF' : '#1A1A2E';
  const subtextColor = isDark ? '#A0A0B0' : '#666680';

  const handleStartChat = useCallback(async (contact: Contact) => {
    if (startingChatWith) return;
    setStartingChatWith(contact._id);
    try {
      const result = await getOrCreateDirectChat(contact._id).unwrap();
      const roomData = (result as any).data || result;
      navigation.navigate('ChatRoom', {
        chatRoomId: roomData._id,
        chatRoomName: contact.name,
      });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Failed', text2: err?.data?.message || 'Could not start chat.' });
    } finally {
      setStartingChatWith(null);
    }
  }, [startingChatWith, getOrCreateDirectChat, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bg} />
      <Header title="People" subtitle="Start a direct message" onBack={() => navigation.goBack()} />

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or email…"
        />
      </View>

      <View style={styles.countRow}>
        <Text style={[styles.countText, { color: subtextColor }]}>
          {contacts.length > 0 ? `${contacts.length} people in your college` : ''}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: subtextColor }]}>Loading contacts…</Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <ContactItem
              contact={item}
              onPress={handleStartChat}
              isLoading={startingChatWith === item._id}
              isDark={isDark}
            />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="👥"
              title={search ? 'No results' : 'No contacts yet'}
              description={search ? `No one found matching "${search}"` : 'No other users in your college yet.'}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: { paddingHorizontal: 16, paddingTop: 8 },
  countRow: { paddingHorizontal: 16, paddingVertical: 8 },
  countText: { fontSize: 12, fontWeight: '500' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14 },
  list: { padding: 16, paddingTop: 4, paddingBottom: 40 },
  contactCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  contactEmail: { fontSize: 12, marginBottom: 6 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  roleBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  chatBtn: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  chatBtnIcon: { fontSize: 20 },
});

export default ContactsScreen;
