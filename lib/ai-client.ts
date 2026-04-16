import OpenAI from 'openai';

let client: OpenAI | null = null;

export const AI_MODEL = process.env.AI_MODEL || 'claude-sonnet-4';

export function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      baseURL: process.env.AI_BASE_URL || 'http://localhost:3456/v1',
      apiKey: process.env.AI_API_KEY || 'not-needed',
    });
  }
  return client;
}
