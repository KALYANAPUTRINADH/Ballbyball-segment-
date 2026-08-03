import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ToastContext';

// Global Fetch Interceptor for CSRF Token Protection
const originalFetch = window.fetch;
let csrfTokenPromise: Promise<string> | null = null;

async function fetchCsrfToken(): Promise<string> {
  try {
    const res = await originalFetch('/api/csrf-token');
    if (res.ok) {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        return data.csrfToken;
      }
    }
  } catch (e) {
    console.warn('CSRF token not available on startup:', e);
  }
  return '';
}

const customFetch = async function (input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url);
  // Ensure it's an API request (relative or absolute on the same host)
  const isApi = url.startsWith('/api/') || url.startsWith('api/') || url.includes('/api/');
  const isGet = !init || !init.method || init.method.toUpperCase() === 'GET';

  if (isApi && !isGet) {
    if (!csrfTokenPromise) {
      csrfTokenPromise = fetchCsrfToken();
    }
    const token = await csrfTokenPromise;
    if (token) {
      init = init || {};
      const headers = new Headers(init.headers || {});
      headers.set('X-CSRF-Token', token);
      init.headers = headers;
    }
  }

  let response = await originalFetch(input, init);

  // If we receive a CSRF mismatch error, clear the cache, fetch a fresh token, and retry once
  if (isApi && !isGet && response.status === 403) {
    try {
      const bodyClone = response.clone();
      const contentType = response.headers.get('content-type') || '';
      let shouldRetry = false;
      if (contentType.includes('application/json')) {
        const errData = await bodyClone.json().catch(() => ({}));
        if (errData && errData.error === 'CSRF token mismatch or invalid token') {
          shouldRetry = true;
        }
      } else {
        // If the server returned HTML (e.g. standard Express error page), assume it's a CSRF error/crash
        shouldRetry = true;
      }

      if (shouldRetry) {
        csrfTokenPromise = fetchCsrfToken();
        const newToken = await csrfTokenPromise;
        if (newToken) {
          init = init || {};
          const headers = new Headers(init.headers || {});
          headers.set('X-CSRF-Token', newToken);
          init.headers = headers;
          response = await originalFetch(input, init);
        }
      }
    } catch (e) {
      console.error('Error during CSRF token refresh/retry:', e);
    }
  }

  return response;
};

try {
  Object.defineProperty(window, 'fetch', {
    value: customFetch,
    configurable: true,
    writable: true,
    enumerable: true
  });
} catch (e) {
  console.warn('Failed to define fetch with defineProperty, falling back to direct assignment:', e);
  try {
    (window as any).fetch = customFetch;
  } catch (err) {
    console.error('Failed to override window.fetch entirely:', err);
  }
}


// Override alert to use our custom toast notification system if available
const originalAlert = window.alert;
window.alert = (msg) => {
  if (typeof window !== 'undefined' && (window as any).showToast) {
    (window as any).showToast(msg);
  } else {
    originalAlert(msg);
  }
};

const init = async () => {
  // Proactively fetch CSRF token on startup
  csrfTokenPromise = fetchCsrfToken();

  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const config = await res.json();
      (window as any).__CONFIG__ = config;
    } else {
      (window as any).__CONFIG__ = {};
    }
  } catch (error) {
    console.warn('Using default system configuration:', error);
    (window as any).__CONFIG__ = {};
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </StrictMode>,
  );
};

init();


