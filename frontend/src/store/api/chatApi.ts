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
    getChatRooms: builder.query<ChatRoom[], void>({
      query: () => '/chat/rooms',
      providesTags: ['ChatRoom'],
    }),
    getChatRoom: builder.query<ChatRoom, string>({
      query: id => `/chat/rooms/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'ChatRoom', id }],
    }),
    createChatRoom: builder.mutation<ChatRoom, CreateChatRoomData>({
      query: data => ({
        url: '/chat/rooms',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ChatRoom'],
    }),
    getMessages: builder.query<PaginatedResponse<Message>, GetMessagesParams>({
      query: ({ chatRoomId, ...params }) => ({
        url: `/chat/rooms/${chatRoomId}/messages`,
        params,
      }),
      providesTags: ['Message'],
    }),
    sendMessage: builder.mutation<Message, SendMessageData>({
      query: ({ chatRoomId, ...data }) => ({
        url: `/chat/rooms/${chatRoomId}/messages`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Message', 'ChatRoom'],
    }),
    markMessagesRead: builder.mutation<void, string>({
      query: chatRoomId => ({
        url: `/chat/rooms/${chatRoomId}/read`,
        method: 'POST',
      }),
      invalidatesTags: ['ChatRoom'],
    }),
  }),
});

export const {
  useGetChatRoomsQuery,
  useGetChatRoomQuery,
  useCreateChatRoomMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkMessagesReadMutation,
} = chatApi;
