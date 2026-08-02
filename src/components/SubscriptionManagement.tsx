import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, Shield, X, AlertCircle, RefreshCw, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../lib/database';
import { ProUpgradeModal } from './ProUpgradeModal';
import { useToast } from './ToastContext';

export function SubscriptionManagement() {
  const { user, isPro } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await dbService.get('profiles', user.uid);
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to all Pro features immediately.')) return;
    
    try {
      setIsCancelling(true);
      // Revoke pro status and stop features immediately upon cancellation
      await dbService.update('profiles', user.uid, { 
        subscription_status: 'cancelled',
        is_pro: false,
        pro_expiration_date: null
      });
      
      showToast('Subscription cancelled. Pro features have been disabled.');
      // Refresh
      fetchProfile();
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      showToast('Error cancelling subscription', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-500 animate-pulse">Loading subscription details...</div>;
  }

  const expirationDate = profile?.pro_expiration_date ? new Date(profile.pro_expiration_date).toLocaleDateString() : 'N/A';
  const isCancelled = profile?.subscription_status === 'cancelled';

  const faqs = [
    {
      question: "What is included in the Streamlify Pro plan?",
      answer: "Pro unlocks our complete suite of premium cricket broadcasting tools: advanced AI match analytics, dynamic wagon-wheel overlays, customizable high-fidelity scoreboard themes for live streams, multi-camera broadcasting configurations, and prioritized high-bandwidth video rendering."
    },
    {
      question: "How do the ₹49/month and ₹399/year plans compare?",
      answer: "Both plans grant full, unrestricted access to all Pro features. The Monthly plan (₹49/mo) offers maximum flexibility, while the Yearly plan (₹399/yr) saves you over 30% annually (equal to roughly ₹33/mo) and guarantees non-stop access for the entire year."
    },
    {
      question: "Can I upgrade, downgrade, or cancel at any time?",
      answer: "Yes, absolutely! You have complete control. You can change your billing interval or cancel your subscription instantly using the controls in this panel. If you cancel, your subscription will end and your Pro features will stop immediately."
    },
    {
      question: "Is my payment information secure?",
      answer: "We take your security very seriously. All transactions are securely processed and encrypted through our integrated Stripe payment gateway. Your sensitive credit card numbers never touch or reside on our servers."
    },
    {
      question: "Are there any hidden costs or streaming limits?",
      answer: "No, there are no hidden fees. All cloud storage for match archives, stream hosting bandwidth, and analytical compute resources are fully covered under your selected flat-rate plan."
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-indigo-600" />
          Subscription & Billing
        </h2>
      </div>
      <div className="p-6 space-y-6">
        {/* Current Plan Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Plan</p>
            <div className="flex items-center">
              <span className={`text-2xl font-black ${isPro ? 'text-indigo-600' : 'text-slate-700'}`}>
                {isPro ? 'Pro Member' : 'Free Plan'}
              </span>
              {isPro && !isCancelled && (
                <span className="ml-3 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                  Active
                </span>
              )}
              {isCancelled && (
                <span className="ml-3 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-200">
                  Cancelled
                </span>
              )}
            </div>
            {isPro && (
              <p className="text-sm text-slate-600 mt-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1.5 text-slate-400" />
                Next billing date: <span className="font-semibold ml-1">{expirationDate}</span>
              </p>
            )}
            {!isPro && (
              <p className="text-sm text-slate-600 mt-2">
                {isCancelled 
                  ? "Your subscription was cancelled, and Pro access has been terminated. Upgrade again to restore all premium features." 
                  : "Upgrade to Pro to unlock advanced analytics, exclusive tournaments, and more."}
              </p>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            {!isPro ? (
              <button 
                onClick={() => setShowUpgradeModal(true)}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap"
              >
                Upgrade to Pro
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors whitespace-nowrap"
                >
                  Modify Plan
                </button>
                {!isCancelled && (
                  <button 
                    onClick={handleCancelSubscription}
                    disabled={isCancelling}
                    className="px-6 py-2.5 text-red-600 hover:bg-red-50 rounded-xl font-bold text-sm transition-colors whitespace-nowrap flex items-center justify-center"
                  >
                    {isCancelling ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : 'Cancel Subscription'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* FAQs Section */}
        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center">
            <HelpCircle className="w-4 h-4 mr-2 text-indigo-500" />
            Frequently Asked Questions
          </h3>
          <div className="space-y-3" id="subscription-faqs">
            {faqs.map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <div 
                  key={idx} 
                  className="border border-slate-100 rounded-xl overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left bg-slate-50/50 hover:bg-slate-50 transition-colors focus:outline-none"
                    aria-expanded={isExpanded}
                  >
                    <span className="font-semibold text-sm text-slate-800 pr-4">{faq.question}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-5 py-4 bg-white border-t border-slate-50 text-xs leading-relaxed text-slate-600">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Upgrade Modal Integration */}
      <ProUpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        featureName="Subscription Management" 
      />
    </div>
  );
}
