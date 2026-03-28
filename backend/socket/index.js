const { verifyAccessToken } = require('../src/utils/tokenUtils');
const { User } = require('../src/models/User');
const ChatRoom = require('../src/models/ChatRoom');
const Message = require('../src/models/Message');
const logger = require('../src/utils/logger');

const initializeSocket = (io) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      let decoded;
      try {
        decoded = verifyAccessToken(token);
      } catch {
        return next(new Error('Invalid or expired token'));
      }

      const user = await User.findById(decoded.id).select('name email role collegeId isActive');
      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        collegeId: user.collegeId?.toString(),
      };

      next();
    } catch (error) {
      logger.error(`Socket auth error: ${error.message}`);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.user.name} (${socket.user.id})`);

    // Join user's personal room for direct notifications
    socket.join(`user:${socket.user.id}`);

    // Join college room
    if (socket.user.collegeId) {
      socket.join(`college:${socket.user.collegeId}`);
    }

    // Join a specific chat room
    socket.on('join-room', async (chatRoomId) => {
      try {
        const chatRoom = await ChatRoom.findOne({
          _id: chatRoomId,
          collegeId: socket.user.collegeId,
          'participants.user': socket.user.id,
          isActive: true,
        });

        if (!chatRoom) {
          socket.emit('error', { message: 'Chat room not found or access denied' });
          return;
        }

        socket.join(`chatroom:${chatRoomId}`);
        socket.emit('joined-room', { chatRoomId, message: 'Joined successfully' });
        logger.debug(`${socket.user.name} joined room ${chatRoomId}`);
      } catch (error) {
        logger.error(`Join room error: ${error.message}`);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Leave a chat room
    socket.on('leave-room', (chatRoomId) => {
      socket.leave(`chatroom:${chatRoomId}`);
      socket.emit('left-room', { chatRoomId });
    });

    // Send a message to a chat room
    socket.on('send-message', async (data) => {
      try {
        const { chatRoomId, content, type = 'TEXT' } = data;

        if (!chatRoomId || (!content && type === 'TEXT')) {
          socket.emit('error', { message: 'chatRoomId and content are required' });
          return;
        }

        const chatRoom = await ChatRoom.findOne({
          _id: chatRoomId,
          collegeId: socket.user.collegeId,
          'participants.user': socket.user.id,
          isActive: true,
        });

        if (!chatRoom) {
          socket.emit('error', { message: 'Chat room not found or access denied' });
          return;
        }

        const message = await Message.create({
          chatRoom: chatRoomId,
          sender: socket.user.id,
          content,
          type,
          collegeId: socket.user.collegeId,
          readBy: [{ user: socket.user.id, readAt: new Date() }],
        });

        // Update chat room last message
        await ChatRoom.findByIdAndUpdate(chatRoomId, {
          lastMessage: content?.substring(0, 100) || `[${type}]`,
          lastMessageAt: new Date(),
        });

        const populated = await Message.findById(message._id)
          .populate('sender', 'name avatar role')
          .lean();

        // Emit to all participants in the room
        io.to(`chatroom:${chatRoomId}`).emit('new-message', populated);

        // Notify participants not in the room
        chatRoom.participants.forEach((p) => {
          const participantId = p.user.toString();
          if (participantId !== socket.user.id) {
            io.to(`user:${participantId}`).emit('message-notification', {
              chatRoomId,
              chatRoomName: chatRoom.name,
              sender: socket.user.name,
              preview: content?.substring(0, 50) || `[${type}]`,
            });
          }
        });
      } catch (error) {
        logger.error(`Send message socket error: ${error.message}`);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing-start', (chatRoomId) => {
      socket.to(`chatroom:${chatRoomId}`).emit('user-typing', {
        userId: socket.user.id,
        name: socket.user.name,
      });
    });

    socket.on('typing-stop', (chatRoomId) => {
      socket.to(`chatroom:${chatRoomId}`).emit('user-stopped-typing', {
        userId: socket.user.id,
      });
    });

    // Mark messages as read
    socket.on('mark-read', async (chatRoomId) => {
      try {
        await Message.updateMany(
          {
            chatRoom: chatRoomId,
            collegeId: socket.user.collegeId,
            isDeleted: false,
            'readBy.user': { $ne: socket.user.id },
          },
          { $push: { readBy: { user: socket.user.id, readAt: new Date() } } }
        );

        socket.to(`chatroom:${chatRoomId}`).emit('messages-read', {
          userId: socket.user.id,
          chatRoomId,
        });
      } catch (error) {
        logger.error(`Mark read socket error: ${error.message}`);
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.user.name} — ${reason}`);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.user.name}: ${error.message}`);
    });
  });

  return io;
};

module.exports = { initializeSocket };
