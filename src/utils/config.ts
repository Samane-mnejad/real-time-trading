/**
 * Configuration utility for environment variables
 * Provides fallback values for development
 */

export const config = {
  // API Base URL - fallback to localhost for development
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  
  // WebSocket URL - fallback to localhost for development  
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  
  // Helper to get full API endpoint
  getApiEndpoint: (path: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  },
  
  // Helper to get WebSocket URL
  getWsUrl: (): string => {
    return process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
  }
}; 