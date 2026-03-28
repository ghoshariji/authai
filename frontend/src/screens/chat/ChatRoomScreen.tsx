import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { launchImageLibrary } from 'react-native-image-picker';
import { useGetMessagesQuery, useSendMessageMutation, useMarkMessagesReadMutation } from '../../store/api/chatApi';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { socketService } from '../../services/socket';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import Header from '../../components/common/Header';
import Avatar from '../../components/common/Avatar';
import { formatTime, formatDate } from '../../utils/helpers';
import { Message } from '../../types';

type RouteParams = { chatRoomId: string; name: string };

const ChatRoomScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { chatRoomId, name } = route.params;

  const [messageText, setMessageText] = useState('');
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: messagesData, isLoading } = useGetMessagesQuery({ chatRoomId, limit: 50 });
  const [sendMessage, { isLoading: sending }] = useSendMessageMutation();
  const [markRead] = useMarkMessagesReadMutation();

  const bgColor = isDark ? colors.background.dark : colors.background.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;
  const cardBg = isDark ? colors.card.dark : colors.card.light;
  const myBubble = colors.primary;
  const otherBubble = isDark ? colors.card.dark : '#F0F0F5';

  useEffect(() => {
    if (messagesData?.data) {
      setLocalMessages([...messagesData.data].reverse());
    }
  }, [messagesData]);

  useEffect(() => {
    socketService.joinRoom(chatRoomId);
    markRead(chatRoomId);

    const handleNewMessage = (message: Message) => {
      setLocalMessages(prev => [...prev, message]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };

    socketService.onMessage(chatRoomId, handleNewMessage);

    const typingHandler = (data: { roomId: string; userId: string; isTyping: boolean }) => {
      if (data.roomId === chatRoomId && data.userId !== user?._id) {
        setIsTyping(data.isTyping);
      }
    };
    socketService.onTyping(typingHandler);

    return () => {
      socketService.leaveRoom(chatRoomId);
      socketService.removeListener('newMessage');
      socketService.removeListener('typing');
    };
  }, [chatRoomId]);

  const handleTyping = (text: string) => {
    setMessageText(text);
    socketService.emitTyping(chatRoomId, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.emitTyping(chatRoomId, false);
    }, 1500);
  };

  const handleSend = async () => {
    if (!messageText.trim()) return;
    const text = messageText.trim();
    setMessageText('');
    socketService.emitTyping(chatRoomId, false);

    // Optimistic update
    const optimisticMsg: Message = {
      _id: `temp-${Date.now()}`,
      sender: user!,
      content: text,
      type: 'TEXT',
      chatRoom: chatRoomId,
      readBy: [user?._id ?? ''],
      createdAt: new Date().toISOString(),
    };
    setLocalMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const result = await sendMessage({ chatRoomId, content: text, type: 'TEXT' }).unwrap();
      setLocalMessages(prev => prev.map(m => m._id === optimisticMsg._id ? result : m));
    } catch {
      setLocalMessages(prev => prev.filter(m => m._id !== optimisticMsg._id));
      Toast.show({ type: 'error', text1: 'Failed to send message' });
      setMessageText(text);
    }
  };

  const handleAttachment = async () => {
    launchImageLibrary({ mediaType: 'mixed' }, async response => {
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        Toast.show({ type: 'info', text1: 'Uploading...', text2: asset.fileName });
        // In production, upload file and send URL
      }
    });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.sender?._id === user?._id;
    const prevMsg = localMessages[index - 1];
    const showAvatar = !isMe && (!prevMsg || prevMsg.sender?._id !== item.sender?._id);
    const showDate = !prevMsg || formatDate(prevMsg.createdAt) !== formatDate(item.createdAt);
    const isRead = item.readBy?.length > 1;

    return (
      <>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={[styles.dateText, { color: secondaryColor }]}>{formatDate(item.createdAt)}</Text>
          </View>
        )}
        <View style={[styles.messageRow, isMe && styles.myMessageRow]}>
          {!isMe && (
            <View style={styles.avatarSlot}>
              {showAvatar && <Avatar name={item.sender?.name ?? 'U'} uri={item.sender?.avatar} size={32} />}
            </View>
          )}
          <View style={[styles.bubbleContainer, isMe && styles.myBubbleContainer]}>
            {!isMe && showAvatar && (
              <Text style={[styles.senderName, { color: colors.primary }]}>{item.sender?.name}</Text>
            )}
            <View style={[
              styles.bubble,
              { backgroundColor: isMe ? myBubble : otherBubble },
              isMe ? styles.myBubble : styles.otherBubble,
            ]}>
              <Text style={[styles.messageText, { color: isMe ? '#FFFFFF' : textColor }]}>
                {item.content}
              </Text>
              <View style={styles.msgMeta}>
                <Text style={[styles.msgTime, { color: isMe ? 'rgba(255,255,255,0.7)' : secondaryColor }]}>
                  {formatTime(item.createdAt)}
                </Text>
                {isMe && (
                  <Text style={{ color: isRead ? '#A0E8FF' : 'rgba(255,255,255,0.5)', fontSize: 10, marginLeft: 4 }}>
                    {isRead ? '✓✓' : '✓'}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <Header
        title={name}
        subtitle={isTyping ? 'typing...' : 'Online'}
        onBack={() => navigation.goBack()}
        isDark={isDark}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex} keyboardVerticalOffset={0}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={localMessages}
            keyExtractor={item => item._id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={{ fontSize: 48 }}>👋</Text>
                <Text style={[styles.emptyChatText, { color: secondaryColor }]}>Say hello to start the conversation</Text>
              </View>
            }
          />
        )}

        {/* Input Area */}
        <View style={[styles.inputArea, { backgroundColor: isDark ? colors.surface.dark : colors.surface.light, borderTopColor: isDark ? colors.border.dark : colors.border.light }]}>
          <TouchableOpacity onPress={handleAttachment} style={styles.attachBtn}>
            <Text style={{ fontSize: 22 }}>📎</Text>
          </TouchableOpacity>
          <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.card.dark : '#F5F5F5', borderColor: isDark ? colors.border.dark : colors.border.light }]}>
            <TextInput
              value={messageText}
              onChangeText={handleTyping}
              placeholder="Type a message..."
              placeholderTextColor={secondaryColor}
              style={[styles.input, { color: textColor }]}
              multiline
              maxLength={1000}
              returnKeyType="default"
            />
          </View>
          <TouchableOpacity
            onPress={handleSend}
            disabled={!messageText.trim() || sending}
            style={[styles.sendBtn, { backgroundColor: messageText.trim() ? colors.primary : (isDark ? colors.border.dark : '#E0E0E0') }]}>
            {sending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={{ fontSize: 16 }}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messagesList: { paddingHorizontal: spacing[4], paddingVertical: spacing[4] },
  dateSeparator: { alignItems: 'center', marginVertical: spacing[3] },
  dateText: { fontSize: fontSize.xs, backgroundColor: 'rgba(128,128,128,0.1)', paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: borderRadius.full },
  messageRow: { flexDirection: 'row', marginBottom: spacing[2], alignItems: 'flex-end' },
  myMessageRow: { justifyContent: 'flex-end' },
  avatarSlot: { width: 36, marginRight: spacing[1] },
  bubbleContainer: { maxWidth: '75%' },
  myBubbleContainer: { alignItems: 'flex-end' },
  senderName: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, marginBottom: 2, paddingLeft: spacing[2] },
  bubble: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: borderRadius.lg },
  myBubble: { borderBottomRightRadius: 4 },
  otherBubble: { borderBottomLeftRadius: 4 },
  messageText: { fontSize: fontSize.md, lineHeight: 20 },
  msgMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: spacing[1] },
  msgTime: { fontSize: 10 },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: spacing[3] },
  emptyChatText: { fontSize: fontSize.md, textAlign: 'center' },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing[3],
    borderTopWidth: 1,
    gap: spacing[2],
  },
  attachBtn: { padding: spacing[2], justifyContent: 'center' },
  inputWrapper: {
    flex: 1,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    maxHeight: 120,
  },
  input: { fontSize: fontSize.md, lineHeight: 20 },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatRoomScreen;
