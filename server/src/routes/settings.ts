import { Router } from 'express';
import { getSettings, updateSettings } from '../services/dataService.js';
import type { ApiResponse, UpdateSettingsInput } from '../types/index.js';

const router = Router();

/**
 * GET /api/settings
 * Get workspace settings.
 */
router.get('/', async (req, res, next) => {
  try {
    const workspaceId = (req.query.workspaceId as string) || 'default';
    const settings = await getSettings(workspaceId);

    if (!settings) {
      // Return defaults if no settings exist yet
      res.json({
        success: true,
        data: {
          workspaceName: 'My Workspace',
          timezone: 'Asia/Kolkata (IST)',
          businessHours: '9:00 — 19:00',
          defaultLanguage: 'English',
          aiPersona: 'You are Nova, the friendly AI assistant for Acme Inc. Be concise, warm and proactive.',
          aiModel: 'gemini-2.0-flash',
          channels: {
            whatsapp: true,
            instagram: true,
            facebook: true,
            linkedin: true,
            web: true,
          },
          integrations: ['HubSpot CRM', 'Google Sheets', 'Salesforce', 'Calendly'],
        },
      } satisfies ApiResponse);
      return;
    }

    res.json({ success: true, data: settings } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/settings
 * Update workspace settings.
 */
router.put('/', async (req, res, next) => {
  try {
    const workspaceId = (req.query.workspaceId as string) || 'default';
    const input = req.body as UpdateSettingsInput;

    if (Object.keys(input).length === 0) {
      res.status(400).json({
        success: false,
        error: 'At least one setting field is required to update',
      } satisfies ApiResponse);
      return;
    }

    const settings = await updateSettings(workspaceId, input);

    res.json({
      success: true,
      data: settings,
      message: 'Settings updated',
    } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/settings/channels
 * Update channel connection status.
 */
router.patch('/channels', async (req, res, next) => {
  try {
    const workspaceId = (req.query.workspaceId as string) || 'default';
    const { channels } = req.body as { channels: Record<string, boolean> };

    if (!channels || typeof channels !== 'object') {
      res.status(400).json({
        success: false,
        error: 'channels object is required',
      } satisfies ApiResponse);
      return;
    }

    const settings = await updateSettings(workspaceId, { channels: channels as Record<string, boolean> });

    res.json({
      success: true,
      data: settings,
      message: 'Channel settings updated',
    } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/settings/persona
 * Update the AI persona prompt.
 */
router.patch('/persona', async (req, res, next) => {
  try {
    const workspaceId = (req.query.workspaceId as string) || 'default';
    const { aiPersona, aiModel } = req.body as { aiPersona?: string; aiModel?: string };

    if (!aiPersona && !aiModel) {
      res.status(400).json({
        success: false,
        error: 'aiPersona or aiModel is required',
      } satisfies ApiResponse);
      return;
    }

    const settings = await updateSettings(workspaceId, { aiPersona, aiModel } as UpdateSettingsInput);

    res.json({
      success: true,
      data: settings,
      message: 'AI persona updated',
    } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
