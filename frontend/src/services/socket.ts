import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';

class SocketService {
  private socket: Socket | null = null;
  private messageCallbacks: Map<string, (message: any) => void> = new Map();

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.messageCallbacks.clear();
  }

  joinRoom(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('joinRoom', { roomId });
    }
  }

  leaveRoom(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leaveRoom', { roomId });
    }
  }

  sendMessage(roomId: string, content: string, type: string = 'TEXT', fileUrl?: string): void {
    if (this.socket?.connected) {
      this.socket.emit('sendMessage', { roomId, content, type, fileUrl });
    }
  }

  onMessage(roomId: string, callback: (message: any) => void): void {
    this.messageCallbacks.set(roomId, callback);
    this.socket?.on('newMessage', (data: { roomId: string; message: any }) => {
      if (data.roomId === roomId) {
        const cb = this.messageCallbacks.get(roomId);
        if (cb) cb(data.message);
      }
    });
  }

  onNewMessage(callback: (data: { roomId: string; message: any }) => void): void {
    this.socket?.on('newMessage', callback);
  }

  offNewMessage(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off('newMessage', callback);
    } else {
      this.socket?.off('newMessage');
    }
  }

  onTyping(callback: (data: { roomId: string; userId: string; isTyping: boolean }) => void): void {
    this.socket?.on('typing', callback);
  }

  emitTyping(roomId: string, isTyping: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('typing', { roomId, isTyping });
    }
  }

  onUserOnline(callback: (userId: string) => void): void {
    this.socket?.on('userOnline', callback);
  }

  onUserOffline(callback: (userId: string) => void): void {
    this.socket?.on('userOffline', callback);
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  removeListener(event: string): void {
    this.socket?.off(event);
  }
}

export const socketService = new SocketService();
