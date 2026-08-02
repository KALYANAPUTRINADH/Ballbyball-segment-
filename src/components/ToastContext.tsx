import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { X, Heart, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../lib/database';

interface ToastContextType {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<string | null>(null);
  const [liveStreamAlert, setLiveStreamAlert] = useState<any>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const showToast = useCallback((message: string) => {
    setToast(message);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  useEffect(() => {
    const handleFcmMessage = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.title) {
        showToast(`${customEvent.detail.title}: ${customEvent.detail.body}`);
      }
    };
    window.addEventListener('fcm-message', handleFcmMessage);
    // @ts-ignore
    window.showToast = showToast;
    return () => {
      window.removeEventListener('fcm-message', handleFcmMessage);
      // @ts-ignore
      delete window.showToast;
    };
  }, [showToast]);

  const handleNotifyLiveStream = useCallback((match: any) => {
    setLiveStreamAlert(match);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <PaymentSuccessHandler />
      <MatchLiveStreamNotifier onNotify={handleNotifyLiveStream} />
      
      {/* Simple standard toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-sm shadow-lg z-[100] transition-opacity duration-300 whitespace-nowrap">
          {toast}
        </div>
      )}

      {/* Gorgeous interactive live stream toast */}
      {liveStreamAlert && (
        <div className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 p-4 z-[150] animate-in fade-in slide-in-from-bottom-5 duration-300 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping shrink-0" />
              <span className="w-2 h-2 bg-red-600 rounded-full shrink-0 -ml-4" />
              <span className="text-[10px] font-black tracking-widest text-red-500 uppercase">LIVE STREAM STARTED</span>
            </div>
            <button 
              onClick={() => setLiveStreamAlert(null)}
              className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div>
            <h4 className="font-bold text-sm leading-tight text-slate-100 flex items-center">
              {liveStreamAlert.team_a || liveStreamAlert.teamA || 'Team A'} 
              <span className="text-slate-500 font-medium px-2 text-xs">vs</span> 
              {liveStreamAlert.team_b || liveStreamAlert.teamB || 'Team B'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 flex items-center">
              <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px] mr-2 uppercase font-semibold">
                {liveStreamAlert.sport_type || 'Cricket'}
              </span>
              {liveStreamAlert.location && (
                <span className="truncate">At {liveStreamAlert.location}</span>
              )}
            </p>
          </div>

          <div className="flex space-x-2 pt-1">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('watchLiveMatch', { detail: liveStreamAlert.id }));
                setLiveStreamAlert(null);
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-lg shadow-red-600/25"
            >
              <span>📺 Watch Live</span>
            </button>
            <button
              onClick={() => setLiveStreamAlert(null)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export function PaymentSuccessHandler() {
  const { showToast } = useToast();
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isSuccessParam = urlParams.get('success') === 'true';
      const isSuccessPath = window.location.pathname === '/success';

      if (isSuccessParam || isSuccessPath) {
        showToast('Payment successful! Your new features are now active.');
        window.history.replaceState({}, document.title, '/');
      }
    }
  }, [showToast]);
  return null;
}

export function MatchLiveStreamNotifier({ onNotify }: { onNotify: (match: any) => void }) {
  const { user, userPreferences } = useAuth();

  const prevMatchesRef = useRef<Record<string, any>>({});

  // Helper to send browser push notification
  const sendBrowserNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };

  const createDbNotification = async (title: string, body: string, type: 'match_start' | 'match_update', action_url?: string) => {
    if (!user) return;
    try {
      await dbService.create('notifications', {
        user_id: user.uid,
        title,
        body,
        type,
        is_read: false,
        created_at: new Date().toISOString(),
        ...(action_url ? { action_url } : {})
      });
    } catch (e) {
      console.warn("Failed to create db notification", e);
    }
  };

  useEffect(() => {
    if (!user) return;

    let notifiedIds: string[] = [];
    try {
      const stored = sessionStorage.getItem('notified_live_match_ids');
      if (stored) {
        notifiedIds = JSON.parse(stored);
      }
    } catch (e) {
      console.warn("sessionStorage read error", e);
    }

    let isFirstSnapshot = true;

    // Listen to live matches
    const unsubscribe = dbService.subscribe('matches', { is_live: true }, (liveMatches) => {
      const newPrevMatches: Record<string, any> = {};

      if (isFirstSnapshot) {
        // Register current live matches to ignore initial load spam
        liveMatches.forEach(m => {
          if (m.id && !notifiedIds.includes(m.id)) {
            notifiedIds.push(m.id);
          }
          if (m.id) {
            newPrevMatches[m.id] = m;
          }
        });
        try {
          sessionStorage.setItem('notified_live_match_ids', JSON.stringify(notifiedIds));
        } catch (e) {}
        prevMatchesRef.current = newPrevMatches;
        isFirstSnapshot = false;
        return;
      }

      const followedTeams = userPreferences?.followedTeams || [];
      const followedTournaments = userPreferences?.followedTournaments || [];

      liveMatches.forEach(match => {
        if (!match.id) return;
        newPrevMatches[match.id] = match;

        const teamAName = match.team_a || match.teamA || '';
        const teamBName = match.team_b || match.teamB || '';
        const tournamentName = match.tournamentName || match.tournament || '';

        const isFavoriteTeam = followedTeams.some((t: string) => 
          t.toLowerCase() === teamAName.toLowerCase() || 
          t.toLowerCase() === teamBName.toLowerCase()
        );

        const isFollowedTournament = followedTournaments.some((t: string) => 
          t.toLowerCase() === tournamentName.toLowerCase()
        );
        let alertedMatchIds: string[] = [];
        try {
          const storedAlerts = localStorage.getItem('match_alerts');
          if (storedAlerts) alertedMatchIds = JSON.parse(storedAlerts);
        } catch(e) {}
        const isAlertedMatch = alertedMatchIds.includes(match.id);

        if (isFavoriteTeam || isFollowedTournament || isAlertedMatch) {
          const prevMatch = prevMatchesRef.current[match.id];
          const matchTitle = `${teamAName} vs ${teamBName}`;
          const watchActionUrl = `watch_live_${match.id}`;
          
          if (!prevMatch && !notifiedIds.includes(match.id)) {
            // Trigger the beautiful interactive Toast card
            onNotify(match);
            sendBrowserNotification("🔴 Match Started!", matchTitle);
            createDbNotification("🔴 Match Started!", `Live coverage of ${matchTitle} has begun.`, 'match_start', watchActionUrl);

            // Deduplicate
            notifiedIds.push(match.id);
            try {
              sessionStorage.setItem('notified_live_match_ids', JSON.stringify(notifiedIds));
            } catch (e) {}
          } else if (prevMatch) {
            // Wicket Fallen
            const prevWickets = prevMatch.wickets || 0;
            const currentWickets = match.wickets || 0;
            if (currentWickets > prevWickets) {
              const outBatsman = match.striker || "A batsman";
              sendBrowserNotification("🏏 Wicket Fallen!", `${matchTitle}: ${outBatsman} is out! (${match.runs}/${currentWickets})`);
              createDbNotification("🏏 Wicket Fallen!", `${matchTitle}: ${outBatsman} is out! (${match.runs}/${currentWickets})`, 'match_update', watchActionUrl);
            }

            // Century Scored
            if (match.strikerStats && prevMatch.strikerStats) {
              const currentRuns = match.strikerStats.runs || 0;
              const prevRuns = prevMatch.strikerStats.runs || 0;
              if (currentRuns >= 100 && prevRuns < 100) {
                sendBrowserNotification("💯 Century Scored!", `${matchTitle}: ${match.striker} has scored a century! (${currentRuns} runs)`);
                createDbNotification("💯 Century Scored!", `${matchTitle}: ${match.striker} has scored a century! (${currentRuns} runs)`, 'match_update', watchActionUrl);
              }
            }
          }
        }
      });
      
      prevMatchesRef.current = newPrevMatches;
    });

    return () => {
      unsubscribe();
    };
  }, [user, userPreferences, onNotify]);

  return null;
}
