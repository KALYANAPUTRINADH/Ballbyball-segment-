import React, { useState, useEffect } from 'react';
import { MapPin, Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function LocationConsentModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      const acceptedLocation = localStorage.getItem('location_accepted');
      if (!acceptedLocation) {
        setIsOpen(true);
      }
    }
  }, [user]);

  if (!isOpen) return null;

  const handleAccept = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setRequesting(true);
      setErrorMsg(null);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Successfully obtained location coordinates
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: position.timestamp
          };
          localStorage.setItem('location_accepted', 'true');
          localStorage.setItem('user_coordinates', JSON.stringify(coords));
          setRequesting(false);
          setIsOpen(false);
        },
        (error) => {
          console.warn('Geolocation permission error:', error);
          let customErr = 'Failed to access location. But we will still optimize your feed.';
          if (error.code === error.PERMISSION_DENIED) {
            customErr = 'Location permission was denied. You can enable it in your browser settings.';
          }
          setErrorMsg(customErr);
          setRequesting(false);
          // Still save acceptance choice to avoid endless popups, even if permission denied
          localStorage.setItem('location_accepted', 'false');
          setTimeout(() => {
            setIsOpen(false);
          }, 2500);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 3600000 }
      );
    } else {
      localStorage.setItem('location_accepted', 'true');
      setIsOpen(false);
    }
  };

  const handleDecline = () => {
    localStorage.setItem('location_accepted', 'false');
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
        <div className="flex justify-center mb-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${requesting ? 'bg-indigo-100' : 'bg-emerald-100'}`}>
            {requesting ? (
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            ) : (
              <MapPin className="w-8 h-8 text-emerald-600" />
            )}
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-slate-900 text-center mb-2">
          {requesting ? 'Requesting Permission...' : 'Enable Location Services'}
        </h2>
        <p className="text-sm text-slate-500 text-center mb-4">
          {requesting 
            ? 'Please grant the browser prompt permission to fetch matching cricket action nearby.'
            : 'We use your location to show relevant local matches, tournament hubs, and community profiles near you.'
          }
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl text-center">
            <p className="text-xs text-amber-700 font-medium">{errorMsg}</p>
          </div>
        )}

        {!requesting && (
          <div className="space-y-3">
            <button
              onClick={handleAccept}
              className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-colors shadow-sm active:scale-95"
            >
              <Check className="w-5 h-5" />
              <span>Allow Location</span>
            </button>
            
            <button
              onClick={handleDecline}
              className="w-full flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl font-bold transition-colors active:scale-95"
            >
              <X className="w-5 h-5" />
              <span>Not Now</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
