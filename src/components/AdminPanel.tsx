import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, Trash2, Edit, Search, Plus, CreditCard, Activity, Check, X, 
  ChevronRight, RefreshCw, UserCheck, Crown, AlertTriangle, Filter, DollarSign,
  TrendingUp, Award, MapPin, Calendar, Smartphone, Mail, ShieldAlert,
  Trophy, Film, Clock, Play, ChevronLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../lib/database';
// Removed supabase import
import { SportsManagement } from './SportsManagement';

interface AdminUser {
  id: string;
  name?: string;
  username?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  role?: string;
  is_pro?: boolean | string;
  cricket_role?: string;
  date_of_birth?: string;
}

export const AdminPanel: React.FC = () => {
  const { user, isAdmin } = useAuth();
  
  // States
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [profilesList, setProfilesList] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, any>>({});
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profiles' | 'transactions' | 'stats' | 'tournaments_segments' | 'sports_management'>('profiles');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [proFilter, setProFilter] = useState<'all' | 'pro' | 'free'>('all');
  
  const [supportedSports, setSupportedSports] = useState<string[]>(() => {
    const saved = localStorage.getItem('supported_sports');
    return saved ? JSON.parse(saved) : ['Cricket', 'Football', 'Tennis', 'Basketball', 'Badminton', 'Pickleball', 'Hockey', 'Volleyball', 'Table Tennis'];
  });

  useEffect(() => {
    localStorage.setItem('supported_sports', JSON.stringify(supportedSports));
  }, [supportedSports]);
  
  // Selected item states for editing modals
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editingStats, setEditingStats] = useState<any | null>(null);
  const [statsSport, setStatsSport] = useState<string>('Cricket');
  const [newTransactionUser, setNewTransactionUser] = useState<string>('');
  const [newTransactionAmount, setNewTransactionAmount] = useState<number>(49);
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);

  // Tournaments & Segments States
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>('Cricket'); // Cricket, Football, Tennis
  const [activeSportSubTab, setActiveSportSubTab] = useState<'tournaments' | 'segments'>('tournaments');
  
  const [editingTournament, setEditingTournament] = useState<any | null>(null);
  const [isNewTournamentModalOpen, setIsNewTournamentModalOpen] = useState(false);
  const [newTournament, setNewTournament] = useState({
    name: '', location: '', date: '', teamsCount: 4,
    sport_type: 'Cricket', format: 'League', ball_type: 'Leather', entryFee: 0
  });

  const [editingMatch, setEditingMatch] = useState<any | null>(null);
  const [isNewMatchModalOpen, setIsNewMatchModalOpen] = useState(false);
  const [newMatch, setNewMatch] = useState({
    title: '', team_a: '', team_b: '', venue: '', sport_type: 'Cricket', status: 'Ongoing', videoUrl: '', duration: 120
  });

  const [selectedMatchForSegments, setSelectedMatchForSegments] = useState<any | null>(null);
  const [editingSegment, setEditingSegment] = useState<any | null>(null);

  // Seed Constants
  const SEED_TOURNAMENTS = [
    {
      id: 101,
      name: "Premier T20 Cup",
      location: "Mumbai Oval",
      date: "2026-07-20",
      status: "Upcoming",
      teamsCount: 8,
      sport_type: "Cricket",
      format: "League",
      ball_type: "Leather",
      entryFee: 1500
    },
    {
      id: 102,
      name: "State Championship",
      location: "Delhi Stadium",
      date: "2026-08-15",
      status: "Ongoing",
      teamsCount: 16,
      sport_type: "Cricket",
      format: "Knockout",
      ball_type: "Tennis",
      entryFee: 2500
    },
    {
      id: 103,
      name: "Super League Tournament",
      location: "Kolkata Arena",
      date: "2026-07-25",
      status: "Ongoing",
      teamsCount: 10,
      sport_type: "Football",
      format: "League",
      entryFee: 2000
    },
    {
      id: 104,
      name: "Grass Court Grand Open",
      location: "London Courts",
      date: "2026-06-18",
      status: "Completed",
      teamsCount: 32,
      sport_type: "Tennis",
      format: "Knockout",
      entryFee: 5000
    }
  ];

  const SEED_MATCHES: any[] = [];
  
  // Status message
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const showAlert = (text: string, type: 'success' | 'error' = 'success') => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 5000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch from 'profiles' table
      
      let profilesData: any[] = [];
      let txData: any[] = [];
      let performanceData: any[] = [];
      
      try { profilesData = await dbService.getAll('profiles') || []; } catch(e) { console.warn('Failed to load profiles', e); }
      try { txData = await dbService.getAll('transactions') || []; } catch(e) { console.warn('Failed to load txs', e); }
      try { performanceData = await dbService.getAll('performance_stats') || []; } catch(e) { console.warn('Failed to load performance', e); }


      // Map profiles 
      const mergedUsers = profilesData.map((prof: any) => {
        return {
          ...prof,
          id: prof.id || prof.uid,
          // Fallbacks and prioritization
          name: prof.full_name || prof.username || prof.displayName || prof.name || 'User',
          displayName: prof.full_name || prof.displayName || prof.username || prof.name || '',
          email: prof.email || '',
          phone: prof.phone || '',
          role: prof.role || 'user',
          is_pro: (() => {
            let _pro = prof.is_pro === true || prof.is_pro === 'true';
            if (_pro && prof.pro_expiration_date) {
              const expiry = new Date(prof.pro_expiration_date);
              if (expiry < new Date()) {
                _pro = false;
              }
            }
            return _pro;
          })()
        };
      });

      setUsersList(mergedUsers);
      setProfilesList(profilesData);
      setTransactions(Array.isArray(txData) ? txData : []);
      
      // Create a map of performance stats for fast lookup
      const statsObj: Record<string, any> = {};
      performanceData.forEach((item: any) => {
        const id = item.id || item.uid;
        if (id) statsObj[id] = item;
      });
      setStatsMap(statsObj);

      // 5. Fetch from 'tournaments' table and merge
      const tournamentsData = await dbService.getAll('tournaments') || [];
      const localToursJson = localStorage.getItem('admin_tournaments');
      let finalTournaments: any[] = tournamentsData;
      if (finalTournaments.length === 0) {
        if (localToursJson) {
          finalTournaments = JSON.parse(localToursJson);
        } else {
          finalTournaments = SEED_TOURNAMENTS;
          localStorage.setItem('admin_tournaments', JSON.stringify(SEED_TOURNAMENTS));
        }
      } else {
        const dbIds = new Set(tournamentsData.map((t: any) => t.id));
        const mergedTours = [...tournamentsData];
        SEED_TOURNAMENTS.forEach((st: any) => {
          if (!dbIds.has(st.id)) {
            mergedTours.push(st);
          }
        });
        finalTournaments = mergedTours;
      }
      setTournaments(finalTournaments);

      // 6. Fetch from 'matches' table and merge
      const matchesData = await dbService.getAll('matches') || [];
      const localMatchesJson = localStorage.getItem('admin_matches');
      let finalMatches = matchesData;
      if (finalMatches.length === 0) {
        if (localMatchesJson) {
          finalMatches = JSON.parse(localMatchesJson);
        } else {
          finalMatches = SEED_MATCHES;
          localStorage.setItem('admin_matches', JSON.stringify(SEED_MATCHES));
        }
      } else {
        const dbIds = new Set(matchesData.map((m: any) => m.id));
        const mergedMatches = [...matchesData];
        SEED_MATCHES.forEach((sm: any) => {
          if (!dbIds.has(sm.id)) {
            mergedMatches.push(sm);
          }
        });
        finalMatches = mergedMatches;
      }
      setMatches(finalMatches);
      
    } catch (error: any) {
      console.error('Failed to load admin panel data:', error);
      showAlert('Error loading system database records.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filtered Users List
  const filteredUsers = usersList.filter(u => {
    const term = searchQuery.toLowerCase();
    const nameMatch = (u.name || '').toLowerCase().includes(term) || 
                      (u.displayName || '').toLowerCase().includes(term) ||
                      (u.username || '').toLowerCase().includes(term);
    const emailMatch = (u.email || '').toLowerCase().includes(term);
    const phoneMatch = (u.phone || '').toLowerCase().includes(term);
    
    const matchesSearch = nameMatch || emailMatch || phoneMatch;
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesPro = proFilter === 'all' || 
                        (proFilter === 'pro' && u.is_pro) || 
                        (proFilter === 'free' && !u.is_pro);
                        
    return matchesSearch && matchesRole && matchesPro;
  });

  // Calculate Metrics
  const totalUsers = usersList.length;
  const totalProUsers = usersList.filter(u => u.is_pro).length;
  const totalRevenue = transactions
    .filter(tx => tx.status === 'completed' || tx.status === 'SUCCESS' || !tx.status)
    .reduce((acc, tx) => acc + (parseFloat(tx.amount) || 0), 0);
  const totalAdmins = usersList.filter(u => u.role === 'admin').length;

  // Save modified user details
  const handleSaveUser = async () => {
    if (!editingUser) return;
    try {
      // Update in profiles table (username, full_name, phone, email, is_pro, role, etc.)
      await dbService.update('profiles', editingUser.id, {
        username: editingUser.name || editingUser.username,
        full_name: editingUser.name || editingUser.full_name,
        phone: editingUser.phone,
        email: editingUser.email,
        is_pro: editingUser.is_pro,
        role: editingUser.role,
        cricket_role: editingUser.cricket_role,
        date_of_birth: editingUser.date_of_birth,
        updated_at: new Date().toISOString()
      });

      showAlert(`User record for "${editingUser.name}" updated successfully.`);
      setEditingUser(null);
      loadData();
    } catch (e: any) {
      console.error('Error saving user:', e);
      showAlert('Failed to update user records: ' + e.message, 'error');
    }
  };

  // Delete User completely
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`CRITICAL ACTION!\nAre you sure you want to completely delete "${userName || 'this user'}"?\nThis will purge all profiles, tournament listings, stats, and records for this user.`)) {
      return;
    }

    try {
      setRefreshing(true);
      // Deletions across all possible related tables
      const tablesToDeleteFrom = [
        'profiles',
        'performance_stats',
        'player_stats',
        'community_profiles',
        'transactions'
      ];

      for (const table of tablesToDeleteFrom) {
        try {
          await dbService.remove(table, userId);
        } catch (err) {
          console.warn(`Could not delete from table ${table}:`, err);
        }
      }

      // Cleanup looking_posts (search by author_id)
      try {
        const posts = await dbService.getAll('looking_posts', { author_id: userId });
        if (Array.isArray(posts)) {
          for (const p of posts) {
            await dbService.remove('looking_posts', p.id);
          }
        }
      } catch (err) {
        console.warn('Could not cleanup looking_posts:', err);
      }
      
      showAlert(`User "${userName}" and associated data purged completely.`);
      await loadData();
    } catch (e: any) {
      console.error('Purge failed:', e);
      showAlert('Purge operation failed: ' + (e.message || 'Unknown error'), 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // Save Performance Stats
  const handleSaveStats = async () => {
    if (!editingStats) return;
    try {
      await dbService.upsert('performance_stats', {
        id: editingStats.id,
        matches: parseInt(editingStats.matches) || 0,
        // Cricket fields
        runs: parseInt(editingStats.runs) || 0,
        wickets: parseInt(editingStats.wickets) || 0,
        highest_score: parseInt(editingStats.highest_score) || 0,
        best_bowling: editingStats.best_bowling || '-',
        average: parseFloat(editingStats.average) || 0,
        strike_rate: parseFloat(editingStats.strike_rate) || 0,
        economy: parseFloat(editingStats.economy) || 0,
        // Football & Hockey fields
        goals: parseInt(editingStats.goals) || 0,
        assists: parseInt(editingStats.assists) || 0,
        cleanSheets: parseInt(editingStats.cleanSheets) || 0,
        yellowCards: parseInt(editingStats.yellowCards) || 0,
        redCards: parseInt(editingStats.redCards) || 0,
        // Basketball fields
        points: parseInt(editingStats.points) || 0,
        rebounds: parseInt(editingStats.rebounds) || 0,
        steals: parseInt(editingStats.steals) || 0,
        blocks: parseInt(editingStats.blocks) || 0,
        // Racket / Net sports fields (Tennis, Volleyball, Badminton, Pickleball, Table Tennis)
        setsWon: parseInt(editingStats.setsWon) || 0,
        setsLost: parseInt(editingStats.setsLost) || 0,
        updated_at: new Date().toISOString()
      });

      showAlert('Performance stats updated successfully.');
      setEditingStats(null);
      loadData();
    } catch (e: any) {
      console.error(e);
      showAlert('Failed to update user performance stats.', 'error');
    }
  };

  // Add Manual Transaction
  const handleAddManualTransaction = async () => {
    if (!newTransactionUser) {
      showAlert('Please select a user', 'error');
      return;
    }

    try {
      const selectedUser = usersList.find(u => u.id === newTransactionUser);
      if (!selectedUser) return;

      const randomTxId = 'manual_tx_' + Math.random().toString(36).substr(2, 9);
      
      // 1. Create transaction in transactions table
      await dbService.create('transactions', {
        user_id: selectedUser.id,
        amount: newTransactionAmount,
        currency: 'INR',
        provider: 'offline_admin',
        order_id: 'ORDER_' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        transaction_id: randomTxId,
        status: 'completed',
        created_at: new Date().toISOString()
      });

      // 2. Set Pro Status in profile
      await dbService.update('profiles', selectedUser.id, {
        is_pro: true,
        updated_at: new Date().toISOString()
      });

      showAlert(`Offline subscription order saved. PRO status granted to ${selectedUser.name}.`);
      setIsNewTxModalOpen(false);
      setNewTransactionUser('');
      loadData();
    } catch (e: any) {
      console.error(e);
      showAlert('Failed to save offline order.', 'error');
    }
  };

  // Tournaments & Segments CRUD handlers
  const handleSaveTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let updatedTours = [];
      if (editingTournament && editingTournament.id) {
        // Edit mode
        updatedTours = tournaments.map(t => t.id === editingTournament.id ? editingTournament : t);
        try {
          await dbService.update('tournaments', String(editingTournament.id), editingTournament);
        } catch (err) {}
        showAlert(`Tournament "${editingTournament.name}" updated successfully.`);
      } else {
        // Create mode
        const newId = Date.now();
        const payload = { ...newTournament, id: newId, sport_type: selectedSport, created_at: new Date().toISOString() };
        updatedTours = [payload, ...tournaments];
        try {
          await dbService.create('tournaments', payload);
        } catch (err) {}
        showAlert(`Tournament "${newTournament.name}" created successfully.`);
        setNewTournament({
          name: '', location: '', date: '', teamsCount: 4,
          sport_type: selectedSport, format: 'League', ball_type: 'Leather', entryFee: 0
        });
      }
      setTournaments(updatedTours);
      localStorage.setItem('admin_tournaments', JSON.stringify(updatedTours));
      setIsNewTournamentModalOpen(false);
      setEditingTournament(null);
    } catch (err) {
      console.error(err);
      showAlert('Failed to save tournament.', 'error');
    }
  };

  const handleDeleteTournament = async (id: any) => {
    if (!window.confirm("Are you sure you want to delete this tournament?")) return;
    try {
      const updatedTours = tournaments.filter(t => t.id !== id);
      setTournaments(updatedTours);
      localStorage.setItem('admin_tournaments', JSON.stringify(updatedTours));
      try {
        await dbService.remove('tournaments', String(id));
      } catch (err) {}
      showAlert("Tournament deleted successfully.");
    } catch (err) {
      console.error(err);
      showAlert('Failed to delete tournament.', 'error');
    }
  };

  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let updatedMatches = [];
      if (editingMatch && editingMatch.id) {
        // Edit mode
        updatedMatches = matches.map(m => m.id === editingMatch.id ? editingMatch : m);
        try {
          await dbService.update('matches', String(editingMatch.id), {
            team_a: editingMatch.team_a,
            team_b: editingMatch.team_b,
            venue: editingMatch.venue,
            sport_type: editingMatch.sport_type,
            status: editingMatch.status || 'Ongoing'
          });
        } catch (err) {}
        showAlert(`Match "${editingMatch.title || (editingMatch.team_a + ' vs ' + editingMatch.team_b)}" updated successfully.`);
      } else {
        // Create mode
        const newId = 'match_' + Date.now();
        const title = newMatch.title || `${newMatch.team_a} vs ${newMatch.team_b}`;
        const payload = { ...newMatch, id: newId, title, sport_type: selectedSport, deliveries: [] };
        updatedMatches = [payload, ...matches];
        try {
          await dbService.create('matches', {
            id: newId,
            team_a: newMatch.team_a || 'Team A',
            team_b: newMatch.team_b || 'Team B',
            venue: newMatch.venue || 'Venue',
            sport_type: selectedSport,
            status: newMatch.status || 'Ongoing'
          });
        } catch (err) {}
        showAlert(`Match stream/feed "${title}" created successfully.`);
        setNewMatch({
          title: '', team_a: '', team_b: '', venue: '', sport_type: selectedSport, status: 'Ongoing', videoUrl: '', duration: 120
        });
      }
      setMatches(updatedMatches);
      localStorage.setItem('admin_matches', JSON.stringify(updatedMatches));
      setIsNewMatchModalOpen(false);
      setEditingMatch(null);
    } catch (err) {
      console.error(err);
      showAlert('Failed to save match stream.', 'error');
    }
  };

  const handleDeleteMatch = async (id: any) => {
    if (!window.confirm("Are you sure you want to delete this match stream/feed? All segments will be removed.")) return;
    try {
      const updatedMatches = matches.filter(m => m.id !== id);
      setMatches(updatedMatches);
      localStorage.setItem('admin_matches', JSON.stringify(updatedMatches));
      try {
        await dbService.remove('matches', String(id));
      } catch (err) {}
      showAlert("Match stream/feed deleted successfully.");
      if (selectedMatchForSegments?.id === id) {
        setSelectedMatchForSegments(null);
      }
    } catch (err) {
      console.error(err);
      showAlert('Failed to delete match stream.', 'error');
    }
  };

  const handleSaveSegment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchForSegments) return;
    try {
      const currentDeliveries = selectedMatchForSegments.deliveries || [];
      let updatedDeliveries = [];
      if (editingSegment && editingSegment.id) {
        // Edit mode
        updatedDeliveries = currentDeliveries.map((d: any) => d.id === editingSegment.id ? editingSegment : d);
      } else {
        // Create mode
        const newSeg = { ...editingSegment, id: 'seg_' + Date.now() };
        updatedDeliveries = [...currentDeliveries, newSeg];
      }

      const updatedMatch = { ...selectedMatchForSegments, deliveries: updatedDeliveries };
      const updatedMatches = matches.map(m => m.id === selectedMatchForSegments.id ? updatedMatch : m);
      setMatches(updatedMatches);
      localStorage.setItem('admin_matches', JSON.stringify(updatedMatches));
      setSelectedMatchForSegments(updatedMatch);
      setEditingSegment(null);
      showAlert("Video segment saved successfully.");
      
      // Try DB sync
      try {
        dbService.update('matches', String(selectedMatchForSegments.id), {
          deliveries: updatedDeliveries
        });
      } catch (err) {}
    } catch (err) {
      console.error(err);
      showAlert('Failed to save segment.', 'error');
    }
  };

  const handleDeleteSegment = (segId: any) => {
    if (!selectedMatchForSegments) return;
    if (!window.confirm("Are you sure you want to delete this segment?")) return;
    try {
      const currentDeliveries = selectedMatchForSegments.deliveries || [];
      const updatedDeliveries = currentDeliveries.filter((d: any) => d.id !== segId);
      
      const updatedMatch = { ...selectedMatchForSegments, deliveries: updatedDeliveries };
      const updatedMatches = matches.map(m => m.id === selectedMatchForSegments.id ? updatedMatch : m);
      setMatches(updatedMatches);
      localStorage.setItem('admin_matches', JSON.stringify(updatedMatches));
      setSelectedMatchForSegments(updatedMatch);
      showAlert("Video segment deleted successfully.");

      // Try DB sync
      try {
        dbService.update('matches', String(selectedMatchForSegments.id), {
          deliveries: updatedDeliveries
        });
      } catch (err) {}
    } catch (err) {
      console.error(err);
      showAlert('Failed to delete segment.', 'error');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 pb-12" id="admin_panel_root">
      {/* Alert Notification */}
      {alertMsg && (
        <div 
          id="admin_alert"
          className={`fixed top-4 right-4 z-[999] flex items-center gap-2 p-4 rounded-xl shadow-lg border animate-bounce ${
            alertMsg.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {alertMsg.type === 'success' ? <Check className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
          <span className="text-sm font-semibold">{alertMsg.text}</span>
        </div>
      )}

      {/* Header section with metrics */}
      <div className="bg-white border-b border-slate-200 py-6 px-4 md:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#d11a2a]/10 rounded-lg text-[#d11a2a]">
                <Shield className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900">Administrator Command Center</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">Manage user directories, transaction logs, and performance statistics.</p>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="self-start md:self-auto flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-all active:scale-95 text-sm border border-slate-200 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Sync Database
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
        {/* Core Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Users</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{loading ? '...' : totalUsers}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">PRO Subscribers</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{loading ? '...' : totalProUsers}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Gross Income</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{loading ? '...' : `₹${totalRevenue}`}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Administrators</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{loading ? '...' : totalAdmins}</div>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 mb-6 bg-white rounded-t-xl p-1 shadow-sm gap-2">
          <button 
            onClick={() => setActiveTab('profiles')}
            className={`flex-1 py-3 px-4 font-semibold text-sm rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'profiles' 
                ? 'bg-[#d11a2a] text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            User Directory
          </button>
          <button 
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-3 px-4 font-semibold text-sm rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'transactions' 
                ? 'bg-[#d11a2a] text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Revenue & Checkout logs
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-3 px-4 font-semibold text-sm rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'stats' 
                ? 'bg-[#d11a2a] text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-4 h-4" />
            User Statistics
          </button>
          <button 
            onClick={() => setActiveTab('tournaments_segments')}
            className={`flex-1 py-3 px-4 font-semibold text-sm rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'tournaments_segments' 
                ? 'bg-[#d11a2a] text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Tournaments & Segments
          </button>
          <button 
            onClick={() => setActiveTab('sports_management')}
            className={`flex-1 py-3 px-4 font-semibold text-sm rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'sports_management' 
                ? 'bg-[#d11a2a] text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-4 h-4" />
            Sports Management
          </button>
        </div>

        {/* Loading Overlay */}
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm flex flex-col items-center justify-center gap-4">
            <RefreshCw className="w-10 h-10 text-[#d11a2a] animate-spin" />
            <div className="font-semibold text-slate-600">Syncing database collections...</div>
          </div>
        ) : (
          <>
            {/* TABS - USERS VIEW */}
            {activeTab === 'profiles' && (
              <div className="space-y-4">
                {/* Search and Filters */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search users by name, email, or mobile..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-500">Role:</span>
                      <select 
                        value={roleFilter} 
                        onChange={e => setRoleFilter(e.target.value as any)}
                        className="bg-transparent focus:outline-none font-bold text-slate-700 cursor-pointer"
                      >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50">
                      <Crown className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-500">Status:</span>
                      <select 
                        value={proFilter} 
                        onChange={e => setProFilter(e.target.value as any)}
                        className="bg-transparent focus:outline-none font-bold text-slate-700 cursor-pointer"
                      >
                        <option value="all">All Accounts</option>
                        <option value="pro">PRO Premium</option>
                        <option value="free">Free Account</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Users List Grid (Responsive Card for Mobile, clean table for Tablet/Desktop) */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <th className="p-4">Full Name</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Phone</th>
                          <th className="p-4 text-center">System Role</th>
                          <th className="p-4 text-center">Membership</th>
                          <th className="p-4 text-right">Control & Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">No users found matching filters.</td>
                          </tr>
                        ) : (
                          filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-[#d11a2a]/10 border border-[#d11a2a]/20 flex items-center justify-center font-bold text-[#d11a2a] text-sm shrink-0 overflow-hidden">
                                    {u.photo_url ? (
                                      <img src={u.photo_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <span>{u.name ? u.name.charAt(0).toUpperCase() : '?'}</span>
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                      {u.name}
                                      {u.role === 'admin' && <Shield className="w-3.5 h-3.5 text-[#d11a2a]" title="Administrator" />}
                                      {u.is_pro && <Crown className="w-3.5 h-3.5 text-amber-500" title="Premium Subscriber" />}
                                    </div>
                                    <div className="text-xs text-slate-400 font-mono mt-0.5">{u.id}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-slate-600 font-medium text-sm">{u.email || <span className="text-slate-300 italic">None</span>}</td>
                              <td className="p-4 text-slate-600 font-medium text-sm">{u.phone || <span className="text-slate-300 italic">None</span>}</td>
                              <td className="p-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block border ${
                                  u.role === 'admin' 
                                    ? 'bg-[#d11a2a]/5 border-[#d11a2a]/20 text-[#d11a2a]' 
                                    : 'bg-slate-100 border-slate-200 text-slate-600'
                                }`}>
                                  {u.role?.toUpperCase() || 'USER'}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block border ${
                                  u.is_pro 
                                    ? 'bg-amber-50 border-amber-200 text-amber-700' 
                                    : 'bg-slate-50 border-slate-100 text-slate-400'
                                }`}>
                                  {u.is_pro ? 'PRO MEMBER' : 'FREE'}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button 
                                    onClick={() => setEditingUser(u)}
                                    className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg hover:text-slate-900 transition-colors"
                                    title="Edit Profile"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      const st = statsMap[u.id] || { id: u.id, matches: 0, runs: 0, wickets: 0, highest_score: 0, best_bowling: '-', average: 0, strike_rate: 0, economy: 0 };
                                      setEditingStats(st);
                                    }}
                                    className="p-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 rounded-lg hover:text-blue-800 transition-colors"
                                    title="Edit Stats"
                                  >
                                    <Activity className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(u.id, u.name || '')}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-lg hover:text-rose-800 transition-colors"
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Responsive Cards for Mobile */}
                  <div className="block md:hidden divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 font-medium">No users found matching filters.</div>
                    ) : (
                      filteredUsers.map((u) => (
                        <div key={u.id} className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#d11a2a]/10 border border-[#d11a2a]/20 flex items-center justify-center font-bold text-[#d11a2a] text-sm shrink-0 overflow-hidden">
                                {u.photo_url ? (
                                  <img src={u.photo_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span>{u.name ? u.name.charAt(0).toUpperCase() : '?'}</span>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1">
                                  {u.name}
                                  {u.role === 'admin' && <Shield className="w-3.5 h-3.5 text-[#d11a2a]" />}
                                  {u.is_pro && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">{u.id}</div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                u.role === 'admin' 
                                  ? 'bg-[#d11a2a]/5 border-[#d11a2a]/20 text-[#d11a2a]' 
                                  : 'bg-slate-100 border-slate-200 text-slate-600'
                              }`}>
                                {u.role?.toUpperCase() || 'USER'}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                u.is_pro 
                                  ? 'bg-amber-50 border-amber-200 text-amber-700' 
                                  : 'bg-slate-50 border-slate-100 text-slate-400'
                              }`}>
                                {u.is_pro ? 'PRO' : 'FREE'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-y-2 text-xs border-t border-slate-50 pt-2 text-slate-600">
                            <div>
                              <span className="text-slate-400">Email:</span>
                              <span className="font-medium ml-1 block truncate">{u.email || <span className="italic text-slate-300">None</span>}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Phone:</span>
                              <span className="font-medium ml-1 block truncate">{u.phone || <span className="italic text-slate-300">None</span>}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 justify-end">
                            <button 
                              onClick={() => setEditingUser(u)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Edit Profile
                            </button>
                            <button 
                              onClick={() => {
                                const st = statsMap[u.id] || { id: u.id, matches: 0, runs: 0, wickets: 0, highest_score: 0, best_bowling: '-', average: 0, strike_rate: 0, economy: 0 };
                                setEditingStats(st);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-semibold rounded-lg text-xs"
                            >
                              <Activity className="w-3.5 h-3.5" />
                              Edit Stats
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(u.id, u.name || '')}
                              className="flex items-center justify-center p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-lg text-xs"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TABS - TRANSACTIONS VIEW */}
            {activeTab === 'transactions' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Transaction & Subscription Audits</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Logs generated by Checkout processes.</p>
                  </div>
                  <button 
                    onClick={() => setIsNewTxModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all active:scale-95 text-sm shadow-md shadow-emerald-600/15"
                  >
                    <Plus className="w-4 h-4" />
                    Manually Grant PRO (Offline)
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <th className="p-4">Transaction ID</th>
                          <th className="p-4">Customer Info</th>
                          <th className="p-4 text-center">Gateway</th>
                          <th className="p-4 text-right">Amount Paid</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4 text-center">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {transactions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">No system checkout logs recorded yet.</td>
                          </tr>
                        ) : (
                          [...transactions].sort((a,b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).map((tx, index) => {
                            const matchedUser = usersList.find(u => u.id === tx.user_id);
                            return (
                              <tr key={tx.id || index} className="hover:bg-slate-50/30 transition-colors">
                                <td className="p-4 font-mono text-xs text-slate-700 font-semibold">{tx.transaction_id || tx.id || 'N/A'}</td>
                                <td className="p-4">
                                  {matchedUser ? (
                                    <div>
                                      <div className="font-semibold text-slate-900">{matchedUser.name || 'Anonymous'}</div>
                                      <div className="text-xs text-slate-400 mt-0.5">{matchedUser.email || 'No Email'}</div>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="font-semibold text-slate-400 italic">Unknown User</div>
                                      <div className="text-[10px] text-slate-300 font-mono mt-0.5">{tx.user_id}</div>
                                    </div>
                                  )}
                                </td>
                                <td className="p-4 text-center font-semibold text-xs text-slate-600">{tx.provider?.toUpperCase() || 'STRIPE'}</td>
                                <td className="p-4 text-right font-bold text-slate-950">₹{tx.amount}</td>
                                <td className="p-4 text-center">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${
                                    tx.status === 'completed' || tx.status === 'SUCCESS' || !tx.status
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                      : 'bg-rose-50 border-rose-200 text-rose-700'
                                  }`}>
                                    {(tx.status || 'SUCCESS').toUpperCase()}
                                  </span>
                                </td>
                                <td className="p-4 text-center text-slate-500 font-medium text-xs">
                                  {tx.created_at ? new Date(tx.created_at).toLocaleString() : 'N/A'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TABS - USER STATISTICS VIEW */}
            {activeTab === 'stats' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">User Statistics Control Table</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Edit match histories, scores, achievements, and performances for all supported sports.</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider text-slate-400">Select Sport:</label>
                    <select 
                      value={statsSport} 
                      onChange={e => setStatsSport(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-800 text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                    >
                      {['Cricket', 'Football', 'Hockey', 'Basketball', 'Tennis', 'Pickleball', 'Volleyball', 'Badminton', 'Table Tennis', 'Squash', 'Rugby', 'Kabaddi', 'Golf', 'Chess', 'Esports', 'Wrestling', 'Athletics'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <th className="p-4">Player</th>
                          <th className="p-4 text-center">Matches</th>
                          {statsSport === 'Cricket' && (
                            <>
                              <th className="p-4 text-center">Runs</th>
                              <th className="p-4 text-center">Wickets</th>
                              <th className="p-4 text-center">Highest Score</th>
                              <th className="p-4 text-center">Best Bowling</th>
                              <th className="p-4 text-center">Average</th>
                              <th className="p-4 text-center">Strike Rate</th>
                            </>
                          )}
                          {(statsSport === 'Football' || statsSport === 'Hockey') && (
                            <>
                              <th className="p-4 text-center">Goals</th>
                              <th className="p-4 text-center">Assists</th>
                              <th className="p-4 text-center">Clean Sheets</th>
                              <th className="p-4 text-center">Yellow Cards</th>
                              <th className="p-4 text-center">Red Cards</th>
                            </>
                          )}
                          {statsSport === 'Basketball' && (
                            <>
                              <th className="p-4 text-center">Points</th>
                              <th className="p-4 text-center">Rebounds</th>
                              <th className="p-4 text-center">Assists</th>
                              <th className="p-4 text-center">Steals</th>
                              <th className="p-4 text-center">Blocks</th>
                            </>
                          )}
                          {['Tennis', 'Pickleball', 'Volleyball', 'Badminton', 'Table Tennis'].includes(statsSport) && (
                            <>
                              <th className="p-4 text-center">Points</th>
                              <th className="p-4 text-center">Sets Won</th>
                              <th className="p-4 text-center">Sets Lost</th>
                            </>
                          )}
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {usersList.length === 0 ? (
                          <tr>
                            <td colSpan={12} className="p-8 text-center text-slate-400 font-medium">No user profiles to load.</td>
                          </tr>
                        ) : (
                          usersList.map((u) => {
                            const pStats = statsMap[u.id] || {
                              matches: 0, runs: 0, wickets: 0, highest_score: 0, best_bowling: '-', average: 0, strike_rate: 0, economy: 0,
                              goals: 0, assists: 0, cleanSheets: 0, yellowCards: 0, redCards: 0,
                              points: 0, rebounds: 0, steals: 0, blocks: 0, setsWon: 0, setsLost: 0
                            };
                            return (
                              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4">
                                  <div className="font-bold text-slate-900">{u.name}</div>
                                  <div className="text-xs text-slate-400 mt-0.5">{u.cricket_role || 'User'}</div>
                                </td>
                                <td className="p-4 text-center font-bold text-slate-700">{pStats.matches || 0}</td>
                                
                                {statsSport === 'Cricket' && (
                                  <>
                                    <td className="p-4 text-center font-bold text-blue-600">{pStats.runs || 0}</td>
                                    <td className="p-4 text-center font-bold text-emerald-600">{pStats.wickets || 0}</td>
                                    <td className="p-4 text-center font-medium text-slate-600">{pStats.highest_score || 0}</td>
                                    <td className="p-4 text-center font-medium text-slate-600">{pStats.best_bowling || '-'}</td>
                                    <td className="p-4 text-center font-medium text-slate-600">{pStats.average || 0}</td>
                                    <td className="p-4 text-center font-medium text-slate-600">{pStats.strike_rate || 0}</td>
                                  </>
                                )}

                                {(statsSport === 'Football' || statsSport === 'Hockey') && (
                                  <>
                                    <td className="p-4 text-center font-bold text-blue-600">{pStats.goals || 0}</td>
                                    <td className="p-4 text-center font-bold text-purple-600">{pStats.assists || 0}</td>
                                    <td className="p-4 text-center font-bold text-emerald-600">{pStats.cleanSheets || 0}</td>
                                    <td className="p-4 text-center font-medium text-amber-600">{pStats.yellowCards || 0}</td>
                                    <td className="p-4 text-center font-medium text-rose-600">{pStats.redCards || 0}</td>
                                  </>
                                )}

                                {statsSport === 'Basketball' && (
                                  <>
                                    <td className="p-4 text-center font-bold text-blue-600">{pStats.points || 0}</td>
                                    <td className="p-4 text-center font-medium text-orange-600">{pStats.rebounds || 0}</td>
                                    <td className="p-4 text-center font-medium text-purple-600">{pStats.assists || 0}</td>
                                    <td className="p-4 text-center font-medium text-emerald-600">{pStats.steals || 0}</td>
                                    <td className="p-4 text-center font-medium text-rose-600">{pStats.blocks || 0}</td>
                                  </>
                                )}

                                {['Tennis', 'Pickleball', 'Volleyball', 'Badminton', 'Table Tennis'].includes(statsSport) && (
                                  <>
                                    <td className="p-4 text-center font-bold text-blue-600">{pStats.points || 0}</td>
                                    <td className="p-4 text-center font-bold text-emerald-600">{pStats.setsWon || 0}</td>
                                    <td className="p-4 text-center font-medium text-rose-600">{pStats.setsLost || 0}</td>
                                  </>
                                )}

                                <td className="p-4 text-right">
                                  <button 
                                    onClick={() => setEditingStats({ id: u.id, ...pStats })}
                                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold rounded-lg text-xs flex items-center gap-1.5 ml-auto"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                    Modify Stats
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TABS - TOURNAMENTS & SEGMENTS VIEW */}
            {activeTab === 'tournaments_segments' && (
              <div className="space-y-6" id="tournaments_segments_tab_content">
                {/* Header card with Sport Selection Tabs/Dropdown and Sub-tab toggle */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Tournaments & Video Segment Hub</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Manage tournament structures, fixtures, and synchronized match video clip segments.</p>
                  </div>
                  
                  {/* Sport Picker Tabs & Custom Input */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 items-center">
                      {['Cricket', 'Football', 'Tennis', 'Basketball', 'Badminton'].map(sport => (
                        <button
                          key={sport}
                          type="button"
                          onClick={() => {
                            setSelectedSport(sport);
                            setNewTournament(prev => ({ ...prev, sport_type: sport }));
                            setNewMatch(prev => ({ ...prev, sport_type: sport }));
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            selectedSport === sport
                              ? 'bg-[#d11a2a] text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          {sport}
                        </button>
                      ))}
                      
                      <select
                        value={['Cricket', 'Football', 'Tennis', 'Basketball', 'Badminton'].includes(selectedSport) ? '' : (['Pickleball', 'Hockey', 'Volleyball', 'Table Tennis', 'Squash', 'Rugby', 'Kabaddi', 'Golf', 'Chess', 'Esports', 'Wrestling', 'Athletics'].includes(selectedSport) ? selectedSport : 'Custom')}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val && val !== 'Custom') {
                            setSelectedSport(val);
                            setNewTournament(prev => ({ ...prev, sport_type: val }));
                            setNewMatch(prev => ({ ...prev, sport_type: val }));
                          } else if (val === 'Custom') {
                            setSelectedSport('Custom');
                          }
                        }}
                        className="bg-white border-0 text-slate-800 text-xs font-bold rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-[#d11a2a]"
                      >
                        <option value="">More Sports...</option>
                        {['Pickleball', 'Hockey', 'Volleyball', 'Table Tennis', 'Squash', 'Rugby', 'Kabaddi', 'Golf', 'Chess', 'Esports', 'Wrestling', 'Athletics'].map(sport => (
                          <option key={sport} value={sport}>{sport}</option>
                        ))}
                        <option value="Custom">✍️ Type Custom...</option>
                      </select>

                      {(!['Cricket', 'Football', 'Tennis', 'Basketball', 'Badminton', 'Pickleball', 'Hockey', 'Volleyball', 'Table Tennis', 'Squash', 'Rugby', 'Kabaddi', 'Golf', 'Chess', 'Esports', 'Wrestling', 'Athletics'].includes(selectedSport) || selectedSport === 'Custom') && (
                        <input
                          type="text"
                          placeholder="Type custom sport/game"
                          value={selectedSport === 'Custom' ? '' : selectedSport}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedSport(val || 'Custom');
                            setNewTournament(prev => ({ ...prev, sport_type: val || 'Custom' }));
                            setNewMatch(prev => ({ ...prev, sport_type: val || 'Custom' }));
                          }}
                          className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#d11a2a] w-36 bg-white text-slate-800"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Content Area - Split or Subtab */}
                <div className="flex gap-4 border-b border-slate-200 pb-1">
                  <button
                    type="button"
                    onClick={() => setActiveSportSubTab('tournaments')}
                    className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
                      activeSportSubTab === 'tournaments'
                        ? 'border-[#d11a2a] text-[#d11a2a]'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Trophy className="w-4 h-4" />
                    {selectedSport} Tournaments ({tournaments.filter(t => (t.sport_type || 'Cricket') === selectedSport).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSportSubTab('segments')}
                    className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
                      activeSportSubTab === 'segments'
                        ? 'border-[#d11a2a] text-[#d11a2a]'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Film className="w-4 h-4" />
                    {selectedSport} Video Match Segments ({matches.filter(m => (m.sport_type || 'Cricket') === selectedSport).length})
                  </button>
                </div>

                {/* TOURNAMENTS SECTION */}
                {activeSportSubTab === 'tournaments' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="text-sm font-semibold text-slate-700">Active leagues and tournaments for {selectedSport}</div>
                      <button
                        type="button"
                        onClick={() => {
                          setNewTournament({
                            name: '', location: '', date: '', teamsCount: 8,
                            sport_type: selectedSport, format: 'League', ball_type: 'Leather', entryFee: 1000
                          });
                          setIsNewTournamentModalOpen(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Create {selectedSport} Tournament
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tournaments.filter(t => (t.sport_type || 'Cricket') === selectedSport).length === 0 ? (
                        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center col-span-2 text-slate-500">
                          <Trophy className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                          <div className="font-semibold text-sm">No tournaments registered for {selectedSport} yet.</div>
                          <p className="text-xs text-slate-400 mt-1">Create a new tournament using the button above to seed the system.</p>
                        </div>
                      ) : (
                        tournaments
                          .filter(t => (t.sport_type || 'Cricket') === selectedSport)
                          .map((tour: any) => (
                            <div key={tour.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
                              <div>
                                <div className="flex justify-between items-start">
                                  <h4 className="font-bold text-slate-900 text-base">{tour.name}</h4>
                                  <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${
                                    tour.status === 'Completed' ? 'bg-slate-100 text-slate-600' :
                                    tour.status === 'Ongoing' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    {tour.status || 'Upcoming'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-3 text-xs text-slate-500">
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{tour.location || 'Not Specified'}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{tour.date || 'TBD'}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{tour.teamsCount || 0} Registered Teams</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Fee: ₹{tour.entryFee || 0}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2 border-t border-slate-100 pt-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTournament(tour);
                                  }}
                                  className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-1"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  Edit Tournament
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTournament(tour.id)}
                                  className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-rose-700 transition-all flex items-center justify-center"
                                  title="Delete Tournament"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}

                {/* SEGMENTS / MATCH FEEDS SECTION */}
                {activeSportSubTab === 'segments' && (
                  <div className="space-y-4">
                    {selectedMatchForSegments ? (
                      /* Active Video Segment/Delivery List Editor for a Specific Match */
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                          <button
                            type="button"
                            onClick={() => setSelectedMatchForSegments(null)}
                            className="flex items-center gap-1 text-xs font-bold text-[#d11a2a] hover:underline"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Back to Matches List
                          </button>
                          <div className="text-right">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Currently Segmenting</span>
                            <span className="font-bold text-slate-800 text-sm">{selectedMatchForSegments.title}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                          <div>
                            <span className="font-bold text-slate-700 text-sm">Synchronized Playback Clip Segments</span>
                            <p className="text-[11px] text-slate-400 mt-0.5">Admin-curated timelines. Users see these as replay/analysis markers in their match centers.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSegment({
                                over: 1, ball: 1, startTime: 0, endTime: 10,
                                ballOutcome: selectedSport === 'Cricket' ? '4 Runs' : (selectedSport === 'Football' ? 'Goal' : 'Ace'),
                                runs: selectedSport === 'Cricket' ? 4 : (selectedSport === 'Football' ? 1 : 0),
                                wicket: false, bowler: '', batsman: '', description: ''
                              });
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#d11a2a] hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Clip Segment
                          </button>
                        </div>

                        {/* List of Deliveries/Segments */}
                        <div className="space-y-3">
                          {(!selectedMatchForSegments.deliveries || selectedMatchForSegments.deliveries.length === 0) ? (
                            <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg bg-slate-50">
                              No key video segment markers configured for this match. Click "Add Clip Segment" to configure timestamp coordinates.
                            </div>
                          ) : (
                            selectedMatchForSegments.deliveries.map((seg: any, idx: number) => (
                              <div key={seg.id || idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 gap-3 transition-colors">
                                <div className="space-y-1.5 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase rounded">
                                      {seg.ballOutcome || 'Action'}
                                    </span>
                                    {selectedSport === 'Cricket' && (
                                      <span className="text-xs font-bold text-slate-500">
                                        Over {seg.over}.{seg.ball} &bull; {seg.runs} Runs
                                      </span>
                                    )}
                                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 bg-slate-200 px-2 py-0.5 rounded text-[10px]">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      {seg.startTime}s - {seg.endTime}s ({seg.endTime - seg.startTime}s duration)
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-700 font-medium">
                                    {seg.description || 'No description provided.'}
                                  </div>
                                  {(seg.batsman || seg.bowler) && (
                                    <div className="text-[10px] text-slate-400">
                                      {seg.batsman && <span>Batsman/User: <strong>{seg.batsman}</strong></span>}
                                      {seg.batsman && seg.bowler && <span> &bull; </span>}
                                      {seg.bowler && <span>Bowler/Opponent: <strong>{seg.bowler}</strong></span>}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                  <button
                                    type="button"
                                    onClick={() => setEditingSegment(seg)}
                                    className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 transition-all flex items-center gap-1"
                                  >
                                    <Edit className="w-3 h-3" />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSegment(seg.id)}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-rose-600 transition-all"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ) : (
                      /* List of Matches/Streams */
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <div className="text-sm font-semibold text-slate-700">Video streaming feeds and match recordings for {selectedSport}</div>
                          <button
                            type="button"
                            onClick={() => {
                              setNewMatch({
                                title: '', team_a: '', team_b: '', venue: '', sport_type: selectedSport, status: 'Ongoing', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 120
                              });
                              setIsNewMatchModalOpen(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#d11a2a] hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all"
                          >
                            <Plus className="w-4 h-4" />
                            Add Match Video Feed
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          {matches.filter(m => (m.sport_type || 'Cricket') === selectedSport).length === 0 ? (
                            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
                              <Film className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                              <div className="font-semibold text-sm">No matches found for {selectedSport}.</div>
                              <p className="text-xs text-slate-400 mt-1">Create a new match video stream feed above to populate key segments.</p>
                            </div>
                          ) : (
                            matches
                              .filter(m => (m.sport_type || 'Cricket') === selectedSport)
                              .map((match: any) => (
                                <div key={match.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-bold text-slate-900 text-base">{match.title || `${match.team_a} vs ${match.team_b}`}</h4>
                                      <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded ${
                                        match.status === 'Completed' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'
                                      }`}>
                                        {match.status || 'Ongoing'}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                                      <div className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{match.venue || 'Local Stadium'}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <Film className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{(match.deliveries || []).length} Video Clip Segments</span>
                                      </div>
                                    </div>
                                    <div className="text-[11px] text-slate-400 font-mono truncate max-w-lg bg-slate-50 px-2 py-1 rounded border border-slate-100 mt-1">
                                      URL: {match.videoUrl || 'Internal Media Upload'}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedMatchForSegments(match)}
                                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                                    >
                                      <Film className="w-3.5 h-3.5" />
                                      Manage Segments ({(match.deliveries || []).length})
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingMatch(match)}
                                      className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-lg transition-all"
                                      title="Edit Feed Details"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMatch(match.id)}
                                      className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-lg transition-all"
                                      title="Delete Match Feed"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'sports_management' && (
              <SportsManagement supportedSports={supportedSports} setSupportedSports={setSupportedSports} />
            )}
          </>
        )}
      </div>

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4" id="edit_user_modal">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#d11a2a]" />
                <h3 className="font-bold text-lg">Modify User Profile</h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name (Username)</label>
                <input 
                  type="text" 
                  value={editingUser.name || ''} 
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={editingUser.email || ''} 
                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mobile Contact</label>
                  <input 
                    type="text" 
                    value={editingUser.phone || ''} 
                    onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cricket Role / Sub-Sport</label>
                  <select 
                    value={editingUser.cricket_role || 'Batsman'} 
                    onChange={e => setEditingUser({ ...editingUser, cricket_role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                  >
                    <option value="Batsman">Batsman</option>
                    <option value="Bowler">Bowler</option>
                    <option value="All-Rounder">All-Rounder</option>
                    <option value="Wicketkeeper">Wicketkeeper</option>
                    <option value="Coach">Coach</option>
                    <option value="Umpire">Umpire</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date of Birth</label>
                  <input 
                    type="date" 
                    value={editingUser.date_of_birth || ''} 
                    onChange={e => setEditingUser({ ...editingUser, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col gap-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <div>
                      <div className="text-sm font-bold text-slate-900">PRO Membership Status</div>
                      <div className="text-xs text-slate-500">Unlocks Premium visual analytics tools.</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setEditingUser({ ...editingUser, is_pro: !editingUser.is_pro })}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                      editingUser.is_pro 
                        ? 'bg-amber-500 text-white shadow-sm' 
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {editingUser.is_pro ? 'PRO SUBSCRIBER' : 'FREE USER'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#d11a2a]" />
                    <div>
                      <div className="text-sm font-bold text-slate-900">Administrative Privileges</div>
                      <div className="text-xs text-slate-500">Grants database access across collections.</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setEditingUser({ ...editingUser, role: editingUser.role === 'admin' ? 'user' : 'admin' })}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                      editingUser.role === 'admin' 
                        ? 'bg-[#d11a2a] text-white shadow-sm' 
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {editingUser.role === 'admin' ? 'SYSTEM ADMIN' : 'STANDARD USER'}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-150 flex gap-3">
              <button 
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-sm transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveUser}
                className="flex-1 py-2 bg-[#d11a2a] hover:bg-[#b01420] text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-[#d11a2a]/10"
              >
                Save Record Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STATS MODAL */}
      {editingStats && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4" id="edit_stats_modal">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-lg">Modify User Performance Stats</h3>
              </div>
              <button onClick={() => setEditingStats(null)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-2 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase block">Current Editing Sport</span>
                  <span className="text-sm font-bold text-[#d11a2a]">{statsSport}</span>
                </div>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold uppercase">Multi-Sport Mode</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Matches Played (All Sports)</label>
                <input 
                  type="number" min="0"
                  value={editingStats.matches || 0} 
                  onChange={e => setEditingStats({ ...editingStats, matches: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                />
              </div>

              {statsSport === 'Cricket' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Career Runs</label>
                      <input 
                        type="number" min="0"
                        value={editingStats.runs || 0} 
                        onChange={e => setEditingStats({ ...editingStats, runs: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Career Wickets</label>
                      <input 
                        type="number" min="0"
                        value={editingStats.wickets || 0} 
                        onChange={e => setEditingStats({ ...editingStats, wickets: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Highest Score</label>
                      <input 
                        type="number" min="0"
                        value={editingStats.highest_score || 0} 
                        onChange={e => setEditingStats({ ...editingStats, highest_score: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Best Bowling Figure</label>
                      <input 
                        type="text" 
                        value={editingStats.best_bowling || ''} 
                        onChange={e => setEditingStats({ ...editingStats, best_bowling: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                        placeholder="e.g. 5/12"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Batting Average</label>
                      <input 
                        type="number" step="0.01" min="0"
                        value={editingStats.average || 0} 
                        onChange={e => setEditingStats({ ...editingStats, average: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Batting Strike Rate</label>
                      <input 
                        type="number" step="0.01" min="0"
                        value={editingStats.strike_rate || 0} 
                        onChange={e => setEditingStats({ ...editingStats, strike_rate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bowling Economy</label>
                      <input 
                        type="number" step="0.01" min="0"
                        value={editingStats.economy || 0} 
                        onChange={e => setEditingStats({ ...editingStats, economy: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              {(statsSport === 'Football' || statsSport === 'Hockey') && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Career Goals</label>
                      <input 
                        type="number" min="0"
                        value={editingStats.goals || 0} 
                        onChange={e => setEditingStats({ ...editingStats, goals: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Career Assists</label>
                      <input 
                        type="number" min="0"
                        value={editingStats.assists || 0} 
                        onChange={e => setEditingStats({ ...editingStats, assists: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Clean Sheets</label>
                      <input 
                        type="number" min="0"
                        value={editingStats.cleanSheets || 0} 
                        onChange={e => setEditingStats({ ...editingStats, cleanSheets: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Yellow Cards</label>
                      <input 
                        type="number" min="0"
                        value={editingStats.yellowCards || 0} 
                        onChange={e => setEditingStats({ ...editingStats, yellowCards: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Red Cards</label>
                      <input 
                        type="number" min="0"
                        value={editingStats.redCards || 0} 
                        onChange={e => setEditingStats({ ...editingStats, redCards: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              {statsSport === 'Basketball' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Points Scored</label>
                      <input 
                        type="number" min="0"
                        value={editingStats.points || 0} 
                        onChange={e => setEditingStats({ ...editingStats, points: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Career Rebounds</label>
                      <input 
                        type="number" min="0"
                        value={editingStats.rebounds || 0} 
                        onChange={e => setEditingStats({ ...editingStats, rebounds: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assists</label>
                      <input 
                        type="number" min="0"
                        value={editingStats.assists || 0} 
                        onChange={e => setEditingStats({ ...editingStats, assists: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Steals</label>
                      <input 
                        type="number" min="0"
                        value={editingStats.steals || 0} 
                        onChange={e => setEditingStats({ ...editingStats, steals: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Blocks</label>
                      <input 
                        type="number" min="0"
                        value={editingStats.blocks || 0} 
                        onChange={e => setEditingStats({ ...editingStats, blocks: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              {['Tennis', 'Pickleball', 'Volleyball', 'Badminton', 'Table Tennis'].includes(statsSport) && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Points Scored</label>
                      <input 
                        type="number" min="0"
                        value={editingStats.points || 0} 
                        onChange={e => setEditingStats({ ...editingStats, points: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sets Won</label>
                      <input 
                        type="number" min="0"
                        value={editingStats.setsWon || 0} 
                        onChange={e => setEditingStats({ ...editingStats, setsWon: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sets Lost</label>
                      <input 
                        type="number" min="0"
                        value={editingStats.setsLost || 0} 
                        onChange={e => setEditingStats({ ...editingStats, setsLost: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-150 flex gap-3">
              <button 
                onClick={() => setEditingStats(null)}
                className="flex-1 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-sm transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveStats}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-600/10"
              >
                Save Stats changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL TRANSACTION / COMP OFF SUBSCRIPTION MODAL */}
      {isNewTxModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4" id="manual_tx_modal">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-lg">Manually Issue PRO Access</h3>
              </div>
              <button onClick={() => setIsNewTxModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Select User</label>
                <select 
                  value={newTransactionUser}
                  onChange={e => setNewTransactionUser(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm bg-white"
                >
                  <option value="">-- Choose User --</option>
                  {usersList.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email || u.phone || 'No Contact'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Recorded Subscription Fee (INR)</label>
                <input 
                  type="number" min="0"
                  value={newTransactionAmount}
                  onChange={e => setNewTransactionAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>This creates a completed payment entry in the audit database and automatically grants the user lifetime or active PRO status with no external gateway payment required.</div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-150 flex gap-3">
              <button 
                onClick={() => setIsNewTxModalOpen(false)}
                className="flex-1 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-sm transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddManualTransaction}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-emerald-600/10"
              >
                Issue Free Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE/EDIT TOURNAMENT MODAL */}
      {(isNewTournamentModalOpen || editingTournament) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4" id="tournament_form_modal">
          <form 
            onSubmit={handleSaveTournament}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
          >
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-lg">{editingTournament ? 'Edit' : 'Create'} {selectedSport} Tournament</h3>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsNewTournamentModalOpen(false);
                  setEditingTournament(null);
                }} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tournament Name</label>
                <input 
                  type="text" required
                  placeholder="e.g. Summer Premier League"
                  value={editingTournament ? editingTournament.name : newTournament.name}
                  onChange={e => editingTournament 
                    ? setEditingTournament({ ...editingTournament, name: e.target.value })
                    : setNewTournament({ ...newTournament, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Location / Venue</label>
                  <input 
                    type="text"
                    placeholder="e.g. Kolkata Ground"
                    value={editingTournament ? (editingTournament.location || '') : newTournament.location}
                    onChange={e => editingTournament
                      ? setEditingTournament({ ...editingTournament, location: e.target.value })
                      : setNewTournament({ ...newTournament, location: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Start Date</label>
                  <input 
                    type="date"
                    value={editingTournament ? (editingTournament.date || '') : newTournament.date}
                    onChange={e => editingTournament
                      ? setEditingTournament({ ...editingTournament, date: e.target.value })
                      : setNewTournament({ ...newTournament, date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Teams Count</label>
                  <input 
                    type="number" min="2"
                    value={editingTournament ? (editingTournament.teamsCount || 4) : newTournament.teamsCount}
                    onChange={e => editingTournament
                      ? setEditingTournament({ ...editingTournament, teamsCount: parseInt(e.target.value) || 4 })
                      : setNewTournament({ ...newTournament, teamsCount: parseInt(e.target.value) || 4 })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Format</label>
                  <select 
                    value={editingTournament ? (editingTournament.format || 'League') : newTournament.format}
                    onChange={e => editingTournament
                      ? setEditingTournament({ ...editingTournament, format: e.target.value })
                      : setNewTournament({ ...newTournament, format: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm bg-white"
                  >
                    <option value="League">League</option>
                    <option value="Knockout">Knockout</option>
                    <option value="Group + Knockout">Group + Knockout</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Entry Fee (INR)</label>
                  <input 
                    type="number" min="0"
                    value={editingTournament ? (editingTournament.entryFee || 0) : newTournament.entryFee}
                    onChange={e => editingTournament
                      ? setEditingTournament({ ...editingTournament, entryFee: parseInt(e.target.value) || 0 })
                      : setNewTournament({ ...newTournament, entryFee: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tournament Status</label>
                <select 
                  value={editingTournament ? (editingTournament.status || 'Upcoming') : 'Upcoming'}
                  onChange={e => editingTournament && setEditingTournament({ ...editingTournament, status: e.target.value })}
                  disabled={!editingTournament}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm bg-white"
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-150 flex gap-3">
              <button 
                type="button"
                onClick={() => {
                  setIsNewTournamentModalOpen(false);
                  setEditingTournament(null);
                }}
                className="flex-1 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-sm transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-600/10"
              >
                Save Tournament
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE/EDIT MATCH MODAL */}
      {(isNewMatchModalOpen || editingMatch) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4" id="match_form_modal">
          <form 
            onSubmit={handleSaveMatch}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
          >
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-lg">{editingMatch ? 'Edit' : 'Create'} {selectedSport} Match Feed</h3>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsNewMatchModalOpen(false);
                  setEditingMatch(null);
                }} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Match Title / Header</label>
                <input 
                  type="text" required
                  placeholder="e.g. Mumbai Warriors vs Delhi Lions"
                  value={editingMatch ? editingMatch.title : newMatch.title}
                  onChange={e => editingMatch 
                    ? setEditingMatch({ ...editingMatch, title: e.target.value })
                    : setNewMatch({ ...newMatch, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Team A</label>
                  <input 
                    type="text" required
                    placeholder="Team A Name"
                    value={editingMatch ? editingMatch.team_a : newMatch.team_a}
                    onChange={e => editingMatch
                      ? setEditingMatch({ ...editingMatch, team_a: e.target.value })
                      : setNewMatch({ ...newMatch, team_a: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Team B</label>
                  <input 
                    type="text" required
                    placeholder="Team B Name"
                    value={editingMatch ? editingMatch.team_b : newMatch.team_b}
                    onChange={e => editingMatch
                      ? setEditingMatch({ ...editingMatch, team_b: e.target.value })
                      : setNewMatch({ ...newMatch, team_b: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Venue / Ground</label>
                  <input 
                    type="text"
                    placeholder="e.g. Wankhede Stadium"
                    value={editingMatch ? (editingMatch.venue || '') : newMatch.venue}
                    onChange={e => editingMatch
                      ? setEditingMatch({ ...editingMatch, venue: e.target.value })
                      : setNewMatch({ ...newMatch, venue: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Video Stream/Clip URL</label>
                  <input 
                    type="text" required
                    placeholder="e.g. https://domain.com/video.mp4"
                    value={editingMatch ? (editingMatch.videoUrl || '') : newMatch.videoUrl}
                    onChange={e => editingMatch
                      ? setEditingMatch({ ...editingMatch, videoUrl: e.target.value })
                      : setNewMatch({ ...newMatch, videoUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Match Status</label>
                  <select 
                    value={editingMatch ? (editingMatch.status || 'Ongoing') : newMatch.status}
                    onChange={e => editingMatch
                      ? setEditingMatch({ ...editingMatch, status: e.target.value })
                      : setNewMatch({ ...newMatch, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm bg-white"
                  >
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Video Duration (seconds)</label>
                  <input 
                    type="number" min="10"
                    value={editingMatch ? (editingMatch.duration || 120) : newMatch.duration}
                    onChange={e => editingMatch
                      ? setEditingMatch({ ...editingMatch, duration: parseInt(e.target.value) || 120 })
                      : setNewMatch({ ...newMatch, duration: parseInt(e.target.value) || 120 })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-150 flex gap-3">
              <button 
                type="button"
                onClick={() => {
                  setIsNewMatchModalOpen(false);
                  setEditingMatch(null);
                }}
                className="flex-1 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-sm transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-600/10"
              >
                Save Match Feed
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE/EDIT SEGMENT MODAL */}
      {editingSegment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4" id="segment_form_modal">
          <form 
            onSubmit={handleSaveSegment}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
          >
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-lg">{editingSegment.id ? 'Edit' : 'Create'} Video Segment Marker</h3>
              </div>
              <button 
                type="button"
                onClick={() => setEditingSegment(null)} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Start Time (seconds)</label>
                  <input 
                    type="number" required min="0" step="0.1"
                    placeholder="e.g. 10.5"
                    value={editingSegment.startTime || 0}
                    onChange={e => setEditingSegment({ ...editingSegment, startTime: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">End Time (seconds)</label>
                  <input 
                    type="number" required min="1" step="0.1"
                    placeholder="e.g. 18.2"
                    value={editingSegment.endTime || 0}
                    onChange={e => setEditingSegment({ ...editingSegment, endTime: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Outcome / Event Label</label>
                  <input 
                    type="text" required
                    placeholder="e.g. Goal, 4 Runs, Wicket, Ace"
                    value={editingSegment.ballOutcome || ''}
                    onChange={e => setEditingSegment({ ...editingSegment, ballOutcome: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Action Points/Runs</label>
                  <input 
                    type="number" min="0"
                    value={editingSegment.runs || 0}
                    onChange={e => setEditingSegment({ ...editingSegment, runs: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                  />
                </div>
              </div>

              {selectedSport === 'Cricket' && (
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Batsman Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Rohit S."
                      value={editingSegment.batsman || ''}
                      onChange={e => setEditingSegment({ ...editingSegment, batsman: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Over No.</label>
                    <input 
                      type="number" min="1"
                      value={editingSegment.over || 1}
                      onChange={e => setEditingSegment({ ...editingSegment, over: parseInt(e.target.value) || 1 })}
                      className="w-full px-2 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ball No.</label>
                    <input 
                      type="number" min="1" max="6"
                      value={editingSegment.ball || 1}
                      onChange={e => setEditingSegment({ ...editingSegment, ball: parseInt(e.target.value) || 1 })}
                      className="w-full px-2 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                    />
                  </div>
                </div>
              )}

              {selectedSport === 'Cricket' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Bowler Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Jasprit B."
                      value={editingSegment.bowler || ''}
                      onChange={e => setEditingSegment({ ...editingSegment, bowler: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={editingSegment.wicket || false}
                        onChange={e => setEditingSegment({ ...editingSegment, wicket: e.target.checked })}
                        className="rounded border-slate-300 text-[#d11a2a] focus:ring-[#d11a2a] w-4 h-4"
                      />
                      <span className="text-xs font-bold text-slate-700">Wicket Fall</span>
                    </label>
                  </div>
                </div>
              )}

              {selectedSport !== 'Cricket' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Associated Player</label>
                  <input 
                    type="text"
                    placeholder="e.g. Sunil Chhetri / Roger Federer"
                    value={editingSegment.batsman || ''}
                    onChange={e => setEditingSegment({ ...editingSegment, batsman: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Detailed Description / Commentary</label>
                <textarea 
                  rows={2}
                  placeholder="e.g. Brilliant shot over long-on for a six!"
                  value={editingSegment.description || ''}
                  onChange={e => setEditingSegment({ ...editingSegment, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-150 flex gap-3">
              <button 
                type="button"
                onClick={() => setEditingSegment(null)}
                className="flex-1 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-sm transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-600/10"
              >
                Save Segment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
