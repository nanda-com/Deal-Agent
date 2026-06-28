import { Router, type Request, type Response } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import type { ApiResponse } from '../types/index.js';

import authRoutes from './auth.js';
import conversationRoutes from './conversations.js';
import leadRoutes from './leads.js';
import automationRoutes from './automations.js';
import analyticsRoutes from './analytics.js';
import voiceRoutes, { twilioWebhookRouter } from './voice.js';
import aiRoutes from './ai.js';
import settingsRoutes from './settings.js';
import voiceProfilesRoutes from './voiceProfiles.js';

const router = Router();

// Health check — no auth required
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  } satisfies ApiResponse);
});

// Public routes — no auth required
router.use('/auth', optionalAuth, authRoutes);

// Twilio webhooks must be public — Twilio servers cannot pass Firebase tokens
router.use('/voice-twilio', twilioWebhookRouter);

// Protected routes (require Firebase auth)
router.use('/voice', requireAuth, voiceRoutes);
router.use('/voice-profiles', requireAuth, voiceProfilesRoutes);
router.use('/conversations', requireAuth, conversationRoutes);
router.use('/leads', requireAuth, leadRoutes);
router.use('/automations', requireAuth, automationRoutes);
router.use('/analytics', requireAuth, analyticsRoutes);
router.use('/ai', requireAuth, aiRoutes);
router.use('/settings', requireAuth, settingsRoutes);

export default router;
