// Configuração de autenticação
export const AUTH_CONFIG = {
  // Configurações do Google OAuth
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
    redirectUri: `${window.location.origin}/auth/callback`,
    scopes: [
      'openid',
      'profile',
      'email',
    ],
  },
  
  // Configurações do Supabase
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    authOptions: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  },
  
  // Configurações de sessão
  session: {
    refreshThreshold: 60 * 60 * 1000, // 1 hora
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
  },
  
  // Configurações de perfil do usuário
  profile: {
    defaultAvatar: '/default-avatar.png',
    maxAvatarSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
};

// Verificar se as variáveis de ambiente estão configuradas
export function validateAuthConfig() {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];
  
  const missingVars = requiredVars.filter(
    varName => !import.meta.env[varName]
  );
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    return false;
  }
  
  return true;
}

// URLs de autenticação
export const AUTH_URLS = {
  signIn: '/auth/signin',
  signUp: '/auth/signup',
  callback: '/auth/callback',
  signOut: '/auth/signout',
  profile: '/auth/profile',
};

// Tipos de provedor de autenticação
export const AUTH_PROVIDERS = {
  GOOGLE: 'google',
  GITHUB: 'github',
  DISCORD: 'discord',
} as const;

export type AuthProvider = typeof AUTH_PROVIDERS[keyof typeof AUTH_PROVIDERS];

// Estados de autenticação
export const AUTH_STATES = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  ERROR: 'error',
} as const;

export type AuthState = typeof AUTH_STATES[keyof typeof AUTH_STATES];
