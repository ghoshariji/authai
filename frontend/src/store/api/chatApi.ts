import { baseApi } from './baseApi';
import { ChatRoom, Message, PaginatedResponse } from '../../types';

interface GetMessagesParams {
  chatRoomId: string;
  page?: number;
  limit?: number;
}

interface CreateChatRoomData {
  name: string;
  type: string;
  participantIds: string[];
}

interface SendMessageData {
  chatRoomId: string;
  content: string;
  type?: string;
  fileUrl?: string;
}

export const chatApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getChatRooms: builder.query<ChatRoom[], { type?: string } | void>({
      query: (params) => ({ url: '/chat', params: params || {} }),
      providesTags: ['ChatRoom'],
    }),
    getChatRoom: builder.query<ChatRoom, string>({
      query: id => `/chat/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'ChatRoom', id }],
    }),
    // Get all users in the college for DM discovery
    getContacts: builder.query<any[], { search?: string; page?: number }>({
      query: (params) => ({ url: '/chat/contacts', params }),
      providesTags: ['ChatRoom'],
    }),
    // Find or create a direct 1-on-1 chat with another user (same college)
    getOrCreateDirectChat: builder.mutation<ChatRoom, string>({
      query: (userId) => ({
        url: `/chat/direct/${userId}`,
        method: 'POST',
      }),
      invalidatesTags: ['ChatRoom'],
    }),
    createChatRoom: builder.mutation<ChatRoom, CreateChatRoomData>({
      query: data => ({
        url: '/chat',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ChatRoom'],
    }),
    getMessages: builder.query<PaginatedResponse<Message>, GetMessagesParams>({
      query: ({ chatRoomId, ...params }) => ({
        url: `/chat/${chatRoomId}/messages`,
        params,
      }),
      providesTags: ['Message'],
    }),
    sendMessage: builder.mutation<Message, SendMessageData>({
      query: ({ chatRoomId, ...data }) => ({
        url: `/chat/${chatRoomId}/messages`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Message', 'ChatRoom'],
    }),
    markMessagesRead: builder.mutation<void, string>({
      query: chatRoomId => ({
        url: `/chat/${chatRoomId}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['ChatRoom'],
    }),
  }),
});

export const {
  useGetChatRoomsQuery,
  useGetChatRoomQuery,
  useGetContactsQuery,
  useGetOrCreateDirectChatMutation,
  useCreateChatRoomMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkMessagesReadMutation,
} = chatApi;
