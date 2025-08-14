import { developmentConfig } from './development';
import { productionConfig } from './production';

// Determine environment
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Export appropriate configuration
export const config = isDevelopment ? developmentConfig : productionConfig;

// Environment variables
export const env = {
  isDevelopment,
  isProduction,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

// Performance constants
export const PERFORMANCE = {
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100,
  ANIMATION_DURATION: 200,
  TRANSITION_DURATION: 150,
  LOADING_TIMEOUT: 5000,
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
};

// UI constants
export const UI = {
  SIDEBAR_WIDTH: 320,
  HEADER_HEIGHT: 56,
  NODE_WIDTH: 192,
  NODE_HEIGHT: 64,
  GRID_SIZE: 10,
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 2,
  ZOOM_STEP: 0.2,
};

// Validation constants
export const VALIDATION = {
  MAX_WORKFLOW_NAME_LENGTH: 100,
  MAX_WORKFLOW_DESCRIPTION_LENGTH: 500,
  MAX_NODE_NAME_LENGTH: 50,
  MAX_PARAMETER_KEY_LENGTH: 50,
  MAX_PARAMETER_VALUE_LENGTH: 1000,
};
