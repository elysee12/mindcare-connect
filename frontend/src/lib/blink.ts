let blinkClient: any = null;

export function getBlinkClient() {
  if (blinkClient) {
    return blinkClient;
  }

  try {
    const { createClient, AsyncStorageAdapter } = require('@blinkdotnew/sdk');
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const WebBrowser = require('expo-web-browser');

    blinkClient = createClient({
      projectId: process.env.EXPO_PUBLIC_BLINK_PROJECT_ID || 'mindcare-dashboard-ui-3bsa0xzw',
      authRequired: false,
      auth: { mode: 'headless', webBrowser: WebBrowser },
      storage: new AsyncStorageAdapter(AsyncStorage),
    });
  } catch (error) {
    console.warn('[blink] Unable to initialize client', error);
    return null;
  }

  return blinkClient;
}
