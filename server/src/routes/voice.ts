import { Router } from 'express';
import {
  generateInboundTwiml,
  generateOutboundTwiml,
  processSpeechResponse,
  makeOutboundCall,
} from '../services/twilio.js';
import { getCallLogs, createCallLog } from '../services/dataService.js';
import { generateSummary } from '../services/gemini.js';
import type { ApiResponse } from '../types/index.js';

// ─── Protected Management Routes (require auth) ───────────────────────────
const router = Router();

/**
 * GET /api/voice
 * Get recent call logs.
 */
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const logs = await getCallLogs(limit);

    res.json({
      success: true,
      data: logs,
    } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/voice/call
 * Initiate an outbound call (requires auth).
 */
router.post('/call', async (req, res, next) => {
  try {
    const { to, voiceProfileId } = req.body;

    if (!to) {
      res.status(400).json({
        success: false,
        error: 'Phone number (to) is required',
      } satisfies ApiResponse);
      return;
    }

    const webhookBase = `${req.protocol}://${req.get('host')}`;
    const result = await makeOutboundCall(to, webhookBase, voiceProfileId);

    res.json({
      success: true,
      data: result,
      message: 'Call initiated',
    } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/voice/log
 * Save a call log entry with optional AI-generated summary.
 */
router.post('/log', async (req, res, next) => {
  try {
    const { callerName, callerNumber, duration, outcome, recordingUrl, transcript, aiSummary, leadId } = req.body;

    // Auto-generate AI summary from transcript if not provided
    let finalSummary = aiSummary;
    if (!finalSummary && transcript) {
      try {
        const messages = transcript.split('\n').filter(Boolean).map((line: string) => {
          const colonIdx = line.indexOf(':');
          if (colonIdx > 0) {
            return { role: line.slice(0, colonIdx).trim().toLowerCase(), text: line.slice(colonIdx + 1).trim() };
          }
          return { role: 'user', text: line };
        });
        finalSummary = await generateSummary(messages);
      } catch {
        finalSummary = undefined;
      }
    }

    const log = await createCallLog({
      callerName: callerName ?? 'Unknown',
      callerNumber: callerNumber ?? '',
      duration: duration ?? 0,
      outcome: outcome ?? 'Completed',
      recordingUrl,
      transcript,
      aiSummary: finalSummary,
      leadId,
      timestamp: { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 },
    });

    res.status(201).json({
      success: true,
      data: log,
      message: 'Call log saved',
    } satisfies ApiResponse);
  } catch (error) {
    next(error);
  }
});

// ─── Public Twilio Webhooks (no auth — Twilio cannot pass Firebase tokens) ─
export const twilioWebhookRouter = Router();

/**
 * GET /api/voice-twilio/inbound
 * TwiML for inbound calls — AI assistant greeting.
 */
twilioWebhookRouter.get('/inbound', (_req, res) => {
  res.type('text/xml').send(generateInboundTwiml());
});

/**
 * POST /api/voice-twilio/inbound
 * TwiML for inbound calls (POST version).
 */
twilioWebhookRouter.post('/inbound', (_req, res) => {
  res.type('text/xml').send(generateInboundTwiml());
});

/**
 * GET /api/voice-twilio/outbound-twiml
 * TwiML for outbound calls.
 */
twilioWebhookRouter.get('/outbound-twiml', async (req, res, next) => {
  try {
    const voiceProfileId = typeof req.query.voiceProfileId === 'string' ? req.query.voiceProfileId : undefined;
    const xml = await generateOutboundTwiml(voiceProfileId);
    res.type('text/xml').send(xml);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/voice-twilio/process-speech
 * Process speech from caller via Twilio <Gather> with Gemini AI.
 */
twilioWebhookRouter.post('/process-speech', async (req, res, next) => {
  try {
    const speechResult = req.body.SpeechResult || req.body.speechResult || '';
    const transcript = speechResult.trim();

    if (!transcript) {
      const retryTwiMl = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="en-US-NovaNeural">I didn't hear anything. Please speak clearly after the beep.</Say>
  <Redirect>/api/voice-twilio/inbound</Redirect>
</Response>`;
      res.type('text/xml').send(retryTwiMl);
      return;
    }

    const twiml = await processSpeechResponse(transcript);
    res.type('text/xml').send(twiml);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/voice-twilio/status
 * Twilio call status callback — saves call log with AI summary on completion.
 */
twilioWebhookRouter.post('/status', async (req, res) => {
  try {
    const { CallSid, CallStatus, CallDuration, From, To, RecordingUrl, CallerName } = req.body;

    console.log(`[Twilio] Call ${CallSid}: ${CallStatus} (${CallDuration || 0}s)`);

    // Only save call log on final states (completed, busy, failed, no-answer)
    const isFinal = ['completed', 'busy', 'failed', 'no-answer'].includes(CallStatus);
    if (isFinal) {
      await createCallLog({
        callerName: CallerName || From || 'Unknown',
        callerNumber: From || '',
        duration: Number(CallDuration || 0),
        outcome: CallStatus || 'Completed',
        recordingUrl: RecordingUrl,
        transcript: undefined,
        aiSummary: undefined,
        timestamp: { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 },
      });
    }

    res.status(200).send('<Response/>');
  } catch (error) {
    console.error('[Twilio] Status callback error:', error);
    res.status(200).send('<Response/>');
  }
});

export default router;
