import React, { useState } from 'react';
import { ShieldCheck, Check, X, FileText, ChevronRight } from 'lucide-react';
import { Logo } from './Logo';

interface TermsConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function TermsConsentModal({ isOpen, onAccept, onDecline }: TermsConsentModalProps) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<'terms' | 'privacy' | null>(null);

  if (!isOpen) return null;

  const allAccepted = acceptedTerms && acceptedPrivacy;

  if (viewingDocument === 'terms') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">Terms of Service</h2>
            <button onClick={() => setViewingDocument(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
          </div>
          <div className="overflow-y-auto flex-1 pr-2 text-sm text-slate-600 space-y-4">
            <p><strong>1. Acceptance of Terms</strong><br/>By accessing or using our application, you agree to be bound by these Terms of Service. If you do not agree, you may not access the service.</p>
            <p><strong>2. User Accounts</strong><br/>You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.</p>
            <p><strong>3. Content</strong><br/>Our service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. You are responsible for the content that you post.</p>
            <p><strong>4. Termination</strong><br/>We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
            <p><strong>5. Governing Law</strong><br/>These Terms shall be governed and construed in accordance with the laws of your jurisdiction, without regard to its conflict of law provisions.</p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button onClick={() => { setAcceptedTerms(true); setViewingDocument(null); }} className="w-full bg-[#d11a2a] text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors">I Accept Terms of Service</button>
          </div>
        </div>
      </div>
    );
  }

  if (viewingDocument === 'privacy') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">Privacy Policy</h2>
            <button onClick={() => setViewingDocument(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
          </div>
          <div className="overflow-y-auto flex-1 pr-2 text-sm text-slate-600 space-y-4">
            <p><strong>1. Information Collection</strong><br/>We collect information to provide better services to all our users. This includes basic account info, as well as usage data, location tracking (if consented), and device information.</p>
            <p><strong>2. How We Use Information</strong><br/>We use the information we collect to provide, maintain, protect and improve our services, to develop new ones, and to protect our users.</p>
            <p><strong>3. Information Sharing</strong><br/>We do not share personal information with companies, organizations and individuals outside of our service unless explicit consent is provided or for legal reasons.</p>
            <p><strong>4. Data Security</strong><br/>We work hard to protect our users from unauthorized access to or unauthorized alteration, disclosure or destruction of information we hold.</p>
            <p><strong>5. Data Deletion Policy</strong><br/>You have the right to request the deletion of your personal data. You can delete your account and associated data directly from the application settings, or by contacting our support team. Upon deletion, your data will be permanently removed from our active systems and backups within a reasonable timeframe, subject to legal obligations.</p>
            <p><strong>6. Changes</strong><br/>Our Privacy Policy may change from time to time. We will post any privacy policy changes on this page.</p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button onClick={() => { setAcceptedPrivacy(true); setViewingDocument(null); }} className="w-full bg-[#d11a2a] text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors">I Accept Privacy Policy</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
        <div className="flex justify-center mb-6">
          <Logo size={48} className="text-slate-900" />
        </div>
        
        <h2 className="text-xl font-bold text-slate-900 text-center mb-2">Terms & Privacy</h2>
        <p className="text-sm text-slate-500 text-center mb-6">
          Before logging into the application, you must review and accept our Terms of Service and Privacy Policy.
        </p>

        <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
          
          <div className="flex flex-col space-y-2">
            <label className="flex items-start space-x-3 cursor-pointer group">
              <div className="flex items-center h-5 mt-1">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-4 h-4 text-[#d11a2a] bg-white border-gray-300 rounded focus:ring-[#d11a2a] focus:ring-2"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-[#d11a2a] mr-1.5" />
                    <h4 className="text-sm font-bold text-slate-800">Terms of Service</h4>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">I have read and agree to the Terms of Service.</p>
              </div>
            </label>
            <button onClick={() => setViewingDocument('terms')} className="text-xs text-blue-600 font-semibold hover:underline text-left ml-7">View Terms of Service</button>
          </div>

          <div className="flex flex-col space-y-2 pt-2 border-t border-slate-200">
            <label className="flex items-start space-x-3 cursor-pointer group">
              <div className="flex items-center h-5 mt-1">
                <input
                  type="checkbox"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="w-4 h-4 text-[#d11a2a] bg-white border-gray-300 rounded focus:ring-[#d11a2a] focus:ring-2"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ShieldCheck className="w-4 h-4 text-[#d11a2a] mr-1.5" />
                    <h4 className="text-sm font-bold text-slate-800">Privacy Policy</h4>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">I acknowledge and agree to the Privacy Policy.</p>
              </div>
            </label>
            <button onClick={() => setViewingDocument('privacy')} className="text-xs text-blue-600 font-semibold hover:underline text-left ml-7">View Privacy Policy</button>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onAccept}
            disabled={!allAccepted}
            className={`w-full flex items-center justify-center space-x-2 py-3 rounded-xl font-bold transition-colors shadow-sm active:scale-95 ${allAccepted ? 'bg-[#d11a2a] hover:bg-red-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >
            <Check className="w-5 h-5" />
            <span>Accept & Login</span>
          </button>
          
          <button
            onClick={onDecline}
            className="w-full flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl font-bold transition-colors active:scale-95"
          >
            <X className="w-5 h-5" />
            <span>Decline</span>
          </button>
        </div>
      </div>
    </div>
  );
}
