import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, Trash2, Calendar, TrendingUp, Sparkles, AlertCircle, X, ChevronRight, Play } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../lib/database';
import { useToast } from './ToastContext';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'subscription_renewal' | 'analytics_ready' | 'system' | 'match_start' | 'match_update';
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

interface NotificationCenterProps {
  setFullScreenView: (view: string | null) => void;
}

export function NotificationCenter({ setFullScreenView }: NotificationCenterProps) {
  const { user, isPro } = useAuth();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications and profile
  useEffect(() => {
    if (!user?.uid) return;

    // Fetch user profile to read pro_expiration_date
    dbService.get('profiles', user.uid).then((data) => {
      setProfile(data);
    });

    // Subscribe to notifications
    const unsubscribe = dbService.subscribe(
      'notifications',
      { user_id: user.uid },
      (data) => {
        // Sort notifications by created_at descending
        const sorted = (data as Notification[]).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setNotifications(sorted);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Check and auto-generate expiration alert if approaching renewal
  useEffect(() => {
    if (!user?.uid || !isPro || !profile?.pro_expiration_date) return;

    const expiryDate = new Date(profile.pro_expiration_date);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // If subscription is expiring within 7 days, generate notification if it doesn't already exist
    if (diffDays > 0 && diffDays <= 7) {
      const alreadyHasAlert = notifications.some(
        (n) => n.type === 'subscription_renewal' && !n.is_read
      );

      if (!alreadyHasAlert) {
        dbService.create('notifications', {
          user_id: user.uid,
          title: 'Subscription Approaching Renewal',
          body: `Your Pro subscription renewal is approaching in ${diffDays} ${diffDays === 1 ? 'day' : 'days'} (${expiryDate.toLocaleDateString()}). Keep your pro tools active!`,
          type: 'subscription_renewal',
          is_read: false,
          created_at: new Date().toISOString(),
          action_url: 'Profile'
        }).then(() => {
          showToast('Alert: Pro Subscription Approaching Renewal');
        }).catch((err) => {
          console.error('Failed to create auto subscription alert:', err);
        });
      }
    }
  }, [user, isPro, profile, notifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await dbService.update('notifications', id, { is_read: true });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.is_read);
      await Promise.all(
        unread.map((n) => dbService.update('notifications', n.id, { is_read: true }))
      );
      showToast('All notifications marked as read.');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      await Promise.all(
        notifications.map((n) => dbService.remove('notifications', n.id))
      );
      showToast('All notifications cleared.');
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    await handleMarkAsRead(notif.id);
    setIsOpen(false);
    if (notif.action_url) {
      if (notif.action_url.startsWith('watch_live_')) {
        const matchId = notif.action_url.replace('watch_live_', '');
        window.dispatchEvent(new CustomEvent('watchLiveMatch', { detail: matchId }));
      } else {
        setFullScreenView(notif.action_url);
      }
    }
  };

  // Developer / Demo Simulator functions
  const handleSimulateSubscriptionRenewal = async () => {
    if (!user?.uid) {
      showToast('Please login first to simulate.');
      return;
    }
    try {
      const mockExpiry = new Date();
      mockExpiry.setDate(mockExpiry.getDate() + 2); // Expiration in 2 days

      await dbService.create('notifications', {
        user_id: user.uid,
        title: '⚠️ Pro Plan Approaching Renewal',
        body: `Your Streamlify Pro Plan will renew on ${mockExpiry.toLocaleDateString()} (in 2 days). Enjoy uninterrupted advanced match statistics and live scoring features.`,
        type: 'subscription_renewal',
        is_read: false,
        created_at: new Date().toISOString(),
        action_url: 'Profile'
      });
      showToast('Simulated renewal reminder generated!');
    } catch (err) {
      showToast('Simulation failed', 'error');
    }
  };

  const handleSimulateAnalyticsReady = async () => {
    if (!user?.uid) {
      showToast('Please login first to simulate.');
      return;
    }
    try {
      await dbService.create('notifications', {
        user_id: user.uid,
        title: '📊 New Advanced Analytics Ready!',
        body: 'Great news! Your latest tournament match data has been analyzed. Deep neural performance insights and wagon-wheel overlays are now available in your Pro Dashboard.',
        type: 'analytics_ready',
        is_read: false,
        created_at: new Date().toISOString(),
        action_url: 'Pro Dashboard'
      });
      showToast('Simulated analytics notification generated!');
    } catch (err) {
      showToast('Simulation failed', 'error');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 md:bg-gray-100 md:hover:bg-gray-200 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        aria-label="Notifications"
        id="notification-bell-btn"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-bounce text-indigo-600' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-[110] overflow-hidden flex flex-col max-h-[500px]"
            id="notification-dropdown-panel"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                    title="Mark all as read"
                  >
                    <Check className="w-3.5 h-3.5" /> Read All
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1"
                    title="Clear all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[300px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <Bell className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="font-semibold text-sm text-slate-600">No Notifications</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                    We will notify you here when subscription alerts or analytics updates arrive.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const isRenewal = notif.type === 'subscription_renewal';
                  const isAnalytics = notif.type === 'analytics_ready';
                  const isMatchStart = notif.type === 'match_start';
                  const isMatchUpdate = notif.type === 'match_update';
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative flex gap-3 ${
                        !notif.is_read ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      {/* Left Side Icon based on type */}
                      <div className="shrink-0 mt-0.5">
                        {isRenewal ? (
                          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                            <Calendar className="w-4 h-4" />
                          </div>
                        ) : isAnalytics ? (
                          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                        ) : isMatchStart ? (
                          <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                            <Play className="w-4 h-4" />
                          </div>
                        ) : isMatchUpdate ? (
                          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                            <Sparkles className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`font-bold text-xs truncate ${
                              !notif.is_read ? 'text-slate-900 font-black' : 'text-slate-600'
                            }`}
                          >
                            {notif.title}
                          </span>
                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {notif.body}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-2 block font-mono">
                          {new Date(notif.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* Side Action Arrow / Button */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
                        {notif.action_url && (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Developer Live Action Simulator (Demo Assistant) */}
            <div className="border-t border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 px-1">
                Demo Action Simulator
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSimulateSubscriptionRenewal}
                  className="px-2 py-1.5 bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-200 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                >
                  <Calendar className="w-3 h-3 text-amber-500" /> Expiry Alert
                </button>
                <button
                  onClick={handleSimulateAnalyticsReady}
                  className="px-2 py-1.5 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 border border-slate-200 hover:border-indigo-200 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                >
                  <TrendingUp className="w-3 h-3 text-indigo-500" /> Analytics Alert
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
