import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

let genAI: GoogleGenerativeAI | null = null;

export function initGemini() {
  if (genAI) return genAI;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not set in .env');
  }

  genAI = new GoogleGenerativeAI(apiKey);
  console.log('[Gemini] AI SDK initialized');
  return genAI;
}

export function getGeminiClient() {
  if (!genAI) throw new Error('Gemini not initialized. Call initGemini() first.');
  return genAI;
}

export function getGeminiModel(modelName = 'gemini-2.0-flash') {
  const client = getGeminiClient();
  return client.getGenerativeModel({ model: modelName });
}
