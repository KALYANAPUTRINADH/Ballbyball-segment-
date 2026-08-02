import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Check, X } from 'lucide-react';

export function CookieConsent() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      const accepted = localStorage.getItem('location_tracking_accepted');
      if (!accepted) {
        setShow(true);
      }
    } else {
      setShow(false);
    }
  }, [user]);

  if (!show) return null;

  const handleAccept = () => {
    localStorage.setItem('location_tracking_accepted', 'true');
    setShow(false);
    
    // Simulate location tracking API call
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Location tracked:", position.coords);
        },
        (error) => {
          console.warn("Location tracking error:", error.message || error);
        }
      );
    }
  };

  const handleDecline = () => {
    localStorage.setItem('location_tracking_accepted', 'false');
    setShow(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-[100] flex justify-center pointer-events-none">
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700 pointer-events-auto relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#d11a2a] opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="flex items-start space-x-4 relative z-10">
          <div className="bg-[#d11a2a]/20 p-3 rounded-full shrink-0">
            <MapPin className="w-6 h-6 text-[#d11a2a]" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Location Services</h3>
            <p className="text-slate-300 text-sm mb-4 leading-relaxed">
              We use location tracking cookies to show you matches, players, and tournaments near your city. 
              Do you allow Streamlify to track your location?
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={handleAccept}
                className="flex-1 bg-[#d11a2a] hover:bg-red-700 text-white py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center justify-center space-x-2 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Allow</span>
              </button>
              <button 
                onClick={handleDecline}
                className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center justify-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Decline</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
