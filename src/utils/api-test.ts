// This file demonstrates how the 401 handling works
// You can run this in the browser console to test

import { apiRequestJson } from './api';
import { config } from './config';

// Example function to test 401 handling
export const testApiError = async () => {
  try {
    // This will fail with 401 if no valid token
    await apiRequestJson(config.getApiEndpoint('/api/historical/TSLA'));
    console.log('✅ API call successful');
  } catch (error) {
    console.log('❌ API call failed:', error);
    console.log('🔄 User should be automatically logged out');
  }
};

// Call this function in the browser console:
// testApiError(); 