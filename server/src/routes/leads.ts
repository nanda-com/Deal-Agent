import { Router } from 'express';
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
} from '../services/dataService.js';
import type { ApiResponse, CreateLeadInput, UpdateLeadInput } from '../types/index.js';

const router = Router();

/**
 * GET /api/leads
 * List leads with optional filtering.
 */
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const filters = {
      priority: req.query.priority as string | undefined,
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
    };

    const leads = await getLeads(limit, filters);

    res.json({
      success: true,
      data: leads,
      total: leads.length,
    } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/leads/:id
 * Get a single lead by ID.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const lead = await getLeadById(req.params.id);
    if (!lead) {
      res.status(404).json({ success: false, error: 'Lead not found' } satisfies ApiResponse);
      return;
    }

    res.json({ success: true, data: lead } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/leads
 * Create a new lead.
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, company, email, phone, channel, priority, status, value, notes } = req.body;

    if (!name || !company || !email || !phone || !channel) {
      res.status(400).json({
        success: false,
        error: 'Name, company, email, phone, and channel are required',
      } satisfies ApiResponse);
      return;
    }

    const input: CreateLeadInput = { name, company, email, phone, channel, priority, status, value, notes };
    const lead = await createLead(input);

    res.status(201).json({
      success: true,
      data: lead,
      message: 'Lead created',
    } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/leads/:id
 * Update a lead.
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const input: UpdateLeadInput = req.body;

    if (Object.keys(input).length === 0) {
      res.status(400).json({
        success: false,
        error: 'At least one field to update is required',
      } satisfies ApiResponse);
      return;
    }

    const lead = await updateLead(req.params.id, input);
    if (!lead) {
      res.status(404).json({ success: false, error: 'Lead not found' } satisfies ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: lead,
      message: 'Lead updated',
    } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/leads/:id
 * Delete a lead.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await deleteLead(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Lead not found' } satisfies ApiResponse);
      return;
    }

    res.json({ success: true, message: 'Lead deleted' } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
