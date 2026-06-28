import { Router } from 'express';
import {
  getConversations,
  getConversationById,
  createConversation,
  sendMessage,
  getMessages,
} from '../services/dataService.js';
import type { ApiResponse, SendMessageInput } from '../types/index.js';

const router = Router();

/**
 * GET /api/conversations
 * List conversations, optionally filtered by channel.
 */
router.get('/', async (req, res, next) => {
  try {
    const channel = req.query.channel as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const conversations = await getConversations(limit, channel);

    res.json({
      success: true,
      data: conversations,
      total: conversations.length,
    } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/conversations/:id
 * Get a single conversation by ID.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const conversation = await getConversationById(req.params.id);
    if (!conversation) {
      res.status(404).json({ success: false, error: 'Conversation not found' } satisfies ApiResponse);
      return;
    }

    res.json({ success: true, data: conversation } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/conversations
 * Create a new conversation.
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, channel, assignee } = req.body;

    if (!name || !channel) {
      res.status(400).json({
        success: false,
        error: 'Name and channel are required',
      } satisfies ApiResponse);
      return;
    }

    const conversation = await createConversation({ name, channel, assignee });
    res.status(201).json({
      success: true,
      data: conversation,
      message: 'Conversation created',
    } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/conversations/:id/messages
 * Get messages for a conversation.
 */
router.get('/:id/messages', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const messages = await getMessages(req.params.id, limit);

    res.json({
      success: true,
      data: messages,
      total: messages.length,
    } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/conversations/:id/messages
 * Send a message in a conversation.
 */
router.post('/:id/messages', async (req, res, next) => {
  try {
    const { from, text } = req.body;

    if (!from || !text) {
      res.status(400).json({
        success: false,
        error: 'from (sender type) and text are required',
      } satisfies ApiResponse);
      return;
    }

    const validSenders = ['user', 'ai', 'agent'];
    if (!validSenders.includes(from)) {
      res.status(400).json({
        success: false,
        error: `from must be one of: ${validSenders.join(', ')}`,
      } satisfies ApiResponse);
      return;
    }

    const input: SendMessageInput = {
      conversationId: req.params.id,
      from,
      text,
    };

    const message = await sendMessage(input);
    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent',
    } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
