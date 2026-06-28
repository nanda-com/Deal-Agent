// ============================================================
// server/src/routes/ai.ts  (updated — CascadeFlow integrated)
// ============================================================
import { Router } from 'express';
import { generateReply, scoreLead, generateSummary, generateSuggestedResponses, generateCampaignMessage } from '../services/gemini.js';
import { getMessages, getConversationById, updateLead, getSettings } from '../services/dataService.js';
import { withBudget, BudgetExceededError } from '../services/cascadeflow.js';
import type { ApiResponse, AiReplyRequest, AiLeadScoreRequest } from '../types/index.js';

const router = Router();

// Budget per call type (tune these for your demo)
const BUDGETS = {
  reply: 0.01,       // $0.01 per AI reply
  scoreLead: 0.005,  // $0.005 per lead score
  summary: 0.008,    // $0.008 per summary
  suggestions: 0.01, // $0.01 per suggested responses
  campaign: 0.005,   // $0.005 per campaign message
};

/**
 * POST /api/ai/reply
 */
router.post('/reply', async (req, res, next) => {
  try {
    const { conversationId, messageHistory, persona } = req.body as AiReplyRequest;

    if (!conversationId || !messageHistory || !Array.isArray(messageHistory)) {
      res.status(400).json({ success: false, error: 'conversationId and messageHistory array are required' } satisfies ApiResponse);
      return;
    }

    let aiPersona = persona;
    if (!aiPersona) {
      const settings = await getSettings();
      if (settings?.aiPersona) aiPersona = settings.aiPersona;
    }

    const prompt = JSON.stringify(messageHistory); // used for budget estimation

    const { result: response, cascadeStats } = await withBudget(
      BUDGETS.reply,
      prompt,
      () => generateReply(messageHistory, aiPersona)
    );

    res.json({ success: true, data: { ...response, cascadeStats }, cascadeStats } satisfies ApiResponse);
  } catch (error: any) {
    if (error instanceof BudgetExceededError) {
      res.status(429).json({
        success: false,
        error: error.message,
        cascadeStats: error.cascadeStats,
      } satisfies ApiResponse);
      return;
    }
    if (error && error.cascadeStats) {
      res.status(500).json({
        success: false,
        error: error.message || String(error),
        cascadeStats: error.cascadeStats,
      } satisfies ApiResponse);
      return;
    }
    next(error);
  }
});

/**
 * POST /api/ai/score-lead
 */
router.post('/score-lead', async (req, res, next) => {
  try {
    const { leadId, conversationHistory } = req.body as AiLeadScoreRequest;

    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      res.status(400).json({ success: false, error: 'conversationHistory array is required' } satisfies ApiResponse);
      return;
    }

    const prompt = JSON.stringify(conversationHistory);

    const { result, cascadeStats } = await withBudget(
      BUDGETS.scoreLead,
      prompt,
      () => scoreLead(conversationHistory)
    );

    if (leadId) {
      await updateLead(leadId, { aiScore: result.score, priority: result.priority });
    }

    res.json({ success: true, data: { ...result, cascadeStats }, cascadeStats, message: leadId ? 'Lead scored and updated' : 'Lead scored' } satisfies ApiResponse);
  } catch (error: any) {
    if (error instanceof BudgetExceededError) {
      res.status(429).json({ success: false, error: error.message, cascadeStats: error.cascadeStats } satisfies ApiResponse);
      return;
    }
    if (error && error.cascadeStats) {
      res.status(500).json({ success: false, error: error.message || String(error), cascadeStats: error.cascadeStats } satisfies ApiResponse);
      return;
    }
    next(error);
  }
});

/**
 * POST /api/ai/conversation-summary
 */
router.post('/conversation-summary', async (req, res, next) => {
  try {
    const { conversationId } = req.body as { conversationId: string };

    if (!conversationId) {
      res.status(400).json({ success: false, error: 'conversationId is required' } satisfies ApiResponse);
      return;
    }

    const messages = await getMessages(conversationId);
    const history = messages.map((msg) => ({ role: msg.from, text: msg.text }));
    const prompt = JSON.stringify(history);

    const { result: summary, cascadeStats } = await withBudget(
      BUDGETS.summary,
      prompt,
      () => generateSummary(history)
    );

    res.json({ success: true, data: { summary, cascadeStats }, cascadeStats } satisfies ApiResponse);
  } catch (error: any) {
    if (error instanceof BudgetExceededError) {
      res.status(429).json({ success: false, error: error.message, cascadeStats: error.cascadeStats } satisfies ApiResponse);
      return;
    }
    if (error && error.cascadeStats) {
      res.status(500).json({ success: false, error: error.message || String(error), cascadeStats: error.cascadeStats } satisfies ApiResponse);
      return;
    }
    next(error);
  }
});

