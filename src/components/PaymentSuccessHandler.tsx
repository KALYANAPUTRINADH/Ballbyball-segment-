import React, { useEffect } from 'react';
import { useToast } from './ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../lib/database';

export function PaymentSuccessHandler() {
  const { showToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isSuccessParam = urlParams.get('success') === 'true' || urlParams.get('payment') === 'success';
      const isSuccessPath = window.location.pathname === '/success';

      if (isSuccessParam || isSuccessPath) {
        showToast('Payment successful! Your Pro subscription is now active.');
        
        if (user) {
          const expiryDate = new Date();
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
          
          const rawAmount = urlParams.get('amount');
          const paidAmount = rawAmount ? parseFloat(rawAmount) : 2.99;
          
          dbService.update('profiles', user.uid, {
            is_pro: true,
            subscription_status: 'active',
            pro_expiration_date: expiryDate.toISOString()
          }).then(() => {
            return dbService.create('transactions', {
              user_id: user.uid,
              amount: paidAmount,
              currency: 'USD',
              status: 'completed',
              description: 'Streamlify Pro Subscription (Stripe)',
              created_at: new Date().toISOString()
            });
          }).catch(err => {
            console.warn('Failed to sync Pro status on payment return:', err);
          });
        }

        // Clean up URL parameters cleanly without page refresh
        const targetPath = window.location.pathname === '/success' ? '/' : window.location.pathname;
        window.history.replaceState({}, document.title, targetPath);
      }
    }
  }, [user, showToast]);

  return null;
}
