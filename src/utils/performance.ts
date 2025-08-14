// Performance utility functions

/**
 * Debounce function to limit the rate at which a function can fire
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function to limit the rate at which a function can fire
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Memoize function results to avoid unnecessary recalculations
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Batch multiple state updates to avoid unnecessary re-renders
 */
export function batchUpdate<T>(
  updater: (current: T) => T,
  delay: number = 0
): (current: T) => T {
  let timeout: NodeJS.Timeout;
  let pendingUpdate: ((current: T) => T) | null = null;
  
  return (current: T) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    pendingUpdate = updater;
    
    timeout = setTimeout(() => {
      if (pendingUpdate) {
        pendingUpdate(current);
        pendingUpdate = null;
      }
    }, delay);
    
    return current;
  };
}

/**
 * Measure performance of a function
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  func: T,
  name: string = 'Function'
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>) => {
    const start = performance.now();
    const result = func(...args);
    const end = performance.now();
    
    if (import.meta.env.DEV) {
      console.log(`${name} took ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  };
}

/**
 * Check if the browser supports performance optimizations
 */
export function supportsPerformanceOptimizations(): boolean {
  return (
    'requestIdleCallback' in window ||
    'requestAnimationFrame' in window ||
    'IntersectionObserver' in window
  );
}

/**
 * Schedule a function to run during idle time
 */
export function scheduleIdleTask(
  task: () => void,
  timeout: number = 1000
): void {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(task, { timeout });
  } else {
    setTimeout(task, timeout);
  }
}

/**
 * Schedule a function to run on the next animation frame
 */
export function scheduleAnimationFrame(task: () => void): void {
  if ('requestAnimationFrame' in window) {
    requestAnimationFrame(task);
  } else {
    setTimeout(task, 16); // ~60fps
  }
}
