import { Trophy, Activity, Medal, Star, Flame, Award } from 'lucide-react';

const StatBadges = ({ stats, sport }: { stats: any, sport: string }) => {
  if (!stats) return null;
  const badges = [];
  
  if (sport === 'Cricket') {
    if ((stats.runs || 0) >= 1000) badges.push({ icon: <Flame className="w-4 h-4 text-orange-500" />, label: 'Run Machine', bg: 'bg-orange-50', text: 'text-orange-700' });
    if ((stats.highestScore || stats.highest_score || 0) >= 100) badges.push({ icon: <Star className="w-4 h-4 text-amber-500" />, label: 'Centurion', bg: 'bg-amber-50', text: 'text-amber-700' });
    if ((stats.highestScore || stats.highest_score || 0) >= 50 && (stats.highestScore || stats.highest_score || 0) < 100) badges.push({ icon: <Star className="w-4 h-4 text-amber-500" />, label: 'Half-Centurion', bg: 'bg-amber-50', text: 'text-amber-700' });
    if ((stats.wickets || 0) >= 50) badges.push({ icon: <Activity className="w-4 h-4 text-rose-500" />, label: 'Golden Arm', bg: 'bg-rose-50', text: 'text-rose-700' });
  } else if (sport === 'Football' || sport === 'Hockey') {
    if ((stats.goals || 0) >= 50) badges.push({ icon: <Flame className="w-4 h-4 text-orange-500" />, label: 'Top Scorer', bg: 'bg-orange-50', text: 'text-orange-700' });
    if ((stats.assists || 0) >= 30) badges.push({ icon: <Award className="w-4 h-4 text-blue-500" />, label: 'Playmaker', bg: 'bg-blue-50', text: 'text-blue-700' });
    if ((stats.cleanSheets || 0) >= 20) badges.push({ icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />, label: 'The Wall', bg: 'bg-emerald-50', text: 'text-emerald-700' });
  } else if (sport === 'Basketball') {
    if ((stats.points || 0) >= 500) badges.push({ icon: <Flame className="w-4 h-4 text-orange-500" />, label: 'Scoring Machine', bg: 'bg-orange-50', text: 'text-orange-700' });
    if ((stats.assists || 0) >= 100) badges.push({ icon: <Award className="w-4 h-4 text-blue-500" />, label: 'Floor General', bg: 'bg-blue-50', text: 'text-blue-700' });
    if ((stats.rebounds || 0) >= 200) badges.push({ icon: <Activity className="w-4 h-4 text-emerald-500" />, label: 'Board Crasher', bg: 'bg-emerald-50', text: 'text-emerald-700' });
  } else if (sport === 'Tennis' || sport === 'Badminton' || sport === 'Pickleball' || sport === 'Table Tennis') {
    if ((stats.matches || 0) >= 50) badges.push({ icon: <Star className="w-4 h-4 text-amber-500" />, label: 'Veteran', bg: 'bg-amber-50', text: 'text-amber-700' });
    if ((stats.wins || 0) >= 25) badges.push({ icon: <Trophy className="w-4 h-4 text-yellow-500" />, label: 'Champion', bg: 'bg-yellow-50', text: 'text-yellow-700' });
  }

  if (badges.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Career Achievements</h3>
      <div className="flex flex-wrap gap-2">
        {badges.map((badge, idx) => (
          <div key={idx} className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full ${badge.bg} ${badge.text} text-xs font-bold shadow-sm`}>
            {badge.icon}
            <span>{badge.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, LogOut, Phone, ShieldCheck, Loader2, User as UserIcon, FileText, ChevronRight, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ProBadge } from '../components/ProBadge';
import { CountryCodeSelect } from '../components/CountryCodeSelect';
import { TermsConsentModal } from '../components/TermsConsentModal';
import { SubscriptionManagement } from '../components/SubscriptionManagement';
import { requestNotificationPermission } from '../lib/firebase';
// Removed supabase import
import { dbService } from '../lib/database';
import { X, CreditCard, Receipt, Fingerprint } from 'lucide-react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';


import { Logo } from '../components/Logo';

const Profile = ({ setFullScreenView }: { setFullScreenView?: (view: string | null) => void }) => {
  const { user, logOut, signInWithPhone, verifyOtp, isPro, mockPhoneLogin } = useAuth();
  
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [dbUser, setDbUser] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('Batsman');
  const [editDob, setEditDob] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [statsSport, setStatsSport] = useState('Cricket');
  const [savingEdit, setSavingEdit] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingLoginAction, setPendingLoginAction] = useState<(() => void) | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(true);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  // Removed passkey methods

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      try {
        // Fallback to client-side fetch if backend fails
        const data = await dbService.getAll('transactions', { user_id: user.uid });
        setTransactions(data);
      } catch (e) {
        console.warn('Error fetching transactions', e);
      } finally {
        setLoadingTransactions(false);
      }
    };
    fetchTransactions();
  }, [user]);

  useEffect(() => {
    const fetchDbUser = async () => {
      if (!user) return;
      try {
        const data = await dbService.get('profiles', user.uid);
        if (data) setDbUser(data);
      } catch(e) {
        console.warn('Error fetching user profile', e);
      }
    };
    const fetchStats = async () => {
      if (!user) return;
      try {
        const data = await dbService.get('performance_stats', user.uid || 'guest');
        if (data) {
          setStats(data);
        } else {
          setStats({
            matches: 0,
            runs: 0,
            wickets: 0,
            highest_score: 0,
            best_bowling: '-',
            average: 0,
            strike_rate: 0,
            economy: 0
          });
        }
      } catch (err: any) {
        if (err.message && err.message.includes('offline')) { /* ignore */ } else { console.warn('Error fetching stats:', err); }
      } finally {
        setLoadingStats(false);
      }
    };
    if (user) { fetchStats(); fetchDbUser(); }
  }, [user]);

  
  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingEdit(true);
    try {
      // Sync profiles table via API first (handles name and phone and server-side checks)
      const token = await user.getIdToken();
      
      await dbService.upsert('profiles', {
        id: user.uid,
        full_name: editName,
        phone: user.phoneNumber || ''
      });


      // Then update additional fields directly (or via API fallback inside dbService)
      await dbService.update('profiles', user.uid, {
        full_name: editName,
        username: editName,
        cricket_role: editRole,
        date_of_birth: editDob,
        is_public: editIsPublic,
        updated_at: new Date().toISOString()
      });

      setDbUser(prev => ({ 
        ...prev, 
        full_name: editName, 
        username: editName, 
        cricket_role: editRole,
        date_of_birth: editDob,
        is_public: editIsPublic,
        phone: user.phoneNumber, 
        email: user.email 
      }));
      setIsEditModalOpen(false);
    } catch(err) {
      console.error('Error saving profile:', err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!user) return;
    if (window.confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
      setSavingEdit(true);
      try {
        const token = await user.getIdToken();
        
        try { await dbService.remove('profiles', user.uid); } catch(e) { console.warn('Direct profile removal failed:', e); }
        try { await dbService.remove('performance_stats', user.uid); } catch(e) { console.warn('Direct stats removal failed:', e); }
        try { await dbService.remove('player_stats', user.uid); } catch(e) { console.warn('Direct player stats removal failed:', e); }
        try { await dbService.remove('community_profiles', user.uid); } catch(e) { console.warn('Direct community profile removal failed:', e); }
        
        alert('Profile deleted successfully.');
        logOut();
      } catch (err: any) {
        console.error('Error deleting profile:', err);
        alert(`Failed to delete profile: ${err.message}`);
      } finally {
        setSavingEdit(false);
      }
    }
  };

  
  if (!user) {
    return (
      <div className="flex flex-col h-full bg-slate-50 p-6 items-center justify-center pb-20">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex justify-center mb-6">
            <Logo size={48} className="text-slate-900" />
          </div>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
              {isLoginMode ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-sm text-slate-500">
              {isLoginMode ? 'Sign in using your preferred method' : 'Sign up to get started'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Phone Login Form */}
            <div className="space-y-3">
              {!confirmationResult ? (
                <>
                  {!isLoginMode && (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Display Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Phone Number</label>
                    <div className="flex space-x-2">
                      <CountryCodeSelect value={countryCode} onChange={setCountryCode} />
                      <input
                        type="tel"
                        placeholder="99999 99999"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                      />
                    </div>
                  </div>
                  
                  <div id="recaptcha-container"></div>

                  <button
                    onClick={async () => {
                      if (!phone) {
                        setError('Please enter a phone number');
                        return;
                      }
                      try {
                        setLoading(true);
                        setError('');
                        const fullPhone = countryCode + phone.replace(/\D/g, '');
                        
                        // Check user existence
                        try {
                          const existingProfiles = await dbService.getAll('profiles', { phone: fullPhone });
                          const userExists = existingProfiles && existingProfiles.length > 0;
                          
                          if (!isLoginMode && userExists) {
                            // Registering but user exists -> switch to login
                            setIsLoginMode(true);
                            alert("An account with this number already exists. Proceeding to sign in.");
                          } else if (isLoginMode && !userExists) {
                            // Signing in but user does not exist -> switch to register
                            setIsLoginMode(false);
                            alert("No account found with this number. Please enter your name to register.");
                            setLoading(false);
                            return;
                          }
                        } catch (dbErr) {
                          console.warn("Failed to check existing profiles", dbErr);
                        }

                        const result = await signInWithPhone(fullPhone);
                        setConfirmationResult(result);
                      } catch (e: any) {
                        if (e.code === 'auth/operation-not-allowed' || e.message?.includes('SMS unable to be sent until this region enabled by the app developer')) {
                          setError('Phone authentication issue: Region not enabled. Using bypass mock login for now...');
                          setTimeout(async () => {
                            try {
                              const fullPhone = countryCode + phone.replace(/\D/g, '');
                              await mockPhoneLogin(fullPhone, username || null);
                              localStorage.setItem('terms_accepted', 'true');
                            } catch (err: any) {
                              setError(err.message || 'Fallback login failed');
                            }
                          }, 1500);
                        } else if (e.code === 'auth/too-many-requests') {
                          setError('Too many requests. Please try again later.');
                        } else {
                          setError(e.message || 'Phone login failed');
                        }
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="w-full py-2.5 bg-[#d11a2a] hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-75 flex justify-center items-center"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLoginMode ? 'Sign In with Phone' : 'Register with Phone')}
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Enter Verification Code</label>
                    <input
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a] tracking-widest text-center text-lg font-bold"
                    />
                  </div>

                  <button
                    onClick={async () => {
                      if (!otp) {
                        setError('Please enter the verification code');
                        return;
                      }
                      try {
                        setLoading(true);
                        setError('');
                        await verifyOtp(confirmationResult, otp, isLoginMode ? undefined : username);
                        localStorage.setItem('terms_accepted', 'true');
                      } catch (e: any) {
                        setError('Invalid verification code');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="w-full py-2.5 bg-[#d11a2a] hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-75 flex justify-center items-center"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify Code'}
                  </button>
                  <button
                    onClick={() => {
                      setConfirmationResult(null);
                      setOtp('');
                      setError('');
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors mt-2"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>

          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setError('');
              }}
              className="text-xs font-bold text-[#d11a2a] hover:underline"
            >
              {isLoginMode ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
<div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-20 h-20 rounded-full object-cover border border-slate-200 shadow-sm" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#d11a2a] flex items-center justify-center shadow-sm">
                  <span className="text-3xl font-bold text-white">{user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}</span>
                </div>
              )}
              <div className="flex space-x-6 mt-4">
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold text-slate-900">{dbUser?.followers_count || 0}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Followers</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold text-slate-900">{dbUser?.following_count || 0}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Following</span>
                </div>
              </div>
              <div 
                onClick={() => {
                  setEditName(dbUser?.full_name || dbUser?.username || user.displayName || '');
                  setEditRole(dbUser?.cricket_role || 'Player');
                  setEditDob(dbUser?.date_of_birth || '');
                  setEditIsPublic(dbUser?.is_public !== false);
                  setIsEditModalOpen(true);
                }}
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[10px] px-3 py-0.5 rounded-full font-bold cursor-pointer hover:bg-slate-800 shadow-sm">Edit</div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-3">
                <span>{dbUser?.full_name || dbUser?.username || user.displayName || 'Guest User'}</span>
                {isPro && <ProBadge />}
              </h1>
              {dbUser?.cricket_role && (
                <div className="flex items-center text-slate-500 text-sm mt-1 font-medium bg-slate-100 w-max px-2 py-0.5 rounded-full">
                   {dbUser.cricket_role}
                </div>
              )}
              <div className="flex items-center text-slate-500 text-sm mt-1.5 font-medium">
                <Phone size={14} className="mr-1.5 text-slate-400" /> {user.phoneNumber || 'No mobile linked'}
              </div>
              <div className="flex items-center text-slate-500 text-sm mt-1 font-medium">
                <Calendar size={14} className="mr-1.5 text-slate-400" /> Joined {new Date(user?.metadata?.creationTime || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <button 
              onClick={async () => {
                try {
                  const token = await requestNotificationPermission();
                  if (token && user) {
                    await dbService.update('profiles', user.uid, { fcm_token: token });
                    if (token.startsWith('mock_token')) {
                      alert('Push notifications simulated! (Live push requires opening the app in a new tab)');
                    } else {
                      alert('Push notifications enabled successfully!');
                    }
                  } else {
                    alert('Failed to enable push notifications. Please ensure you are not in Incognito mode and have granted permission.');
                  }
                } catch (e) {
                  console.error(e);
                  alert('Error enabling notifications.');
                }
              }} 
              className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors shadow-sm flex items-center justify-center"
            >
              <Bell size={16} className="mr-1.5" /> Notifications
            </button>
            <button onClick={logOut} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors shadow-sm flex items-center justify-center">
              <LogOut size={16} className="mr-1.5" /> Logout
            </button>
          </div>
        </div>
      <div className="p-6">
        

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center">
              <Trophy className="w-5 h-5 text-teal-600 mr-2" />
              <h2 className="font-bold text-slate-800">Career Statistics</h2>
            </div>
            <select 
              value={statsSport}
              onChange={(e) => setStatsSport(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 focus:outline-none focus:border-[#d11a2a]"
            >
              <option value="Cricket">Cricket</option>
              <option value="Football">Football</option>
              <option value="Basketball">Basketball</option>
              <option value="Hockey">Hockey</option>
              <option value="Tennis">Tennis</option>
              <option value="Volleyball">Volleyball</option>
              <option value="Badminton">Badminton</option>
              <option value="Table Tennis">Table Tennis</option>
              <option value="Pickleball">Pickleball</option>
            </select>
          </div>
          
          <div className="p-4">
            {!isPro ? (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <Trophy className="w-10 h-10 text-slate-300 mb-3" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Advanced Statistics Locked</h2>
                <p className="text-slate-500 text-sm mb-4">Upgrade to PRO to unlock advanced career stats, performance insights, and historical tracking.</p>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('openProModal', { detail: 'Career Stats' }))} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full transition-colors text-sm shadow-md shadow-indigo-200"
                >
                  Unlock Pro
                </button>
              </div>
            ) : loadingStats ? (
              <div className="flex justify-center py-8 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center text-center">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-teal-500 mr-1.5" />
                    Matches
                  </div>
                  <div className="text-2xl font-black text-slate-800">{stats?.matches || 0}</div>
                </div>
                
                {statsSport === 'Cricket' && (
                  <>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center">
                        <Medal className="w-4 h-4 text-teal-500 mr-1.5" />
                        Runs
                      </div>
                      <div className="text-2xl font-black text-slate-800">{stats?.runs || 0}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center">
                        Wickets
                      </div>
                      <div className="text-2xl font-black text-slate-800">{stats?.wickets || 0}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center">
                        Highest Score
                      </div>
                      <div className="text-2xl font-black text-slate-800">{stats?.highestScore || 0}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center">
                        Batting Avg
                      </div>
                      <div className="text-2xl font-black text-slate-800">{stats?.battingAvg || 0}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center">
                        Strike Rate
                      </div>
                      <div className="text-2xl font-black text-slate-800">{stats?.strikeRate || 0}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center">
                        Economy
                      </div>
                      <div className="text-2xl font-black text-slate-800">{stats?.economy || 0}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center">
                        Best Bowling
                      </div>
                      <div className="text-2xl font-black text-slate-800">{stats?.bestBowling || '-'}</div>
                    </div>
                  </>
                )}
                
                {(statsSport === 'Football' || statsSport === 'Hockey') && (
                  <>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center">
                        <Medal className="w-4 h-4 text-teal-500 mr-1.5" />
                        Goals
                      </div>
                      <div className="text-2xl font-black text-slate-800">{stats?.goals || 0}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center">
                        Assists
                      </div>
                      <div className="text-2xl font-black text-slate-800">{stats?.assists || 0}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center">
                        Clean Sheets
                      </div>
                      <div className="text-2xl font-black text-slate-800">{stats?.cleanSheets || 0}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center">
                        Yellow Cards
                      </div>
                      <div className="text-2xl font-black text-slate-800">{stats?.yellowCards || 0}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center">
                        Red Cards
                      </div>
                      <div className="text-2xl font-black text-slate-800">{stats?.redCards || 0}</div>
                    </div>
                  </>
                )}
                
                {(statsSport === 'Basketball') && (
                  <>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center">
                        <Medal className="w-4 h-4 text-teal-500 mr-1.5" />
                        Points
                      </div>
                      <div className="text-2xl font-black text-slate-800">{stats?.points || 0}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center">
                        Rebounds
                      </div>
                      <div className="text-2xl font-black text-slate-800">{stats?.rebounds || 0}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center">
                        Assists
                      </div>
                      <div className="text-2xl font-black text-slate-800">{stats?.assists || 0}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center">
                        Steals
                      </div>
                      <div className="text-2xl font-black text-slate-800">{stats?.steals || 0}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center">
                        Blocks
                      </div>
                      <div className="text-2xl font-black text-slate-800">{stats?.blocks || 0}</div>
                    </div>
                  </>
                )}
                
                {(['Tennis', 'Volleyball', 'Badminton', 'Table Tennis', 'Pickleball'].includes(statsSport)) && (
                  <>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center">
                        <Medal className="w-4 h-4 text-teal-500 mr-1.5" />
                        Win Rate
                      </div>
                      <div className="text-2xl font-black text-slate-800">{stats?.winRate || '0%'}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center">
                        Sets Won
                      </div>
                      <div className="text-2xl font-black text-slate-800">{stats?.setsWon || 0}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center">
                        Sets Lost
                      </div>
                      <div className="text-2xl font-black text-slate-800">{stats?.setsLost || 0}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center">
                        Aces / Points
                      </div>
                      <div className="text-2xl font-black text-slate-800">{stats?.points || 0}</div>
                    </div>
                  </>
                )}              </div>
            )}
            {isPro && !loadingStats && <StatBadges stats={stats} sport={statsSport} />}
          </div>
        </div>


        <SubscriptionManagement />
        {/* Payment History Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-[#d11a2a]" />
              Payment History
            </h2>
          </div>
          <div className="p-0">
            {loadingTransactions ? (
              <div className="p-8 text-center text-slate-500 animate-pulse">Loading transactions...</div>
            ) : transactions.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {transactions.map((tx: any, idx: number) => (
                  <div key={idx} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-900">{tx.description || 'Premium Subscription'}</p>
                      <div className="flex items-center text-sm text-slate-500 mt-1 space-x-3">
                        <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {new Date(tx.created_at).toLocaleDateString()}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium border border-emerald-100">
                          {tx.status || 'Paid'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                      <div className="text-lg font-bold text-slate-900">
                        {tx.currency === 'INR' ? '₹' : '$'}{(tx.amount || 0).toFixed(2)}
                      </div>
                      <button className="flex items-center text-sm font-medium text-[#d11a2a] hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-100">
                        <Receipt className="w-4 h-4 mr-1.5" />
                        Invoice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                  <Receipt className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-500 text-sm font-medium">No transaction history found</p>
                <p className="text-slate-400 text-xs mt-1">Your past payments and invoices will appear here</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleDeleteProfile} 
            disabled={savingEdit}
            className="text-red-500 hover:text-red-700 font-semibold text-sm transition-colors border border-red-500 hover:bg-red-50 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {savingEdit ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Profile'
            )}
          </button>
        </div>

        {/* Support & Legal Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6 mb-12">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2 text-indigo-600" />
              Support & Legal
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            <button 
              onClick={() => window.location.href = "?page=terms"}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mr-3">
                  <FileText className="w-4 h-4 text-slate-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-800">Terms & Conditions</p>
                  <p className="text-xs text-slate-500">Read our terms of service</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <button 
              onClick={() => window.location.href = "?page=refund-policy"}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mr-3">
                  <FileText className="w-4 h-4 text-slate-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-800">Payment & Refund Policy</p>
                  <p className="text-xs text-slate-500">Read our refund and cancellation policies</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            
            <button 
              onClick={() => {
                localStorage.removeItem('location_tracking_accepted');
                localStorage.removeItem('location_accepted');
                window.location.reload();
              }}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mr-3">
                  <MapPin className="w-4 h-4 text-slate-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-800">Privacy & Cookies</p>
                  <p className="text-xs text-slate-500">Manage location and data preferences</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      <TermsConsentModal 
        isOpen={showTermsModal} 
        onAccept={() => {
          setShowTermsModal(false);
          if (pendingLoginAction) {
            pendingLoginAction();
            setPendingLoginAction(null);
          }
        }}
        onDecline={() => {
          setShowTermsModal(false);
          setPendingLoginAction(null);
        }}
      />

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Edit Profile</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 rounded-full p-1.5 transition-colors shadow-sm border border-slate-200"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Display Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                  placeholder="Enter your name"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Date of Birth</label>
                <input 
                  type="date" 
                  value={editDob}
                  onChange={(e) => setEditDob(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Primary Sport Role</label>
                <select 
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a] appearance-none"
                >
                  <optgroup label="General">
                    <option value="Player">Player</option>
                    <option value="Captain">Captain</option>
                    <option value="Coach">Coach</option>
                  </optgroup>
                  <optgroup label="Cricket">
                    <option value="Batsman">Batsman</option>
                    <option value="Bowler">Bowler</option>
                    <option value="All-Rounder">All-Rounder</option>
                    <option value="Wicket-Keeper">Wicket-Keeper</option>
                  </optgroup>
                  <optgroup label="Football / Hockey">
                    <option value="Forward">Forward</option>
                    <option value="Midfielder">Midfielder</option>
                    <option value="Defender">Defender</option>
                    <option value="Goalkeeper">Goalkeeper</option>
                  </optgroup>
                  <optgroup label="Basketball">
                    <option value="Point Guard">Point Guard</option>
                    <option value="Shooting Guard">Shooting Guard</option>
                    <option value="Small Forward">Small Forward</option>
                    <option value="Power Forward">Power Forward</option>
                    <option value="Center">Center</option>
                  </optgroup>
                  <optgroup label="Racquet Sports">
                    <option value="Singles Player">Singles Player</option>
                    <option value="Doubles Player">Doubles Player</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Public Profile</h4>
                    <p className="text-xs text-slate-500">Allow anyone to view your stats and profile.</p>
                  </div>
                  <button 
                    onClick={() => setEditIsPublic(!editIsPublic)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editIsPublic ? 'bg-green-500' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editIsPublic ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              <button 
                onClick={handleSaveProfile}
                disabled={savingEdit}
                className="w-full py-3 mt-2 bg-[#d11a2a] hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-70 flex justify-center items-center"
              >
                {savingEdit ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
