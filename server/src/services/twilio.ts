import { getTwilioClient, getTwilioPhoneNumber } from '../config/twilio.js';
import { getVoiceProfileById } from './dataService.js';
import type { CallLog } from '../types/index.js';

/**
 * Initiate an outbound call via Twilio.
 */
export async function makeOutboundCall(
  to: string,
  webhookBaseUrl: string,
  voiceProfileId?: string,
): Promise<{ callSid: string }> {
  const twilioClient = getTwilioClient();
  const from = getTwilioPhoneNumber();

  // Pass voiceProfileId to Twilio via the initial request URL so the webhook can render appropriate TwiML
  const twimlUrl = voiceProfileId
    ? `${webhookBaseUrl}/api/voice-twilio/outbound-twiml?voiceProfileId=${encodeURIComponent(voiceProfileId)}`
    : `${webhookBaseUrl}/api/voice-twilio/outbound-twiml`;

  const call = await twilioClient.calls.create({
    to,
    from,
    url: twimlUrl,
    statusCallback: `${webhookBaseUrl}/api/voice/twilio/status`,
    statusCallbackEvent: ['completed', 'answered', 'busy', 'failed', 'no-answer'],
    statusCallbackMethod: 'POST',
  });

  console.log(`[Twilio] Outbound call initiated: SID=${call.sid}`);
  return { callSid: call.sid };
}

/**
 * Generate TwiML for an AI-powered inbound call flow.
 */
export function generateInboundTwiml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="en-US-NovaNeural">
    Hello! You've reached OmniFlow AI assistant. I'm here to help you with product information, scheduling, and support.
  </Say>
  <Gather input="speech" timeout="5" speechTimeout="auto" action="/api/voice-twilio/process-speech" method="POST">
    <Say voice="en-US-NovaNeural">
      How can I help you today? You can ask about pricing, book a demo, or get support.
    </Say>
  </Gather>
  <Say voice="en-US-NovaNeural">I didn't catch that. Please try again.</Say>
  <Redirect>/api/voice-twilio/inbound</Redirect>
</Response>`;
}

/**
 * Generate TwiML for an outbound call with AI greeting.
 */
export async function generateOutboundTwiml(voiceProfileId?: string): Promise<string> {
  // If a voice profile is provided and has a sampleUrl, play it first.
  if (voiceProfileId) {
    try {
      const profile = await getVoiceProfileById(voiceProfileId);
      const sampleUrl = profile?.sampleUrl;
      if (sampleUrl) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${escapeXml(sampleUrl)}</Play>
  <Gather input="speech" timeout="5" speechTimeout="auto" action="/api/voice-twilio/process-speech" method="POST">
    <Say voice="en-US-NovaNeural">Please let me know how I can help you today.</Say>
  </Gather>
  <Say voice="en-US-NovaNeural">I didn't catch that. I'll have a team member follow up with you instead. Thank you!</Say>
</Response>`;
      }
    } catch (err) {
      console.warn('[Twilio] generateOutboundTwiml: failed to load voice profile', err);
    }
  }

  // Fallback to default phrase
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="en-US-NovaNeural">
    Hi! This is Nova, your AI assistant from OmniFlow. I'm calling because we noticed you were interested in our platform and wanted to see if you have any questions.
  </Say>
  <Gather input="speech" timeout="5" speechTimeout="auto" action="/api/voice-twilio/process-speech" method="POST">
    <Say voice="en-US-NovaNeural">Please let me know how I can help you today.</Say>
  </Gather>
  <Say voice="en-US-NovaNeural">I didn't catch that. I'll have a team member follow up with you instead. Thank you!</Say>
</Response>`;
}

/**
 * Process speech input using Gemini AI and return appropriate TwiML response.
 * Falls back to keyword matching if Gemini is unavailable.
 */
export async function processSpeechResponse(transcript: string): Promise<string> {
  // Try Gemini first for a smarter response
  let responseText: string | null = null;

  try {
    const { generateReply } = await import('../services/gemini.js');
    const result = await generateReply([
      { role: 'user', text: transcript },
    ]);
    responseText = result.reply;
  } catch {
    // Gemini unavailable — fall back to keyword matching
  }

  if (!responseText) {
    const lower = transcript.toLowerCase();

    if (lower.includes('price') || lower.includes('pricing') || lower.includes('cost') || lower.includes('plan')) {
      responseText =
        "Great question! I'd love to walk you through our pricing. We have Starter, Pro, and Enterprise plans starting at $29 per user per month. Would you like me to book a short demo to go over the details?";
    } else if (lower.includes('demo') || lower.includes('walkthrough') || lower.includes('book')) {
      responseText =
        "Absolutely! I can schedule a demo for you. I'll have our sales team reach out to confirm a time. Is there a specific day that works best for you?";
    } else if (lower.includes('support') || lower.includes('help') || lower.includes('issue')) {
      responseText =
        "I'm sorry you're having trouble. Let me transfer you to our support team who can assist further. Please hold while I connect you.";
    } else if (lower.includes('interest') || lower.includes('product') || lower.includes('feature')) {
      responseText =
        "We'd love to show you what OmniFlow can do! Our platform unifies WhatsApp, Instagram, LinkedIn, Web Chat, and AI Voice into one inbox. Would you like to see a quick demo?";
    } else {
      responseText =
        `Thanks for reaching out! Let me make a note of your question about "${transcript}" and have a team member follow up with more information.`;
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="en-US-NovaNeural">${escapeXml(responseText)}</Say>
  <Gather input="speech" timeout="5" speechTimeout="auto" action="/api/voice/twilio/process-speech" method="POST">
    <Say voice="en-US-NovaNeural">Is there anything else I can help you with?</Say>
  </Gather>
  <Say voice="en-US-NovaNeural">Thank you for calling OmniFlow. Have a great day!</Say>
</Response>`;
}

/**
 * Minimal XML escaping for TwiML safety.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
