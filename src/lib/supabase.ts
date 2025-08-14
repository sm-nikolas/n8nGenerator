import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import { ENV_CONFIG, validateEnvironment } from '../config/environment';

// Validar configuração de ambiente
validateEnvironment();

const supabaseUrl = ENV_CONFIG.SUPABASE_URL;
const supabaseAnonKey = ENV_CONFIG.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Log de configuração em desenvolvimento
if (ENV_CONFIG.APP_ENVIRONMENT === 'development') {
  console.log('🔧 Supabase client configured with:', {
    url: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    environment: ENV_CONFIG.APP_ENVIRONMENT,
  });
}