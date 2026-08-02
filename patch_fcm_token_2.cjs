const fs = require('fs');

let code = fs.readFileSync('src/lib/firebase.ts', 'utf-8');
const target = `export const requestNotificationPermission = async () => {
  if (!messaging) {
    console.warn("Messaging not initialized.");
    return null;
  }
  
  // Detect if running in an iframe
  const inIframe = typeof window !== 'undefined' && window.self !== window.top;

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
        // Fallback for AI Studio preview environment
        if (inIframe || String(err).includes("messaging/unsupported-browser") || String(err).includes("messaging/failed-service-worker-registration") || String(err).includes("token-subscribe-failed")) {
          console.warn("Using mock token for preview environment.");
          return "mock_token_" + Math.random().toString(36).substr(2, 9);
        }
        return null;
      }
    } else {
      console.warn("Notification permission not granted. Status:", permission);
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
};`;

const replace = `export const requestNotificationPermission = async () => {
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
        // Fallback for AI Studio preview environment
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
};`;

if (code.includes(target)) {
  fs.writeFileSync('src/lib/firebase.ts', code.replace(target, replace));
  console.log('Patched requestNotificationPermission for real.');
} else {
  console.log('Target not found for requestNotificationPermission.');
}
