import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

console.log('🔑 OpenAI API Key status:', apiKey ? 'Present' : 'Missing');

const openai = apiKey ? new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
}) : null;

console.log('🤖 OpenAI client status:', openai ? 'Initialized' : 'Not initialized');

export { openai };