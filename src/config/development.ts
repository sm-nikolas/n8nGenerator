// Development environment configuration
export const developmentConfig = {
  // Performance optimizations
  fastRefresh: true,
  hmr: true,
  overlay: false,
  
  // Debug settings
  debug: true,
  logLevel: 'debug',
  
  // Development features
  enableProfiler: true,
  enableStrictMode: true,
  
  // API settings
  apiTimeout: 10000,
  retryAttempts: 3,
  
  // UI settings
  enableAnimations: true,
  enableTransitions: true,
  
  // Workflow settings
  maxWorkflows: 100,
  maxNodes: 50,
  maxConnections: 100,
};
