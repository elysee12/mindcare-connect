/**
 * Centralized Backend Configuration
 * 
 * This is the SINGLE SOURCE OF TRUTH for the backend URL.
 * All other parts of the app read from this configuration.
 * 
 * HOW TO UPDATE:
 * When your IP changes, update ONLY the .env.local file:
 * EXPO_PUBLIC_BACKEND_URL=http://YOUR_NEW_IP:3000
 * 
 * Then restart: npx expo start --clear
 */

import Constants from 'expo-constants';

/**
 * Get backend URL from environment
 * Priority: .env.local > app.json > hardcoded fallback
 */
export function getBackendUrl(): string {
  // Try EXPO_PUBLIC_BACKEND_URL from .env.local first (highest priority)
  let url = process.env.EXPO_PUBLIC_BACKEND_URL;
  
  // Fallback to app.json extra config
  if (!url) {
    url = Constants.expoConfig?.extra?.BACKEND_URL;
  }
  
  // Last resort fallback (should never happen in dev)
  if (!url) {
    console.warn('⚠️  No BACKEND_URL configured! Using default.');
    url = 'http://192.168.0.105:3000';
  }
  
  // Ensure URL has protocol
  if (url && !url.startsWith('http')) {
    url = `http://${url}`;
  }
  
  return url;
}

/**
 * Get the full API base URL (with /api suffix)
 */
export function getApiUrl(): string {
  return `${getBackendUrl()}/api`;
}

/**
 * Get the uploads URL for accessing uploaded files
 */
export function getUploadsUrl(): string {
  return `${getBackendUrl()}/uploads`;
}

/**
 * Current backend configuration
 */
export const BackendConfig = {
  /** Base backend URL (without /api) */
  baseUrl: getBackendUrl(),
  
  /** Full API URL (with /api) */
  apiUrl: getApiUrl(),
  
  /** Uploads URL for files */
  uploadsUrl: getUploadsUrl(),
  
  /** Check if using local backend */
  isLocal: () => {
    const url = getBackendUrl();
    return url.includes('localhost') || 
           url.includes('127.0.0.1') || 
           url.includes('192.168.') || 
           url.includes('10.');
  },
  
  /** Check if using production backend */
  isProduction: () => {
    const url = getBackendUrl();
    return url.includes('onrender.com') || 
           url.includes('herokuapp.com') ||
           url.startsWith('https://');
  },
};

// Log current configuration in development
if (__DEV__) {
  console.log('📡 Backend Configuration:');
  console.log('   Base URL:', BackendConfig.baseUrl);
  console.log('   API URL:', BackendConfig.apiUrl);
  console.log('   Uploads URL:', BackendConfig.uploadsUrl);
  console.log('   Is Local:', BackendConfig.isLocal());
  console.log('   Is Production:', BackendConfig.isProduction());
}

export default BackendConfig;
