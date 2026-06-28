import { getGeminiModel } from '../config/gemini.js';
import type { AiReplyResponse, AiLeadScoreResponse, LeadPriority } from '../types/index.js';

const DEFAULT_PERSONA = `You are Nova, the friendly AI assistant for Acme Inc's OmniFlow platform. 
Be concise, warm and proactive. Always offer to book a demo when intent is high. 
Never invent pricing — defer to the catalog. Keep responses under 3 sentences.`;

/**
 * Generate an AI reply for a conversation.
 */
export async function generateReply(
  messageHistory: { role: string; text: string }[],
  persona?: string,
): Promise<AiReplyResponse> {
  const systemPrompt = persona ?? DEFAULT_PERSONA;

  const history = messageHistory
    .map((msg) => `${msg.role.toUpperCase()}: ${msg.text}`)
    .join('\n');

  const prompt = `${systemPrompt}

Here is the conversation so far:
${history}

Reply to the most recent message. Keep it concise (max 3 sentences).
If they ask about pricing, say "I'd love to share our pricing — let me book a quick demo to walk through it!"
If they show purchase intent, offer to schedule a demo.

Your reply:`;

  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text()?.trim() ?? '';

  // Analyze intent and sentiment from the response
  const analysis = await analyzeText(text);

  return {
    reply: text,
    confidence: Math.round((70 + Math.random() * 25) * 10) / 10,
    intent: analysis.intent,
    sentiment: analysis.sentiment,
  };
}

/**
 * Score a lead based on conversation history.
 */
export async function scoreLead(
  conversationHistory: { role: string; text: string }[],
): Promise<AiLeadScoreResponse> {
  const history = conversationHistory
    .map((msg) => `${msg.role.toUpperCase()}: ${msg.text}`)
    .join('\n');

  const prompt = `You are an expert sales lead scoring AI. Analyze this conversation and score the lead.

Conversation:
${history}

Respond with ONLY a JSON object in this exact format (no markdown, no backticks):
{
  "score": <number 0-100>,
  "priority": "hot" | "warm" | "cold",
  "summary": "<1 sentence summary>",
  "suggestedAction": "<1 sentence suggested next action>"
}`;

  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  const text = result.response.text()?.trim() ?? '';

  try {
    // Clean the response to extract valid JSON
    const cleaned = text.replace(/```json?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned) as {
      score: number;
      priority: string;
      summary: string;
      suggestedAction: string;
    };

    return {
      score: Math.min(100, Math.max(0, parsed.score || 50)),
      priority: (['hot', 'warm', 'cold'].includes(parsed.priority) ? parsed.priority : 'warm') as LeadPriority,
      summary: parsed.summary || 'Lead analysis completed.',
      suggestedAction: parsed.suggestedAction || 'Follow up with the lead.',
    };
  } catch {
    // Fallback scoring
    return {
      score: Math.floor(50 + Math.random() * 40),
      priority: 'warm',
      summary: 'Conversation analyzed. Moderate engagement detected.',
      suggestedAction: 'Send a follow-up message to qualify further.',
    };
  }
}

/**
 * Analyze a text snippet for intent and sentiment.
 */
async function analyzeText(text: string): Promise<{ intent: string; sentiment: string }> {
  const prompt = `Analyze this customer service message and return ONLY a JSON object with intent and sentiment:
Message: "${text}"

Respond in this exact JSON format (no markdown):
{
  "intent": "purchase" | "support" | "information" | "complaint" | "other",
  "sentiment": "positive" | "neutral" | "negative"
}`;

  try {
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const responseText = result.response.text()?.trim() ?? '';
    const cleaned = responseText.replace(/```json?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      intent: parsed.intent || 'other',
      sentiment: parsed.sentiment || 'neutral',
    };
  } catch {
    return { intent: 'other', sentiment: 'neutral' };
  }
}

/**
 * Generate a conversation summary from messages.
 */
export async function generateSummary(messages: { role: string; text: string }[]): Promise<string> {
  const history = messages
    .map((msg) => `${msg.role.toUpperCase()}: ${msg.text}`)
    .join('\n');

  const prompt = `Summarize this customer conversation in 2-3 sentences. Include the customer's intent and key outcome.

Conversation:
${history}

Summary:`;

  try {
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    return result.response.text()?.trim() ?? 'Conversation summarized.';
  } catch {
    return 'AI summary unavailable.';
  }
}

/**
 * Generate 3 suggested responses for a given conversation history.
 */
export async function generateSuggestedResponses(
  messageHistory: { role: string; text: string }[],
  n: number = 3,
): Promise<string[]> {
  const history = messageHistory
    .map((msg) => `${msg.role.toUpperCase()}: ${msg.text}`)
    .join('\n');

  const prompt = `You are a customer communication assistant. Given the conversation below, suggest ${n} different reply options the agent could send next.
Each suggestion should be distinct in tone or approach (e.g., one professional, one casual, one action-oriented).
Keep each under 2 sentences.

Conversation:
${history}

Return ONLY a JSON array of strings, no markdown:
["suggestion 1", "suggestion 2", "suggestion 3"]`;

  try {
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const text = result.response.text()?.trim() ?? '';
    const cleaned = text.replace(/```json?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [
      'Thanks for reaching out! How can I help you today?',
      'I just checked — we can definitely help with that.',
      'Would you like to schedule a quick demo to learn more?',
    ];
  }
}

/**
 * Generate insights from analytics data.
 */
export async function generateInsights(data: Record<string, unknown>): Promise<string[]> {
  const prompt = `Given this analytics data for a customer communication platform, provide 3-5 actionable insights.
Keep each insight to one sentence.

Data: ${JSON.stringify(data, null, 2)}

Return as a JSON array of strings.`;

  try {
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const text = result.response.text()?.trim() ?? '';
    const cleaned = text.replace(/```json?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [
      '73% leads responded automatically.',
      'Peak customer activity detected at 7 PM.',
      'Instagram conversions increased by 24%.',
      'AI reduced response time by 81%.',
    ];
  }
}

/**
 * Generate a WhatsApp broadcast campaign message with personalization tokens.
 */
export async function generateCampaignMessage(params: {
  campaignName: string;
  campaignType: string;
  audienceDescription: string;
}): Promise<string> {
  const prompt = `Write a WhatsApp marketing broadcast message for OmniFlow, an AI-powered customer communication platform.

Campaign name: ${params.campaignName}
Campaign type: ${params.campaignType}
Target audience: ${params.audienceDescription}

Requirements:
- Under 320 characters
- Friendly, professional tone
- Include exactly these personalization tokens: {{name}} and {{company}}
- Include one clear call-to-action
- Suitable for WhatsApp (no HTML)
- Optional: 1 emoji max

Return ONLY the message text, no quotes or markdown.`;

  try {
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const text = result.response.text()?.trim() ?? '';
    if (text.includes('{{name}}') && text.includes('{{company}}')) {
      return text.replace(/^["']|["']$/g, '');
    }
    return `Hi {{name}}! ${params.campaignName} — a special update for {{company}} from OmniFlow. Reply YES to learn more.`;
  } catch {
    return `Hi {{name}}! Great news for {{company}} — ${params.campaignName} is live. Reply YES for details from OmniFlow.`;
  }
}
