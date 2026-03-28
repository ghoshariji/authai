const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const ApiResponse = require('../utils/apiResponse');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const createChatRoom = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    const { name, type, participantIds, classId, departmentId } = req.body;

    const participants = [
      { user: req.user.id, role: 'ADMIN' },
      ...(participantIds || []).filter((id) => id !== req.user.id.toString()).map((id) => ({ user: id, role: 'MEMBER' })),
    ];

    const chatRoom = await ChatRoom.create({
      name,
      type: type || 'GROUP',
      participants,
      class: classId || null,
      department: departmentId || null,
      collegeId,
      createdBy: req.user.id,
    });

    const populated = await ChatRoom.findById(chatRoom._id)
      .populate('participants.user', 'name email avatar role')
      .populate('class', 'name section')
      .populate('department', 'name')
      .lean();

    return ApiResponse.created(res, 'Chat room created successfully', populated);
  } catch (error) {
    next(error);
  }
};

const getChatRooms = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    const { page, limit, skip } = getPaginationParams(req.query);

    const filter = {
      collegeId,
      isActive: true,
      'participants.user': req.user.id,
    };

    if (req.query.type) filter.type = req.query.type;

    const [data, total] = await Promise.all([
      ChatRoom.find(filter)
        .populate('participants.user', 'name avatar role')
        .populate('class', 'name section')
        .populate('department', 'name')
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ChatRoom.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, 'Chat rooms retrieved', data, buildPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

const getChatRoomById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;

    const chatRoom = await ChatRoom.findOne({
      _id: id,
      collegeId,
      'participants.user': req.user.id,
    })
      .populate('participants.user', 'name avatar role')
      .populate('class', 'name section')
      .populate('department', 'name')
      .lean();

    if (!chatRoom) {
      return ApiResponse.notFound(res, 'Chat room not found');
    }

    return ApiResponse.success(res, 'Chat room retrieved', chatRoom);
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;
    const { page, limit, skip } = getPaginationParams(req.query);

    // Ensure user is participant
    const chatRoom = await ChatRoom.findOne({
      _id: id,
      collegeId,
      'participants.user': req.user.id,
    });

    if (!chatRoom) {
      return ApiResponse.notFound(res, 'Chat room not found or access denied');
    }

    const filter = { chatRoom: id, collegeId, isDeleted: false };

    const [data, total] = await Promise.all([
      Message.find(filter)
        .populate('sender', 'name avatar role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, 'Messages retrieved', data.reverse(), buildPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;
    const { content, type = 'TEXT' } = req.body;

    const chatRoom = await ChatRoom.findOne({
      _id: id,
      collegeId,
      'participants.user': req.user.id,
      isActive: true,
    });

    if (!chatRoom) {
      return ApiResponse.notFound(res, 'Chat room not found or access denied');
    }

    const message = await Message.create({
      chatRoom: id,
      sender: req.user.id,
      content,
      type,
      collegeId,
      readBy: [{ user: req.user.id, readAt: new Date() }],
    });

    // Update last message in room
    await ChatRoom.findByIdAndUpdate(id, {
      lastMessage: content?.substring(0, 100) || `[${type}]`,
      lastMessageAt: new Date(),
    });

    const populated = await Message.findById(message._id)
      .populate('sender', 'name avatar role')
      .lean();

    return ApiResponse.created(res, 'Message sent', populated);
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params; // chatRoom id
    const collegeId = req.collegeId || req.user.collegeId;

    await Message.updateMany(
      {
        chatRoom: id,
        collegeId,
        isDeleted: false,
        'readBy.user': { $ne: req.user.id },
      },
      {
        $push: { readBy: { user: req.user.id, readAt: new Date() } },
      }
    );

    return ApiResponse.success(res, 'Messages marked as read');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createChatRoom,
  getChatRooms,
  getChatRoomById,
  getMessages,
  sendMessage,
  markAsRead,
};
