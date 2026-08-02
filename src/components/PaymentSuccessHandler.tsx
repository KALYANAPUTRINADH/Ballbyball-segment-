import React, { useEffect } from 'react';
import { useToast } from './ToastContext';

export function PaymentSuccessHandler() {
  const { showToast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isSuccessParam = urlParams.get('success') === 'true';
      const isSuccessPath = window.location.pathname === '/success';

      if (isSuccessParam || isSuccessPath) {
        showToast('Payment successful! Your new features are now active.');
        // Clean up URL
        window.history.replaceState({}, document.title, '/');
      }
    }
  }, [showToast]);

  return null;
}
