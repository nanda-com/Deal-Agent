import { Router } from 'express';
import { getAnalyticsData } from '../services/dataService.js';
import { generateInsights } from '../services/gemini.js';
import type { ApiResponse } from '../types/index.js';

const router = Router();

/**
 * GET /api/analytics
 * Get comprehensive analytics data for the dashboard.
 */
router.get('/', async (req, res, next) => {
  try {
    const data = await getAnalyticsData();

    res.json({
      success: true,
      data,
    } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/message-volume
 * Get message volume by channel (last 7 days).
 */
router.get('/message-volume', async (req, res, next) => {
  try {
    const data = await getAnalyticsData();
    res.json({
      success: true,
      data: data.messageVolume,
    } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/lead-growth
 * Get lead growth week over week.
 */
router.get('/lead-growth', async (req, res, next) => {
  try {
    const data = await getAnalyticsData();
    res.json({
      success: true,
      data: data.leadGrowth,
    } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/channel-share
 * Get channel distribution data.
 */
router.get('/channel-share', async (req, res, next) => {
  try {
    const data = await getAnalyticsData();
    res.json({
      success: true,
      data: data.channelShare,
    } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/ai-activity
 * Get AI reply activity (24-hour breakdown).
 */
router.get('/ai-activity', async (req, res, next) => {
  try {
    const data = await getAnalyticsData();
    res.json({
      success: true,
      data: data.aiActivity,
    } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/insights
 * Get AI-generated insights from the analytics data.
 */
router.get('/insights', async (req, res, next) => {
  try {
    const data = await getAnalyticsData();
    const insights = await generateInsights(data as unknown as Record<string, unknown>);

    res.json({
      success: true,
      data: insights,
    } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/kpi
 * Get summary KPIs for the dashboard header.
 */
router.get('/kpi', async (req, res, next) => {
  try {
    const data = await getAnalyticsData();

    const kpis = [
      { label: 'Total Conversations', value: data.totalConversations.toLocaleString(), delta: '+18.2%' },
      { label: 'AI Replies Sent', value: data.totalMessages.toLocaleString(), delta: '+24.7%' },
      { label: 'Active Leads', value: data.totalLeads.toLocaleString(), delta: '+11.4%' },
      { label: 'Conversion Rate', value: `${data.conversionRate}%`, delta: `+${(data.conversionRate / 8).toFixed(1)}%` },
      { label: 'Avg Response Time', value: `${data.avgResponseTime}s`, delta: '−42%' },
      { label: 'AI Deflection', value: `${data.aiDeflectionRate}%`, delta: '+9.1%' },
    ];

    res.json({
      success: true,
      data: kpis,
    } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
