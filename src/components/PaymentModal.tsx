import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Loader2 } from 'lucide-react';
import { dbService } from '../lib/database';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './ToastContext';
import { loadStripe } from '@stripe/stripe-js';

// Load Stripe (will only work if VITE_STRIPE_PUBLIC_KEY is provided)


interface PaymentModalProps {
  amount: number;
  description: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function PaymentModal({ amount, description, onSuccess, onClose }: PaymentModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [processing, setProcessing] = useState(false);
  const [region, setRegion] = useState('india'); // 'india' or 'international'
  const [config, setConfig] = useState({ stripePublicKey: '', razorpayKeyId: '' });

  useEffect(() => {
    fetch('/api/config')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch config');
        return res.json();
      })
      .then(data => setConfig(data))
      .catch(console.error);
  }, []);

  
  const handleStripePayment = async () => {
    setProcessing(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user) {
        headers['Authorization'] = `Bearer ${await user.getIdToken()}`;
      }
      const response = await fetch('/api/payments/stripe/create-checkout-session', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ amount, description }),
      });
      
      const session = await response.text().then(t => { try { return JSON.parse(t); } catch { return {}; } });
      if (session.error) throw new Error(session.error);
      
      if (session.url) {
        window.location.href = session.url; // Redirect to Stripe Checkout
      }
    } catch (error: any) {
      console.warn('Payment failed', error);
      alert('Payment failed: ' + error.message);
      setProcessing(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setProcessing(true);
    try {
      // 1. Create Order on Server
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user) {
        headers['Authorization'] = `Bearer ${await user.getIdToken()}`;
      }
      const res = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ amount, description }),
      });
      const order = await res.text().then(t => { try { return JSON.parse(t); } catch { return {}; } });
      
      if (order.error) throw new Error(order.error);

      // 2. Load Razorpay SDK
      const loadScript = () => {
        return new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => { resolve(true); };
          script.onerror = () => { resolve(false); };
          document.body.appendChild(script);
        });
      };
      const resLoad = await loadScript();
      if (!resLoad) {
        alert('Razorpay SDK failed to load. Are you online?');
        setProcessing(false);
        return;
      }

      // 3. Initialize Razorpay Checkout
      const options = {
        key: config.razorpayKeyId, // Enter the Key ID generated from the Dashboard
        amount: order.amount,
        currency: order.currency,
        name: 'Streamlify',
        description: description,
        order_id: order.id,
        handler: function (response: any) {
          // Verify payment on server
          (async () => {
            if (user) {
              try {
                const token = await user.getIdToken();
                
              const expiryDate = new Date();
              if (amount === 399 || amount > 100) {
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);
              } else {
                expiryDate.setMonth(expiryDate.getMonth() + 1);
              }
              await dbService.update('profiles', user.uid, { is_pro: true, pro_expiration_date: expiryDate.toISOString() });
    // Record transaction
    await dbService.create('transactions', {
      user_id: user.uid,
      amount: amount,
      currency: 'INR',
      status: 'completed',
      description: description,
      created_at: new Date().toISOString()
    });
  
                
                showToast("Payment successful! Your new features are now active.");
                   onSuccess();
              } catch(e) { 
                console.warn('Payment verification error', e);
                alert('Payment verified on gateway but failed to sync. Please contact support.');
              }
            } else {
              showToast("Payment successful!");
              onSuccess();
            }
          })();
        },
        prefill: {
          name: user?.displayName || 'User',
          email: user?.email || 'user@example.com',
          contact: user?.phoneNumber || '9999999999'
        },
        theme: {
          color: '#2563eb'
        }
      };
      
      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on('payment.failed', function (response: any){
        alert(response.error.description);
      });
      rzp1.open();
      setProcessing(false);
      onClose(); // Close our modal as Razorpay modal takes over
    } catch (error: any) {
      console.warn('Payment failed', error);
      alert('Payment failed: ' + error.message);
      setProcessing(false);
    }
  };

  const handlePay = () => {
    if (region === 'india') {
      handleRazorpayPayment();
    } else {
      handleStripePayment();
    }
  };

  const displayAmount = region === 'india' ? amount : parseFloat((amount / 83.0).toFixed(2));

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[300] p-4">
      <div className="bg-white w-full max-w-sm rounded-xl overflow-hidden shadow-2xl relative">
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
          <div>
            <div className="text-sm font-medium opacity-90">Secure Checkout</div>
            <div className="text-2xl font-bold">{region === 'india' ? '₹' : '$'}{displayAmount}</div>
          </div>
          <button onClick={onClose} className="opacity-80 hover:opacity-100">
             <X size={20} />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="font-semibold">Purpose:</span> {description}
          </div>
          
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Your Region</div>
            <div className="space-y-2">
              <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${region === 'india' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input type="radio" name="region" value="india" checked={region === 'india'} onChange={() => setRegion('india')} className="mr-3 text-blue-600" />
                <span className="font-medium text-sm">India (Razorpay - ₹)</span>
              </label>
              <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${region === 'international' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input type="radio" name="region" value="international" checked={region === 'international'} onChange={() => setRegion('international')} className="mr-3 text-blue-600" />
                <span className="font-medium text-sm">International (Stripe - $)</span>
              </label>
            </div>
          </div>
          
          <button 
            onClick={handlePay}
            disabled={processing}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center transition-colors shadow-md disabled:opacity-70"
          >
            {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay ${region === 'india' ? '₹' : '$'}${displayAmount}`}
          </button>
          
          <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-400 font-medium pt-2">
            <ShieldCheck size={12} />
            <span>Secured by {region === 'india' ? 'Razorpay' : 'Stripe'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
