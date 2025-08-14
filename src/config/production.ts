// Production environment configuration
export const productionConfig = {
  // Performance optimizations
  fastRefresh: false,
  hmr: false,
  overlay: false,
  
  // Debug settings
  debug: false,
  logLevel: 'error',
  
  // Development features
  enableProfiler: false,
  enableStrictMode: false,
  
  // API settings
  apiTimeout: 30000,
  retryAttempts: 5,
  
  // UI settings
  enableAnimations: true,
  enableTransitions: true,
  
  // Workflow settings
  maxWorkflows: 1000,
  maxNodes: 200,
  maxConnections: 500,
};
