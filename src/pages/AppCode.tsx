import React, { useState } from 'react';
import { QrCode, Copy, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AppCode() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const appCode = user?.uid ? user.uid.substring(0, 8).toUpperCase() : 'GUESTXYZ';

  const handleCopy = () => {
    navigator.clipboard.writeText(appCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-sm border border-slate-200 text-center mt-8">
      <div className="w-16 h-16 bg-[#d11a2a]/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <QrCode className="w-8 h-8 text-[#d11a2a]" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Your App Code</h2>
      <p className="text-slate-600 mb-8 text-sm">Share this code with friends to connect and form teams easily.</p>
      
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-6">
        <span className="text-4xl font-mono font-bold tracking-widest text-slate-900">{appCode}</span>
      </div>

      <button 
        onClick={handleCopy}
        className="w-full flex items-center justify-center space-x-2 bg-[#d11a2a] hover:bg-red-700 text-white py-3 rounded-lg font-bold transition-colors shadow-md active:scale-95"
      >
        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
        <span>{copied ? 'Copied to Clipboard' : 'Copy App Code'}</span>
      </button>
    </div>
  );
}
