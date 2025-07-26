import OpenAI from 'openai';
import { supabase } from './supabase';

let openaiClient: OpenAI | null = null;

// Initialize OpenAI client with key from Supabase
const initializeOpenAI = async (): Promise<OpenAI | null> => {
  try {
    console.log('🔑 Fetching OpenAI API key from Supabase...');
    
    // Get the OpenAI API key from Supabase secrets or a settings table
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'OPENAI_API_KEY')
      .single();

    if (error) {
      console.error('❌ Error fetching OpenAI key from Supabase:', error);
      return null;
    }

    if (!data?.value) {
      console.warn('⚠️ OpenAI API key not found in Supabase settings');
      return null;
    }

    console.log('✅ OpenAI API key retrieved from Supabase');
    
    openaiClient = new OpenAI({
      apiKey: data.value,
      dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
    });

    console.log('🤖 OpenAI client initialized successfully');
    return openaiClient;

  } catch (error) {
    console.error('❌ Error initializing OpenAI client:', error);
    return null;
  }
};

// Get OpenAI client (initialize if needed)
export const getOpenAIClient = async (): Promise<OpenAI | null> => {
  if (openaiClient) {
    return openaiClient;
  }
  
  return await initializeOpenAI();
};

// Legacy export for backward compatibility
export const openai = null; // Will be replaced by getOpenAIClient()