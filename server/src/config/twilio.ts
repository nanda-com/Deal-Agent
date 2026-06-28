import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

let twilioClient: ReturnType<typeof twilio> | null = null;

export function initTwilio() {
  if (twilioClient) return twilioClient;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in .env');
  }

  twilioClient = twilio(accountSid, authToken);
  console.log('[Twilio] SDK initialized');
  return twilioClient;
}

export function getTwilioClient() {
  if (!twilioClient) throw new Error('Twilio not initialized. Call initTwilio() first.');
  return twilioClient;
}

export function getTwilioPhoneNumber(): string {
  const phone = process.env.TWILIO_PHONE_NUMBER;
  if (!phone) throw new Error('TWILIO_PHONE_NUMBER not set in .env');
  return phone;
}
