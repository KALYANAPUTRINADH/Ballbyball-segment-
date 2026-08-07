import { useToast } from './ToastContext';
import React, { useState, useEffect } from 'react';
import { ProBadge } from "./ProBadge";
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../lib/database';
import { PlayerSearchModal } from './PlayerSearchModal';
import PlayerProfile from '../pages/PlayerProfile';
import { Menu, Search, MessageSquare, Home as HomeIcon, Search as LookingIcon, Activity, Users, ShoppingBag, X, Check, Shield } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';

interface MobileLayoutProps {
  children: React.ReactNode;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  setFullScreenView: (view: string | null) => void;
  isProOpen: boolean;
  setIsProOpen: (v: boolean) => void;
}

import { Logo } from './Logo';

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children, currentTab, setCurrentTab, setFullScreenView, isProOpen, setIsProOpen }) => {
  const { showToast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logOut, isPro, isAdmin } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);

  const handleStripeCheckout = async () => {
    try {
      setLoading(true);
      const amount = selectedPlan === 'monthly' ? 99 : 999;
      const description = selectedPlan === 'monthly' ? 'Streamlify Pro Monthly' : 'Streamlify Pro Yearly';

      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          amount,
          description
        })
      });
      const data = await res.json();
      if (data.url) {
        try {
          
              const expiryDate = new Date();
              if (selectedPlan === 'yearly') {
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);
              } else {
                expiryDate.setMonth(expiryDate.getMonth() + 1);
              }
              await dbService.update('profiles', user.uid, { is_pro: true, subscription_status: 'active', pro_expiration_date: expiryDate.toISOString() });
    await dbService.create('transactions', {
      user_id: user.uid,
      amount: amount,
      currency: 'INR',
      status: 'completed',
      description: description,
      created_at: new Date().toISOString()
    });
  
          alert('Stripe Payment simulated successfully! You are now a PRO member.');
          window.location.reload();
        } catch(e) {}
      } else {
        alert("Failed to initialize Stripe checkout");
      }
    } catch (e) {
      console.error(e);
      alert("Error initiating payment");
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayCheckout = async () => {
    try {
      setLoading(true);
      const amount = selectedPlan === 'monthly' ? 99 : 999;
      const description = selectedPlan === 'monthly' ? 'Streamlify Pro Monthly' : 'Streamlify Pro Yearly';
      
      const configRes = await fetch('/api/config');
      if (!configRes.ok) throw new Error('Failed to fetch config');
      const configData = await configRes.json();
      const rzpKeyId = configData.razorpayKeyId || 'rzp_test_dummy';

      const res = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          amount,
          description
        })
      });
      if (!res.ok) throw new Error('Failed to create order');
      const data = await res.json();
      
      if (data.orderId) {
        const options = {
          key: rzpKeyId,
          amount: data.amount,
          currency: 'INR',
          name: 'Streamlify',
          description: description,
          order_id: data.orderId,
          handler: async function (response: any) {
            try {
              
              const expiryDate = new Date();
              if (selectedPlan === 'yearly') {
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);
              } else {
                expiryDate.setMonth(expiryDate.getMonth() + 1);
              }
              await dbService.update('profiles', user.uid, { is_pro: true, subscription_status: 'active', pro_expiration_date: expiryDate.toISOString() });
    await dbService.create('transactions', {
      user_id: user.uid,
      amount: amount,
      currency: 'INR',
      status: 'completed',
      description: description,
      created_at: new Date().toISOString()
    });
  
              alert('Payment successful! You are now a PRO member.');
              window.location.reload();
            } catch(e) {
              alert('Verification failed');
            }
          },
          prefill: {
            name: user?.displayName || '',
            email: user?.email || '',
            contact: user?.phoneNumber || ''
          },
          theme: {
            color: '#10b981'
          }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        alert("Failed to initialize Razorpay checkout");
      }
    } catch (e) {
      console.error(e);
      alert("Error initiating payment");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'looking', label: 'Looking', icon: LookingIcon },
    { id: 'mycricket', label: 'My Sports', icon: Activity },
    { id: 'community', label: 'Community', icon: Users },
  ];

  const handleMenuAction = (action: string) => {
    if (action === 'Share the app') {
      if (navigator.share) {
        navigator.share({ title: 'Streamlify', url: window.location.href });
      } else {
        showToast('App URL copied to clipboard');
      }
      setIsSidebarOpen(false);
      return;
    }
    if (action === 'Rate us') {
      showToast('Thank you for rating us!');
      setIsSidebarOpen(false);
      return;
    }
    
    if (['Add a Tournament/Series'].includes(action)) {
      if (!user) {
        showToast('Please sign in first');
        return;
      }
      if (isPro || isAdmin) {
        setFullScreenView('Tournament Hub');
      } else {
        setIsProOpen(true);
      }
      setIsSidebarOpen(false);
      return;
    }
    
    if (['Start A Match'].includes(action)) {
      if (!user) {
        showToast('Please sign in to start a match');
        return;
      }
      setFullScreenView(action);
      setIsSidebarOpen(false);
      return;
    }
    
    if (['Go Live', 'Pro Dashboard', 'My Performance', 'Leaderboards', 'Streamlify Awards', 'Video Segmentation', 'Profile', 'Team Chat', 'Coach Portal', 'Calendar & Schedule', 'App code', 'Clubs', 'Associations', 'Contact', 'More', 'Admin Panel'].includes(action)) {
      if (['My Performance'].includes(action) && !isPro && !isAdmin) {
        setIsProOpen(true);
        setIsSidebarOpen(false);
        return;
      }
      setFullScreenView(action);
    } else if (action === 'My Sports' || action === 'My Cricket') {
      setCurrentTab('mycricket');
    } else if (action === 'Looking') {
      setCurrentTab('looking');
    } else {
      showToast('Action triggered: ' + action);
    }
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex justify-center bg-gray-50 min-h-screen">
      <div className="w-full h-screen flex flex-col md:flex-row relative overflow-hidden bg-white shadow-2xl max-w-[1920px] mx-auto">
        
        {/* Desktop Sidebar (Left) */}
        <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 z-30 shrink-0 shadow-sm">
            <div className="h-16 flex items-center px-4 bg-[#d11a2a] text-white">
              <div className="flex items-center space-x-3">
                <Menu className="cursor-pointer hover:bg-red-700 p-1 rounded transition-colors" size={28} onClick={() => setIsSidebarOpen(true)} />
                <Logo size={32} className="text-white" />
              </div>
            </div>
           
           <nav className="flex-1 overflow-y-auto py-6 space-y-1">
             <div className="px-6 mb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Menu</div>
             {tabs.map((tab) => {
               const Icon = tab.icon;
               const isActive = currentTab === tab.id;
               return (
                 <button 
                   key={tab.id}
                   onClick={() => setCurrentTab(tab.id)}
                   className={`flex items-center w-full space-x-4 px-6 py-3 transition-colors ${isActive ? 'bg-red-50 text-[#d11a2a] border-r-4 border-[#d11a2a] font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}
                 >
                   <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                   <span>{tab.label}</span>
                 </button>
               );
             })}
           </nav>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col h-full relative overflow-hidden">
          
          {/* Mobile Header (Top) */}
          <header className="md:hidden bg-[#d11a2a] h-16 shrink-0 flex items-center justify-between px-4 text-white z-20 shadow-md">
            <div className="flex items-center space-x-3">
              <Menu className="cursor-pointer" size={24} onClick={() => setIsSidebarOpen(false)} />
              <Logo size={28} className="text-white" />
            </div>
            <div className="flex items-center space-x-4">
              <button className="hover:opacity-80 transition-opacity" onClick={() => setIsSearchOpen(true)}><Search size={20} /></button>
              {user && <NotificationCenter setFullScreenView={setFullScreenView} />}
              <button className="relative hover:opacity-80 transition-opacity" onClick={() => { setFullScreenView('Team Chat'); setIsSidebarOpen(false); }}>
                <MessageSquare size={20} />
              </button>
            </div>
          </header>

          {/* Desktop Top Bar */}
          <header className="hidden md:flex bg-white h-16 shrink-0 items-center justify-between px-8 border-b border-gray-200 z-20">
             <div className="font-bold text-xl text-gray-800">
               {tabs.find(t => t.id === currentTab)?.label || 'Overview'}
             </div>
             <div className="flex items-center space-x-6 text-gray-500">
                <button className="hover:text-gray-900 transition-colors bg-gray-100 p-2 rounded-full" onClick={() => setIsSearchOpen(true)}><Search size={20} /></button>
                {user && <NotificationCenter setFullScreenView={setFullScreenView} />}
                <button className="relative hover:text-gray-900 transition-colors bg-gray-100 p-2 rounded-full" onClick={() => setFullScreenView('Team Chat')}>
                  <MessageSquare size={20} />
                </button>
                
                <div className="h-8 w-px bg-gray-200 mx-2"></div>
                
                <button onClick={() => setFullScreenView('Profile')} className="flex items-center space-x-3 hover:bg-gray-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-gray-200">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-gray-200 object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center border border-gray-200 shrink-0">
                      <span className="text-teal-700 font-bold text-xs">{user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}</span>
                    </div>
                  )}
                  <div className="text-sm font-medium text-gray-700 hidden lg:block">{user?.displayName ? user.displayName.split(" ")[0] : "User"}</div>
                </button>
             </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto relative bg-gray-100/50 pb-16 md:pb-0">
            <div className="max-w-7xl mx-auto w-full h-full min-h-full">
              {children}
  
      
      {isSearchOpen && (
        <PlayerSearchModal 
          onClose={() => setIsSearchOpen(false)}
          onSelectPlayer={(player) => {
            setIsSearchOpen(false);
            window.dispatchEvent(new CustomEvent('openPlayerProfile', { detail: player }));
          }}
        />
      )}

  


  
      {isProOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 text-white relative">
            <button onClick={() => setIsProOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="p-8 pb-6 text-center">
              <span className="bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 text-xs font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-wider mb-4 inline-block">Pro Features</span>
              <h2 className="text-3xl font-black mb-2">Upgrade to Premium</h2>
              <p className="text-slate-300">Unlock advanced stats, ad-free experience, and exclusive community features.</p>
            </div>
            
            <div className="p-6 pt-0 space-y-4">
              <div onClick={() => setSelectedPlan('monthly')} className={`rounded-xl p-4 border flex items-center justify-between cursor-pointer transition-colors group ${selectedPlan === 'monthly' ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-400/50' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}>
                <div>
                  <h3 className={`font-bold text-lg ${selectedPlan === 'monthly' ? 'text-amber-300' : 'text-white'}`}>Monthly Plan</h3>
                  <p className="text-sm text-slate-300">₹99 / month</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'monthly' ? 'border-amber-400 bg-amber-400' : 'border-slate-400 group-hover:border-amber-400'}`}>
                  {selectedPlan === 'monthly' && <Check className="w-4 h-4 text-yellow-900" />}
                </div>
              </div>
              
              <div onClick={() => setSelectedPlan('yearly')} className={`rounded-xl p-4 border flex items-center justify-between cursor-pointer relative overflow-hidden group ${selectedPlan === 'yearly' ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-400/50' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}>
                <div className="absolute top-0 right-0 bg-amber-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">BEST VALUE</div>
                <div>
                  <h3 className={`font-bold text-lg ${selectedPlan === 'yearly' ? 'text-amber-300' : 'text-white'}`}>Yearly Plan</h3>
                  <p className="text-sm text-amber-100/70">₹999 / year <span className="line-through text-slate-400 ml-2">₹1188</span></p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'yearly' ? 'border-amber-400 bg-amber-400' : 'border-slate-400 group-hover:border-amber-400'}`}>
                  {selectedPlan === 'yearly' && <Check className="w-4 h-4 text-yellow-900" />}
                </div>
              </div>
            </div>
            
            <div className="p-6 pt-2 space-y-3">
              <button 
                onClick={handleRazorpayCheckout}
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-yellow-900 font-bold py-3.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 text-lg"
              >
                {loading ? 'Processing...' : `Pay ₹${selectedPlan === 'monthly' ? '99' : '999'} with Razorpay`}
              </button>
              <button 
                onClick={handleStripeCheckout}
                disabled={loading}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-xl border border-white/20 transition-all active:scale-95 text-sm"
              >
                {loading ? 'Processing...' : `Pay ${selectedPlan === 'monthly' ? '₹99' : '₹999'} with Stripe`}
              </button>
            </div>
          </div>
        </div>
      )}

            </div>
          </main>

          {/* Bottom Navigation (Mobile Only) */}
          <nav className="md:hidden bg-white border-t border-gray-200 flex justify-around items-center absolute bottom-0 w-full h-16 px-2 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button 
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`flex flex-col items-center justify-center w-16 space-y-1 transition-colors hover:bg-gray-50 rounded-lg p-1 ${isActive ? 'text-[#d11a2a]' : 'text-gray-500'}`}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-semibold">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Overlay (Mobile & Desktop Global Menu) */}
        {isSidebarOpen && (
          <div className="absolute inset-0 z-[100] flex">
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />
            
            {/* Sidebar panel */}
            <div className="w-[85%] max-w-sm bg-white h-full shadow-2xl relative z-10 flex flex-col transform transition-transform duration-300 translate-x-0 overflow-y-auto hide-scrollbar">
              
              {/* Sidebar Header */}
              <div 
                className="bg-[#333333] text-white p-6 flex items-center space-x-4 cursor-pointer hover:bg-[#2a2a2a] transition-colors"
                onClick={() => { setFullScreenView('Profile'); setIsSidebarOpen(false); }}
              >
                <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-white/20 flex items-center justify-center bg-teal-600">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white">{user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-xl leading-tight">{user?.displayName || "User"}</h2>
                  <p className="text-gray-300 text-sm mt-0.5">{user?.phoneNumber || "No mobile linked"}</p>
                  
                </div>
                <button className="text-white shrink-0 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                  <span className="text-sm font-bold">&gt;</span>
                </button>
              </div>
              
              {/* Progress bar */}
              <div className="bg-[#333333] px-6 pb-6">
                <div className="w-full bg-gray-600 h-1.5 rounded-full relative cursor-help" title="Profile completion">
                  <div className="absolute left-0 top-0 h-full bg-blue-400 w-[75%] rounded-full shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                </div>
                <div className="text-right text-emerald-400 text-xs mt-2 font-bold flex items-center justify-end"><Check className="w-3 h-3 mr-1" /> Profile Verified</div>
              </div>

              {/* Sidebar Menu Items */}
              <div className="flex-1 py-4 bg-gray-50">
                <div 
                  className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors mb-2 shadow-sm"
                  onClick={() => handleMenuAction('PRO Features')}
                >
                  <div className="flex flex-col w-full">
                    <div className="flex items-center justify-between cursor-pointer group" onClick={() => { setFullScreenView('Profile'); setIsSidebarOpen(false); }}>
                      <div className="flex items-center space-x-4">
                        {user ? (
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                              <span className="text-xl font-bold text-white">
                                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                              </span>
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 text-lg">{user.displayName ? user.displayName.split(' ')[0] : 'User'}</div>
                              
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                              <span className="text-xl font-bold text-gray-400">?</span>
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 text-lg">Guest</div>
                              <div className="text-[10px] font-bold border border-gray-300 text-gray-600 rounded-full px-2 py-0.5 inline-block mt-1">Not logged in</div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                        <span className="text-xl">&gt;</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 cursor-pointer hover:bg-gray-50 rounded transition-colors -mx-6 px-6 pb-2" onClick={() => setIsProOpen(true)}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-3 text-gray-800">
                          <span className="bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded shadow-sm">PRO</span>
                          <span className="font-bold text-sm">PRO at ₹99/mo, ₹999/yr</span>
                        </div>
                        <span className="text-xs text-gray-500">No autopay</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-y border-gray-100">
                  {[
                    ...(isAdmin ? [{ icon: '🛠️', label: 'Admin Panel', badge: 'System' }] : []),
                    { icon: '🏆', label: 'Add a Tournament/Series', badge: 'Pro (₹99/m)' },
                    { icon: '🏏', label: 'Start A Match', badge: 'Free' },
                    { icon: '✂️', label: 'Video Segmentation' },
                    { icon: '🏏', label: 'My Sports' },
                    { icon: '📈', label: 'Pro Dashboard', badge: 'Pro (₹99/m)' },
                    { icon: '📊', label: 'My Performance', badge: 'Pro (₹99/m)' },
                    { icon: '⭐', label: 'Leaderboards' },
                    { icon: '🏅', label: 'Streamlify Awards' },
                    { icon: '🔗', label: 'Associations' },
                    { icon: '🏛️', label: 'Clubs' },
                    { icon: '📞', label: 'Contact' },
                    { icon: '📤', label: 'Share the app' },
                    { icon: '⭐', label: 'Rate us' },
                    { icon: '🎫', label: 'App code' },
                    { icon: '•••', label: 'More', isMore: true },
                  ].map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleMenuAction(item.label)}
                      className="px-6 py-3.5 border-b border-gray-50 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <span className="text-xl text-gray-600 w-6 text-center">{item.icon}</span>
                        <span className="text-[15px] text-gray-800 font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {item.badge === "Pro (₹99/m)" ? <ProBadge /> : item.badge && (
                          <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">{item.badge}</span>
                        )}

                        {item.isMore && (
                          <span className="text-gray-400 font-bold">&gt;</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
