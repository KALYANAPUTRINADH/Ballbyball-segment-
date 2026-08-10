import React, { useState } from 'react';
import { Settings, Shield, Bell, HelpCircle, FileText, ChevronRight, X, Save, MapPin, BookOpen, Radio } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { TermsConsentModal } from '../components/TermsConsentModal';

import { Logo } from '../components/Logo';

export default function More({ setFullScreenView }: { setFullScreenView?: (view: string | null) => void }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  // Settings State
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [privateProfile, setPrivateProfile] = useState(false);

  const handleAction = (label: string) => {
    if (["App Settings", "Privacy & Security"].includes(label)) {
      setActiveModal(label);
    } else if (label === "Rules Handbook") {
      if (setFullScreenView) setFullScreenView("Rules Handbook");
    } else if (label === "Streaming Setup") {
      if (setFullScreenView) setFullScreenView("Streaming Setup");
    } else if (label === "OBS Live Stream") {
      if (setFullScreenView) setFullScreenView("OBS Live Stream");
    } else if (label === "About Us") {
      if (setFullScreenView) setFullScreenView("About Us");
      else window.location.href = "?page=about";
    } else if (label === "Help Center & FAQ" || label === "Help Center") {
      if (setFullScreenView) setFullScreenView("Help Center & FAQ");
      else window.location.href = "?page=help";
    } else if (label === "Payment & Refund Policy") {
      window.location.href = "?page=refund-policy";
    } else if (label === "Terms of Service") {
      window.location.href = "?page=terms";
    } else if (label === "Privacy Policy") {
      window.location.href = "?page=privacy";
    } else if (label === "Privacy & Cookies") {
      localStorage.removeItem('location_tracking_accepted');
      localStorage.removeItem('location_accepted');
      window.location.reload();
    } else {
      showToast(label + ' opened');
    }
  };

  const handleSave = () => {
    showToast('Settings saved successfully!');
    setActiveModal(null);
  };

  const sections = [
    {
      title: "Account & Settings",
      items: [
        { icon: <Settings className="w-5 h-5 text-slate-500" />, label: "App Settings" },
        { icon: <Shield className="w-5 h-5 text-slate-500" />, label: "Privacy & Security" },
        { icon: <Radio className="w-5 h-5 text-purple-600" />, label: "Streaming Setup" },
        { icon: <Radio className="w-5 h-5 text-red-600" />, label: "OBS Live Stream" },
      ]
    },
    {
      title: "Support & Legal",
      items: [
        { icon: <HelpCircle className="w-5 h-5 text-red-500" />, label: "About Us" },
        { icon: <BookOpen className="w-5 h-5 text-slate-500" />, label: "Rules Handbook" },
        { icon: <HelpCircle className="w-5 h-5 text-slate-500" />, label: "Help Center & FAQ" },
        { icon: <FileText className="w-5 h-5 text-slate-500" />, label: "Terms of Service" },
        { icon: <FileText className="w-5 h-5 text-slate-500" />, label: "Privacy Policy" },
        { icon: <FileText className="w-5 h-5 text-slate-500" />, label: "Payment & Refund Policy" },
        { icon: <MapPin className="w-5 h-5 text-slate-500" />, label: "Privacy & Cookies" },
      ]
    }
  ];

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 pb-20">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">More Options</h1>
      
      {sections.map((section, i) => (
        <div key={i} className="mb-6">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">{section.title}</h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {section.items.map((item, j) => (
              <div 
                key={j}
                onClick={() => handleAction(item.label)}
                className={`flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors ${j !== section.items.length - 1 ? 'border-b border-slate-100' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  {item.icon}
                  <span className="font-medium text-slate-800">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <div className="text-center pt-8 flex flex-col items-center">
        <Logo size={32} className="text-slate-400 mb-2 opacity-50" />
        <p className="text-xs text-slate-400 font-medium tracking-widest uppercase">Version 1.0.4</p>
      </div>

      <TermsConsentModal 
        isOpen={showTermsModal} 
        onAccept={() => setShowTermsModal(false)}
        onDecline={() => setShowTermsModal(false)}
      />

      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{activeModal}</h2>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-5">
              {activeModal === 'App Settings' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Display Name</label>
                  <input 
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                    placeholder="Your Name"
                  />
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Theme</label>
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]">
                      <option>System Default</option>
                      <option>Light</option>
                      <option>Dark</option>
                    </select>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Broadcast Scoreboard Theme</label>
                    <select 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                      defaultValue={localStorage.getItem('scoreboard_theme') || 'modern'}
                      onChange={(e) => localStorage.setItem('scoreboard_theme', e.target.value)}
                    >
                      <option value="modern">Modern Professional</option>
                      <option value="classic">Classic Broadcast</option>
                      <option value="minimalist">Minimalist Stream</option>
                      <option value="ipl">IPL Style</option>
                    </select>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Default Team A Logo URL (Optional)</label>
                    <input 
                      type="text"
                      defaultValue={localStorage.getItem('match_team_a_logo') || ''}
                      onChange={(e) => localStorage.setItem('match_team_a_logo', e.target.value)}
                      placeholder="https://example.com/logo-a.png"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Default Team B Logo URL (Optional)</label>
                    <input 
                      type="text"
                      defaultValue={localStorage.getItem('match_team_b_logo') || ''}
                      onChange={(e) => localStorage.setItem('match_team_b_logo', e.target.value)}
                      placeholder="https://example.com/logo-b.png"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                    />
                  </div>
                </div>
              )}



              {activeModal === 'Privacy & Security' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">Private Profile</div>
                      <div className="text-xs text-slate-500">Only friends can see your stats</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={privateProfile} onChange={() => setPrivateProfile(!privateProfile)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d11a2a]"></div>
                    </label>
                  </div>
                  <div className="pt-2">
                    <button onClick={() => showToast('Password reset email sent')} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      Change Password
                    </button>
                  </div>
                  <div className="pt-2">
                    <button onClick={() => showToast('Account deletion request initiated')} className="text-sm font-medium text-red-600 hover:text-red-800">
                      Delete Account
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-[#d11a2a] hover:bg-red-700 rounded-lg transition-colors flex items-center">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
