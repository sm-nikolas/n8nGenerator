// Configuração de variáveis de ambiente
export const ENV_CONFIG = {
  // Supabase (Obrigatório)
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  
  // Google OAuth (Opcional - para funcionalidades adicionais)
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
  
  // Aplicação
  APP_NAME: import.meta.env.VITE_APP_NAME || 'N8N Flow AI',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  APP_ENVIRONMENT: import.meta.env.VITE_APP_ENVIRONMENT || 'development',
  
  // URLs
  APP_URL: import.meta.env.VITE_APP_URL || window.location.origin,
  API_URL: import.meta.env.VITE_API_URL || '',
};

// Verificar configuração mínima necessária
export function validateEnvironment() {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];
  
  const missingVars = requiredVars.filter(
    varName => !import.meta.env[varName]
  );
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    console.error('Please check your .env.local file');
    return false;
  }
  
  console.log('✅ Environment configuration validated');
  return true;
}

// Configuração para desenvolvimento
export const DEV_CONFIG = {
  enableLogs: ENV_CONFIG.APP_ENVIRONMENT === 'development',
  enableDebug: ENV_CONFIG.APP_ENVIRONMENT === 'development',
  enableProfiler: ENV_CONFIG.APP_ENVIRONMENT === 'development',
};

// Configuração para produção
export const PROD_CONFIG = {
  enableLogs: false,
  enableDebug: false,
  enableProfiler: false,
};

// Configuração ativa baseada no ambiente
export const ACTIVE_CONFIG = ENV_CONFIG.APP_ENVIRONMENT === 'production' ? PROD_CONFIG : DEV_CONFIG;
