import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, BarChart3, Filter, Trophy, Activity, ChevronRight, Download, Calendar, Target, Zap, Users, Plus, Upload, MoreVertical, Shield, Search, X, MapPin, Trash2, Edit3, PieChart, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ProBadge } from '../components/ProBadge';

interface ProDashboardProps {
  onBack: () => void;
}

export const ProDashboard: React.FC<ProDashboardProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'analytics' | 'tournaments' | 'career' | 'teams'>('analytics');
  const [teams, setTeams] = React.useState<any[]>([]);
  const [showCreateTeam, setShowCreateTeam] = React.useState(false);
  const [newTeamName, setNewTeamName] = React.useState('');
  const [newTeamLogo, setNewTeamLogo] = React.useState('');
  const [stats, setStats] = React.useState<any>(null);
  const [tournaments, setTournaments] = React.useState<any[]>([]);

  // Add Member Modal State
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('Player');

  // Weakness Analysis Modal State
  const [showWeaknessModal, setShowWeaknessModal] = useState(false);

  // Goal Tracker State
  const [seasonGoal, setSeasonGoal] = useState<number>(() => {
    return Number(localStorage.getItem('pro_season_goal')) || 1000;
  });
  const [showEditGoalModal, setShowEditGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState(seasonGoal.toString());

  // Pro Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');
  const [formatFilter, setFormatFilter] = useState('All');
  
  React.useEffect(() => {
    import('../lib/database').then(({ dbService }) => {
      if (user?.uid) {
        dbService.subscribe('teams', { owner_id: user.uid }, (data) => {
          setTeams(data || []);
        });
        dbService.subscribe('tournaments', {}, (data) => {
          setTournaments(data || []);
        });
        dbService.get('performance_stats', user.uid).then(data => {
          setStats(data || {});
        });
      }
    });
  }, [user]);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    const { dbService } = await import('../lib/database');
    await dbService.create('teams', {
      name: newTeamName,
      logo: newTeamLogo,
      owner_id: user?.uid,
      members: [{ id: user?.uid, role: 'Admin', name: user?.displayName || 'Me' }],
      created_at: new Date().toISOString()
    });
    setNewTeamName('');
    setNewTeamLogo('');
    setShowCreateTeam(false);
  };

  const handleAddMember = async () => {
    if (!memberName.trim() || !selectedTeamId) return;
    const team = teams.find(t => t.id === selectedTeamId);
    if (!team) return;

    const { dbService } = await import('../lib/database');
    const updatedMembers = [
      ...(team.members || []),
      { id: `m_${Date.now()}`, name: memberName.trim(), role: memberRole }
    ];
    await dbService.update('teams', selectedTeamId, { members: updatedMembers });

    setMemberName('');
    setMemberRole('Player');
    setShowAddMember(false);
    setSelectedTeamId(null);
  };

  const handleRemoveMember = async (teamId: string, memberIndex: number) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    if (!confirm('Remove this member from the squad?')) return;

    const { dbService } = await import('../lib/database');
    const updatedMembers = [...(team.members || [])];
    updatedMembers.splice(memberIndex, 1);
    await dbService.update('teams', teamId, { members: updatedMembers });
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to delete "${teamName}"?`)) return;
    const { dbService } = await import('../lib/database');
    await dbService.remove('teams', teamId);
  };

  const handleDownloadReport = () => {
    const runs = stats?.runs || 0;
    const wickets = stats?.wickets || 0;
    const matches = stats?.matches || 0;
    const balls = stats?.balls || 0;
    const sr = balls > 0 ? ((runs / balls) * 100).toFixed(2) : '0.00';

    const csvContent = [
      ['Metric', 'Value'],
      ['Player Name', user?.displayName || 'Pro Athlete'],
      ['Total Matches', matches],
      ['Total Runs Scored', runs],
      ['Total Wickets Taken', wickets],
      ['Strike Rate', sr],
      ['Consistency Index', `${stats?.consistency || 85}/100`],
      ['Highest Score', stats?.highestScore || 0],
      ['Generated On', new Date().toLocaleDateString()]
    ].map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Pro_Performance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveGoal = () => {
    const val = parseInt(goalInput) || 1000;
    setSeasonGoal(val);
    localStorage.setItem('pro_season_goal', val.toString());
    setShowEditGoalModal(false);
  };

  const filteredTournaments = tournaments.filter(t => {
    const matchesSearch = !searchQuery || (t.name && t.name.toLowerCase().includes(searchQuery.toLowerCase())) || (t.location && t.location.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLocation = locationFilter === 'All' || (t.location && t.location.toLowerCase().includes(locationFilter.toLowerCase()));
    const matchesFormat = formatFilter === 'All' || (t.sportType && t.sportType.toLowerCase() === formatFilter.toLowerCase()) || (t.format && t.format.toLowerCase() === formatFilter.toLowerCase());
    return matchesSearch && matchesLocation && matchesFormat;
  });

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Header */}
      <div className="bg-slate-900 text-white pt-12 pb-6 px-4 rounded-b-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <button onClick={onBack} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-wider">PRO HUB</span>
              <ProBadge className="ml-1" />
            </div>
            <div className="w-9"></div>
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.displayName || 'Pro User'}</h1>
          <p className="text-slate-400 text-sm">Your exclusive command center for advanced insights.</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex px-4 mt-6 mb-6 overflow-x-auto no-scrollbar space-x-2 pb-2">
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >
          <BarChart3 className="w-4 h-4 mr-2" /> Match Analytics
        </button>
        <button 
          onClick={() => setActiveTab('career')}
          className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'career' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >
          <TrendingUp className="w-4 h-4 mr-2" /> Career Trends
        </button>
        <button 
          onClick={() => setActiveTab('teams')}
          className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'teams' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >
          <Users className="w-4 h-4 mr-2" /> My Teams
        </button>
        <button 
          onClick={() => setActiveTab('tournaments')}
          className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'tournaments' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >
          <Filter className="w-4 h-4 mr-2" /> Pro Filters
        </button>
      </div>

      <div className="px-4 space-y-6">
        {/* Tab 1: Match Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-0"></div>
               <div className="relative z-10 flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Performance Index</h3>
                    <p className="text-slate-500 text-xs mt-1">Based on last 10 matches</p>
                  </div>
                  <div className="bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-lg flex items-center text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" /> {stats?.matches > 0 ? '+5%' : '+0%'}
                  </div>
               </div>
               <div className="flex items-end space-x-2 h-32 mt-6">
                  {(stats?.recentScores || [45, 62, 18, 85, 34, 72, 91, 28, 55, 68]).map((h: number, i: number) => (
                    <div key={i} className="flex-1 flex flex-col justify-end items-center group relative">
                      <div className="absolute -top-7 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded transition-opacity pointer-events-none z-20">
                        {h} runs
                      </div>
                      <div className="w-full bg-indigo-100 rounded-t-md group-hover:bg-indigo-200 transition-colors" style={{ height: `${Math.min(100, Math.max(15, h))}%` }}>
                         <div className="w-full bg-indigo-500 rounded-t-md group-hover:bg-indigo-600 transition-colors" style={{ height: `${Math.min(100, Math.max(10, h > 50 ? h - 20 : h))}%` }}></div>
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono mt-1">M{i+1}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center text-slate-500 mb-2">
                    <Activity className="w-4 h-4 mr-1.5 text-indigo-500" /> <span className="text-xs font-bold uppercase tracking-wider">Consistency</span>
                  </div>
                  <div className="text-2xl font-black text-slate-800">{stats?.consistency || 85}<span className="text-sm font-normal text-slate-500">/100</span></div>
               </div>
               <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center text-slate-500 mb-2">
                    <Zap className="w-4 h-4 mr-1.5 text-amber-500" /> <span className="text-xs font-bold uppercase tracking-wider">Strike Rate</span>
                  </div>
                  <div className="text-2xl font-black text-slate-800">{stats?.balls ? ((stats.runs || 0) / stats.balls * 100).toFixed(1) : (stats?.strikeRate || '138.4')}</div>
               </div>
            </div>

            <button 
              onClick={handleDownloadReport}
              className="w-full py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 flex items-center justify-center hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 mr-2 text-indigo-600" /> Download Full Performance Report (CSV)
            </button>
          </div>
        )}

        {/* Tab 2: Career Trends */}
        {activeTab === 'career' && (
          <div className="space-y-4">
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                 <h3 className="font-bold text-slate-800">Career Trajectory & Insights</h3>
               </div>
               <div className="p-4 divide-y divide-slate-100">
                  <div className="py-3 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800 text-sm mb-0.5">Runs Prediction</div>
                      <div className="text-xs text-slate-500">Next 5 matches expected average</div>
                    </div>
                    <div className="font-black text-lg text-indigo-600">{stats?.matches ? ((stats.runs || 0) / stats.matches).toFixed(1) : '42.5'}</div>
                  </div>
                  <div className="py-3 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800 text-sm mb-0.5">Form Status</div>
                      <div className="text-xs text-slate-500">Based on recent impact</div>
                    </div>
                    <div className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">PEAKING FORM</div>
                  </div>
                  <div className="py-3 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800 text-sm mb-0.5">Weakness Analysis</div>
                      <div className="text-xs text-slate-500">Identified recurring dismissals & bowler types</div>
                    </div>
                    <button 
                      onClick={() => setShowWeaknessModal(true)}
                      className="flex items-center text-indigo-600 text-sm font-bold hover:text-indigo-800"
                    >
                      View <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
               </div>
             </div>

             <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg shadow-indigo-900/20">
               <div className="absolute right-0 bottom-0 opacity-10">
                 <Target className="w-32 h-32 transform translate-x-8 translate-y-8" />
               </div>
               <div className="relative z-10">
                 <div className="flex justify-between items-center mb-1">
                   <h3 className="font-bold text-lg flex items-center">
                     <Target className="w-4 h-4 mr-2 text-indigo-400" /> Season Goal Tracker
                   </h3>
                   <button 
                     onClick={() => { setGoalInput(seasonGoal.toString()); setShowEditGoalModal(true); }}
                     className="text-xs text-indigo-300 hover:text-white underline flex items-center font-bold"
                   >
                     <Edit3 className="w-3 h-3 mr-1" /> Set Goal
                   </button>
                 </div>
                 <p className="text-slate-300 text-xs mb-4">You are {Math.max(0, seasonGoal - (stats?.runs || 0))} runs away from your season target of {seasonGoal} runs.</p>
                 <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden mb-2">
                   <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, ((stats?.runs || 0) / seasonGoal) * 100)}%` }}></div>
                 </div>
                 <div className="flex justify-between text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                   <span>{stats?.runs || 0} Runs Achieved</span>
                   <span>Target: {seasonGoal} Runs</span>
                 </div>
               </div>
             </div>
          </div>
        )}

        {/* Tab 3: My Teams */}
        {activeTab === 'teams' && (
          <div className="space-y-4">
             <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <h3 className="font-bold text-slate-800">My Teams</h3>
                  <p className="text-xs text-slate-500 mt-1">Manage club-level organization & squads</p>
                </div>
                <button 
                  onClick={() => setShowCreateTeam(true)}
                  className="bg-indigo-600 text-white px-3 py-2 rounded-xl flex items-center text-xs font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
                >
                  <Plus className="w-4 h-4 mr-1" /> New Team
                </button>
             </div>
             
             {teams.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-indigo-500" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">No Teams Created Yet</h3>
                  <p className="text-sm text-slate-500 mb-6">Create a team to manage squad members, roles, and statistics.</p>
                  <button 
                    onClick={() => setShowCreateTeam(true)}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    Create Your First Team
                  </button>
                </div>
             ) : (
                <div className="space-y-4">
                  {teams.map(team => (
                    <div key={team.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                            {(team.logo || team.logoUrl) ? (
                              <img src={team.logo || team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                            ) : (
                              <Shield className="w-6 h-6 text-indigo-600" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800">{team.name}</h3>
                            <p className="text-xs text-slate-500">{team.members?.length || 0} Members in Squad</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteTeam(team.id, team.name)}
                          className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete Team"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Squad Members</h4>
                          <button 
                            onClick={() => {
                              setSelectedTeamId(team.id);
                              setShowAddMember(true);
                            }}
                            className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" /> Add Member
                          </button>
                        </div>
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {(team.members || []).map((m: any, i: number) => (
                            <div key={i} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <div className="flex items-center space-x-2.5">
                                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                  {(m.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-slate-800">{m.name}</div>
                                  <div className="text-[10px] text-slate-500">{m.role}</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <select 
                                  value={m.role}
                                  onChange={async (e) => {
                                    const { dbService } = await import('../lib/database');
                                    const updatedMembers = [...team.members];
                                    updatedMembers[i].role = e.target.value;
                                    await dbService.update('teams', team.id, { members: updatedMembers });
                                  }}
                                  className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:outline-none focus:border-indigo-500 shadow-sm"
                                >
                                  <option value="Admin">Admin</option>
                                  <option value="Captain">Captain</option>
                                  <option value="Vice Captain">Vice Captain</option>
                                  <option value="Player">Player</option>
                                  <option value="Wicketkeeper">Wicketkeeper</option>
                                  <option value="Bowler">Bowler</option>
                                  <option value="Coach">Coach</option>
                                </select>
                                <button 
                                  onClick={() => handleRemoveMember(team.id, i)}
                                  className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                                  title="Remove Member"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
             )}
          </div>
        )}

        {/* Tab 4: Pro Filters & Exclusive Tournaments */}
        {activeTab === 'tournaments' && (
          <div className="space-y-4">
             <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800">Advanced Radar & Pro Filters</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Filter premier tournaments matching your location & format</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Filter className="w-5 h-5" />
                  </div>
                </div>

                {/* Filter Controls */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tournament name or location..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Location</label>
                      <select 
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-bold focus:outline-none"
                      >
                        <option value="All">All Locations</option>
                        <option value="Local">Local Grounds</option>
                        <option value="National">National League</option>
                        <option value="Online">Online / Esports</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sport / Format</label>
                      <select 
                        value={formatFilter}
                        onChange={(e) => setFormatFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-bold focus:outline-none"
                      >
                        <option value="All">All Formats</option>
                        <option value="Cricket">Cricket</option>
                        <option value="Football">Football</option>
                        <option value="Basketball">Basketball</option>
                        <option value="Tennis">Tennis</option>
                      </select>
                    </div>
                  </div>
                </div>
             </div>
             
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 text-sm">Exclusive Pro Tournaments</h3>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-amber-200">Curated Feed</span>
                </div>
                <div className="p-4 space-y-4">
                  {filteredTournaments.length === 0 ? (
                    <div className="text-center py-8">
                      <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700">No matching tournaments found</p>
                      <p className="text-xs text-slate-500 mt-1">Try adjusting your radar search filters above.</p>
                    </div>
                  ) : filteredTournaments.map((t, i) => (
                    <div key={t.id || i} className="flex space-x-3 group cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                      <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 group-hover:border-indigo-300 transition-colors overflow-hidden">
                        {t.logo ? (
                          <img src={t.logo} alt={t.name} className="w-full h-full object-cover" />
                        ) : (
                          <Trophy className="w-6 h-6 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-600 transition-colors">{t.name || 'Pro Tournament'}</h4>
                          <span className="bg-indigo-50 text-indigo-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">PRO</span>
                        </div>
                        <div className="flex items-center text-xs text-slate-500 mt-1">
                          <MapPin className="w-3 h-3 mr-1 text-slate-400" /> {t.location || 'Local Arena'}
                        </div>
                        <div className="flex items-center text-xs text-slate-500 mt-1">
                          <Calendar className="w-3 h-3 mr-1 text-slate-400" /> {t.startDate ? new Date(t.startDate).toLocaleDateString() : 'Starts next week'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Modal: Create Team */}
      {showCreateTeam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-indigo-600" /> Create Team
              </h3>
              <button onClick={() => setShowCreateTeam(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Team Name</label>
                <input 
                  type="text" 
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Royal Strikers"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Team Logo (Optional)</label>
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative group">
                    {newTeamLogo ? (
                      <>
                        <img src={newTeamLogo} alt="Logo preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={() => setNewTeamLogo('')} className="text-white bg-red-500 rounded-full p-1"><X className="w-3 h-3" /></button>
                        </div>
                      </>
                    ) : (
                      <Upload className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1">
                     <input
                       type="file"
                       accept="image/*"
                       onChange={(e) => {
                         const file = e.target.files?.[0];
                         if (file) {
                           const reader = new FileReader();
                           reader.onloadend = () => {
                             setNewTeamLogo(reader.result as string);
                           };
                           reader.readAsDataURL(file);
                         }
                       }}
                       className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                     />
                     <p className="text-[10px] text-slate-400 mt-1">PNG, JPG up to 2MB</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex space-x-3">
              <button 
                onClick={() => setShowCreateTeam(false)}
                className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateTeam}
                disabled={!newTeamName.trim()}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Squad Member */}
      {showAddMember && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center text-sm">
                <Users className="w-4 h-4 mr-2 text-indigo-600" /> Add Squad Member
              </h3>
              <button onClick={() => setShowAddMember(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Player Name</label>
                <input 
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="e.g. Virat Kohli"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Squad Role</label>
                <select 
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="Player">Player</option>
                  <option value="Captain">Captain</option>
                  <option value="Vice Captain">Vice Captain</option>
                  <option value="Wicketkeeper">Wicketkeeper</option>
                  <option value="Bowler">Bowler</option>
                  <option value="Admin">Admin</option>
                  <option value="Coach">Coach</option>
                </select>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex space-x-2">
              <button 
                onClick={() => setShowAddMember(false)}
                className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddMember}
                disabled={!memberName.trim()}
                className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 disabled:opacity-50"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Weakness Analysis */}
      {showWeaknessModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-900 text-white">
              <h3 className="font-bold flex items-center text-sm">
                <PieChart className="w-4 h-4 mr-2 text-amber-400" /> Deep Weakness Analysis
              </h3>
              <button onClick={() => setShowWeaknessModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  Analysis indicates susceptibility to short-pitched deliveries outside off stump during early overs.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Dismissal Types Breakdown</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Caught (Outfield)', pct: 45, color: 'bg-indigo-500' },
                    { label: 'LBW (In-swinger)', pct: 25, color: 'bg-amber-500' },
                    { label: 'Bowled (Pace)', pct: 20, color: 'bg-rose-500' },
                    { label: 'Run Out', pct: 10, color: 'bg-slate-400' },
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{item.label}</span>
                        <span>{item.pct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.pct}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1.5" /> Recommended Drill
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Practice back-foot punches and soft hands against off-cutters to lower early dismissal risk by up to 35%.
                </p>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
              <button 
                onClick={() => setShowWeaknessModal(false)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-900"
              >
                Close Insights
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Season Goal */}
      {showEditGoalModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-xs rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Set Season Goal</h3>
              <button onClick={() => setShowEditGoalModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <label className="block text-xs font-bold text-slate-600">Target Season Runs</label>
              <input 
                type="number" 
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex space-x-2">
              <button 
                onClick={() => setShowEditGoalModal(false)}
                className="flex-1 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveGoal}
                className="flex-1 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
              >
                Save Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
