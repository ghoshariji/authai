const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenantIsolation');
const { requireActiveSubscription, requireFeature } = require('../middleware/subscriptionGuard');

router.use(authenticate, tenantIsolation, requireActiveSubscription, requireFeature('chat'));

// Contacts list for DM discovery (must come before /:id routes)
router.get('/contacts', chatController.getCollegeContacts);

// Direct 1-on-1 chat — find or create
router.post('/direct/:userId', chatController.getOrCreateDirectChat);

router.get('/', chatController.getChatRooms);
router.get('/:id', chatController.getChatRoomById);
router.get('/:id/messages', chatController.getMessages);

router.post('/', chatController.createChatRoom);
router.post('/:id/messages', chatController.sendMessage);
router.put('/:id/read', chatController.markAsRead);

module.exports = router;