/**
 * POST /api/ai/suggested-responses
 */
router.post('/suggested-responses', async (req, res, next) => {
  try {
    const { conversationId, messageHistory, count } = req.body as {
      conversationId?: string;
      messageHistory?: { role: string; text: string }[];
      count?: number;
    };

    let history = messageHistory;
    if (!history && conversationId) {
      const { getMessages } = await import('../services/dataService.js');
      const messages = await getMessages(conversationId);
      history = messages.map((msg) => ({ role: msg.from, text: msg.text }));
    }

    if (!history || !Array.isArray(history) || history.length === 0) {
      res.status(400).json({ success: false, error: 'messageHistory array or conversationId is required' } satisfies ApiResponse);
      return;
    }

    const prompt = JSON.stringify(history);

    const { result: suggestions, cascadeStats } = await withBudget(
      BUDGETS.suggestions,
      prompt,
      () => generateSuggestedResponses(history!, count)
    );

    res.json({ success: true, data: { suggestions, cascadeStats }, cascadeStats } satisfies ApiResponse);
  } catch (error: any) {
    if (error instanceof BudgetExceededError) {
      res.status(429).json({ success: false, error: error.message, cascadeStats: error.cascadeStats } satisfies ApiResponse);
      return;
    }
    if (error && error.cascadeStats) {
      res.status(500).json({ success: false, error: error.message || String(error), cascadeStats: error.cascadeStats } satisfies ApiResponse);
      return;
    }
    next(error);
  }
});

/**
 * POST /api/ai/auto-reply
 */
router.post('/auto-reply', async (req, res, next) => {
  try {
    const { conversationId } = req.body as { conversationId: string };

    if (!conversationId) {
      res.status(400).json({ success: false, error: 'conversationId is required' } satisfies ApiResponse);
      return;
    }

    const conversation = await getConversationById(conversationId);
    if (!conversation) {
      res.status(404).json({ success: false, error: 'Conversation not found' } satisfies ApiResponse);
      return;
    }

    const messages = await getMessages(conversationId);
    const history = messages.map((msg) => ({ role: msg.from, text: msg.text }));

    let aiPersona: string | undefined;
    try {
      const settings = await getSettings();
      if (settings?.aiPersona) aiPersona = settings.aiPersona;
    } catch { /* use default */ }

    const prompt = JSON.stringify(history);

    const { result: response, cascadeStats } = await withBudget(
      BUDGETS.reply,
      prompt,
      () => generateReply(history, aiPersona)
    );

    res.json({ success: true, data: { ...response, cascadeStats }, cascadeStats } satisfies ApiResponse);
  } catch (error: any) {
    if (error instanceof BudgetExceededError) {
      res.status(429).json({ success: false, error: error.message, cascadeStats: error.cascadeStats } satisfies ApiResponse);
      return;
    }
    if (error && error.cascadeStats) {
      res.status(500).json({ success: false, error: error.message || String(error), cascadeStats: error.cascadeStats } satisfies ApiResponse);
      return;
    }
    next(error);
  }
});

/**
 * POST /api/ai/campaign-message
 */
router.post('/campaign-message', async (req, res, next) => {
  try {
    const { campaignName, campaignType, audienceDescription } = req.body as {
      campaignName?: string;
      campaignType?: string;
      audienceDescription?: string;
    };

    if (!campaignName || !campaignType) {
      res.status(400).json({ success: false, error: 'campaignName and campaignType are required' } satisfies ApiResponse);
      return;
    }

    const prompt = `${campaignName} ${campaignType} ${audienceDescription ?? ''}`;

    const { result: message, cascadeStats } = await withBudget(
      BUDGETS.campaign,
      prompt,
      () => generateCampaignMessage({ campaignName, campaignType, audienceDescription: audienceDescription ?? 'All leads' })
    );

    res.json({ success: true, data: { message, cascadeStats }, cascadeStats } satisfies ApiResponse);
  } catch (error: any) {
    if (error instanceof BudgetExceededError) {
      res.status(429).json({ success: false, error: error.message, cascadeStats: error.cascadeStats } satisfies ApiResponse);
      return;
    }
    if (error && error.cascadeStats) {
      res.status(500).json({ success: false, error: error.message || String(error), cascadeStats: error.cascadeStats } satisfies ApiResponse);
      return;
    }
    next(error);
  }
});

export default router;
