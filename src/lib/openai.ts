import OpenAI from 'openai';
import { supabase } from './supabase';

let openaiClient: OpenAI | null = null;
let apiKeyCache: string | null = null;

// Initialize OpenAI client with key from Supabase
const initializeOpenAI = async (): Promise<OpenAI | null> => {
  try {
    console.log('🔑 Fetching OpenAI API key from Supabase...');
    
    // Get the OpenAI API key from Supabase app_settings table
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'OPENAI_API_KEY')
      .single();

    if (error) {
      console.error('❌ Error fetching OpenAI key from Supabase:', error);
      console.log('💡 Make sure you have added your OpenAI API key to the app_settings table');
      return null;
    }

    if (!data?.value || data.value === 'your-openai-api-key-here') {
      console.warn('⚠️ OpenAI API key not properly configured in Supabase');
      console.log('💡 Please update the OPENAI_API_KEY value in your app_settings table');
      return null;
    }

    // Cache the API key
    apiKeyCache = data.value;
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
  console.log('🔍 Getting OpenAI client...');
  
  if (openaiClient && apiKeyCache) {
    console.log('✅ Using cached OpenAI client');
    return openaiClient;
  }
  
  console.log('🔄 Initializing new OpenAI client...');
  return await initializeOpenAI();
};

// Check if OpenAI is properly configured
export const isOpenAIConfigured = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'OPENAI_API_KEY')
      .single();

    return !error && data?.value && data.value !== 'your-openai-api-key-here';
  } catch {
    return false;
  }
};

// Update OpenAI API key in Supabase
export const updateOpenAIKey = async (apiKey: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'OPENAI_API_KEY', value: apiKey });

    if (error) {
      console.error('❌ Error updating OpenAI key:', error);
      return false;
    }

    // Reset client to force re-initialization
    openaiClient = null;
    apiKeyCache = null;
    
    console.log('✅ OpenAI API key updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error updating OpenAI key:', error);
    return false;
  }
};