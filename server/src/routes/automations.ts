import { Router } from 'express';
import {
  getAutomations,
  getAutomationById,
  createAutomation,
  updateAutomation,
  deleteAutomation,
  incrementAutomationFired,
} from '../services/dataService.js';
import type { ApiResponse, CreateAutomationInput } from '../types/index.js';

const router = Router();

/**
 * GET /api/automations
 * List all automation rules.
 */
router.get('/', async (req, res, next) => {
  try {
    const automations = await getAutomations();

    res.json({
      success: true,
      data: automations,
      total: automations.length,
    } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/automations/:id
 * Get a single automation by ID.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const automation = await getAutomationById(req.params.id);
    if (!automation) {
      res.status(404).json({ success: false, error: 'Automation not found' } satisfies ApiResponse);
      return;
    }

    res.json({ success: true, data: automation } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/automations
 * Create a new automation rule.
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, trigger, action, channel, active } = req.body;

    if (!name || !trigger || !action || !channel) {
      res.status(400).json({
        success: false,
        error: 'Name, trigger, action, and channel are required',
      } satisfies ApiResponse);
      return;
    }

    const input: CreateAutomationInput = { name, trigger, action, channel, active };
    const automation = await createAutomation(input);

    res.status(201).json({
      success: true,
      data: automation,
      message: 'Automation created',
    } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/automations/:id
 * Update an automation (toggle active, edit fields).
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const updates = req.body;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({
        success: false,
        error: 'At least one field to update is required',
      } satisfies ApiResponse);
      return;
    }

    const automation = await updateAutomation(req.params.id, updates);
    if (!automation) {
      res.status(404).json({ success: false, error: 'Automation not found' } satisfies ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: automation,
      message: 'Automation updated',
    } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/automations/:id
 * Delete an automation rule.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await deleteAutomation(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Automation not found' } satisfies ApiResponse);
      return;
    }

    res.json({ success: true, message: 'Automation deleted' } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/automations/:id/fire
 * Increment the "fired" counter for an automation.
 */
router.post('/:id/fire', async (req, res, next) => {
  try {
    await incrementAutomationFired(req.params.id);
    res.json({ success: true, message: 'Counter incremented' } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
