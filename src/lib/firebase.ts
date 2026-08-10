import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

let firebaseConfig: any = null;

try {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('firebase_config_cache');
    if (cached) {
      firebaseConfig = JSON.parse(cached);
    }
  }
} catch (e) {
  console.warn('Failed to parse cached firebase config', e);
}

try {
  const response = await fetch('/api/firebase-config');
  if (response.ok) {
    firebaseConfig = await response.json();
    if (typeof window !== 'undefined') {
      localStorage.setItem('firebase_config_cache', JSON.stringify(firebaseConfig));
    }
  } else {
    console.warn('Server returned non-ok status for firebase-config:', response.status);
  }
} catch (e) {
  console.error('Failed to fetch firebase config from server, using cache/fallback', e);
}

if (!firebaseConfig) {
  firebaseConfig = {
    projectId: "videostream-ifyw6",
    appId: "1:614311110958:web:3a00608809aa88b48332bf",
    apiKey: "AIzaSyCchjhQ0LdB1wlA95NgW3iVK6NDIOm846M",
    authDomain: "videostream-ifyw6.firebaseapp.com",
    firestoreDatabaseId: "ai-studio-cricketdeliverys-32a88b9d-2ebb-4791-88d9-8ef469d638bf",
    storageBucket: "videostream-ifyw6.firebasestorage.app",
    messagingSenderId: "614311110958",
    measurementId: "",
    oAuthClientId: "614311110958-nt8utqvmndd14r9f4oenr4lhlrs077j3.apps.googleusercontent.com",
    recaptchaSiteKey: ""
  };
}

export const app = initializeApp(firebaseConfig);
// @ts-ignore
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, firebaseConfig.firestoreDatabaseId || '(default)');

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export const auth = getAuth(app);
export const storage = getStorage(app);

let messagingInstance: any = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messagingInstance = getMessaging(app);
  } catch (e) {
    console.error('Failed to initialize messaging', e);
  }
}
export const messaging = messagingInstance;

export const requestNotificationPermission = async () => {
  // Detect if running in an iframe
  const inIframe = typeof window !== 'undefined' && window.self !== window.top;

  if (!messaging) {
    console.warn("Messaging not initialized.");
    if (inIframe) {
      console.warn("Using mock token because iframe blocked notifications.");
      return "mock_token_" + Math.random().toString(36).substr(2, 9);
    }
    return null;
  }
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      try {
        const token = await getToken(messaging, {
          vapidKey: 'BJwT2Hn-eS34D5eN1aM-Y2G3aNf-t5q0xW_w0dI-Uq8N09H8N3N9g4v-k2f3p6I_n4n5p9x-V2n3w1f5t1H3e3q' 
        });
        return token;
      } catch (err) {
        console.error('getToken failed:', err);
        // Fallback for embedded preview environment
        if (inIframe || String(err).includes("messaging/unsupported-browser") || String(err).includes("messaging/failed-service-worker-registration") || String(err).includes("token-subscribe-failed")) {
          console.warn("Using mock token for preview environment.");
          return "mock_token_" + Math.random().toString(36).substr(2, 9);
        }
        return null;
      }
    } else {
      console.warn("Notification permission not granted. Status:", permission);
      if (inIframe) {
        console.warn("Using mock token because iframe blocked notifications.");
        return "mock_token_" + Math.random().toString(36).substr(2, 9);
      }
    }
  } catch (e) {
    console.error('An error occurred while requesting permission. ', e);
    // If we're in an iframe, Notification.requestPermission() might throw
    if (inIframe) {
      console.warn("Using mock token because iframe blocked notifications.");
      return "mock_token_" + Math.random().toString(36).substr(2, 9);
    }
  }
  return null;
};
