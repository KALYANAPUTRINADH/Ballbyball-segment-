import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, ChevronLeft, ChevronRight, Search, Activity, Shield, X, Lock, Crown } from 'lucide-react';
import { PaymentModal } from './PaymentModal';
import { TournamentBranding } from './TournamentBranding';

import { TournamentStatistics } from './TournamentStatistics';
import { TournamentAnalytics } from './TournamentAnalytics';
import { TournamentPerformance } from './TournamentPerformance';
import { ProUpgradeModal } from './ProUpgradeModal';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../lib/firebase';
import { dbService } from '../lib/database';

interface TournamentManagementProps {
  onBack: () => void;
  tournament?: any;
  tournamentName?: string;
  setFullScreenView?: (v: string | null) => void;
  onUpdate?: (updated: any) => void;
}

export function TournamentManagement({ onBack, tournament, tournamentName = "Winter Cup 2026", setFullScreenView, onUpdate }: TournamentManagementProps) {
  const [activeTab, setActiveTab] = useState('Info');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [isFollowing, setIsFollowing] = useState(false);
  const [payingTeam, setPayingTeam] = useState<string | null>(null);
  const [paidTeams, setPaidTeams] = useState<string[]>([]);
  const [schedulingMatch, setSchedulingMatch] = useState(false);
  
  useEffect(() => {
    if (tournament) {
      setEditForm({
        sport_type: tournament.sport_type || 'Cricket',
        format: tournament.format || 'Super League',
        ball_type: tournament.ball_type || 'Leather',
        location: tournament.location || 'TBA',
        entryFee: tournament.entryFee || '',
        paymentGateway: tournament.paymentGateway || 'none',
        organisers: tournament.organisers || { name: '', number: '' },
        officials: tournament.officials || { name: '', number: '' },
        umpires: tournament.umpires || { name: '' },
        current_stage: tournament.current_stage || 'Group Stage',
      });
    }
  }, [tournament]);
  
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [addingTeam, setAddingTeam] = useState(false);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [allRegisteredTeams, setAllRegisteredTeams] = useState<any[]>([]);

  const { user } = useAuth();

  React.useEffect(() => {
    const fetchRegisteredTeams = async () => {
      try {
        const data = await dbService.getAll('teams');
        if (Array.isArray(data)) {
          setAllRegisteredTeams(data);
        }
      } catch (e) {
        console.warn("Failed to load registered teams in TournamentManagement:", e);
      }
    };
    fetchRegisteredTeams();
  }, []);

  const handleSave = async () => {
    if (!tournament) return;
    try {
      const tournamentIdStr = tournament.id.toString();
      await dbService.update('tournaments', tournamentIdStr, editForm);
      if (onUpdate) {
        onUpdate({ ...tournament, ...editForm });
      }
      setIsEditing(false);
    } catch (e) {
      console.error("Error saving tournament:", e);
      alert("Failed to save changes.");
    }
  };

  const handleAddTeamSubmit = async () => {
    if (!newTeamName.trim() || !tournament) return;
    try {
      setAddingTeam(true);
      const trimmedName = newTeamName.trim();
      const currentTeams = tournament.teamNames ? tournament.teamNames.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
      
      if (currentTeams.includes(trimmedName)) {
        alert("This team is already registered in the tournament.");
        setAddingTeam(false);
        return;
      }

      // If team doesn't exist globally in teams table, register it
      const teamExistsGlobally = allRegisteredTeams.some(t => t.name && t.name.trim().toLowerCase() === trimmedName.toLowerCase());
      if (!teamExistsGlobally && user) {
        try {
          const newTeamObj = {
            name: trimmedName,
            city: tournament.location || 'Local',
            owner_id: user.uid,
            sport_type: tournament.sport_type || 'Cricket',
            created_at: new Date().toISOString()
          };
          const created = await dbService.create('teams', newTeamObj);
          if (created) {
            setAllRegisteredTeams(prev => [...prev, created]);
          }
        } catch (e) {
          console.warn("Could not auto-create team globally:", e);
        }
      }

      const updatedTeamsList = [...currentTeams, trimmedName];
      const updatedTeamNames = updatedTeamsList.join(', ');
      
      // Update in database
      const tournamentIdStr = tournament.id.toString();
      await dbService.update('tournaments', tournamentIdStr, {
        teamNames: updatedTeamNames,
        teamsCount: updatedTeamsList.length
      });

      // Update parent state
      const updatedTournament = {
        ...tournament,
        teamNames: updatedTeamNames,
        teamsCount: updatedTeamsList.length
      };

      if (onUpdate) {
        onUpdate(updatedTournament);
      }

      setNewTeamName('');
      setShowAddTeam(false);
    } catch (error) {
      console.error("Error adding team to tournament:", error);
      alert("Failed to add team. Please try again.");
    } finally {
      setAddingTeam(false);
    }
  };

  const handleRemoveTeam = async (teamToRemove: string) => {
    if (!window.confirm(`Are you sure you want to remove "${teamToRemove}" from this tournament?`)) return;
    try {
      // Get current teams from props
      const currentTeams = tournament?.teamNames 
        ? tournament.teamNames.split(',').map((t: string) => t.trim()).filter(Boolean) 
        : [];
      
      const updatedTeamsList = currentTeams.filter((t: string) => t.toLowerCase() !== teamToRemove.toLowerCase());
      const updatedTeamNames = updatedTeamsList.join(', ');
      
      // Update in database
      const tournamentIdStr = tournament.id.toString();
      
      await dbService.update('tournaments', tournamentIdStr, {
        teamNames: updatedTeamNames,
        teamsCount: updatedTeamsList.length
      });

      // Update parent state
      if (onUpdate) {
        onUpdate({
          ...tournament,
          teamNames: updatedTeamNames,
          teamsCount: updatedTeamsList.length
        });
      }
    } catch (error) {
      console.error("Error removing team from tournament:", error);
      alert("Failed to remove team. Please try again.");
    }
  };
  
  const [scheduleTeamA, setScheduleTeamA] = useState('');
  const [scheduleTeamB, setScheduleTeamB] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const [matches, setMatches] = useState<any[]>(() => {
    const t1 = tournament?.teamNames ? tournament.teamNames.split(',')[0]?.trim() : 'Team A';
    const t2 = tournament?.teamNames && tournament.teamNames.split(',').length > 1 ? tournament.teamNames.split(',')[1]?.trim() : 'Team B';
    return [
      {
        id: '1',
        name: `Match 1 - ${tournament?.format || 'Super League'}`,
        teamA: t1,
        teamB: t2,
        time: 'Tomorrow, 10:00 AM'
      }
    ];
  });

  const { isPro, isAdmin } = useAuth();
  const isOwner = tournament?.owner_id === user?.uid || isAdmin;
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [proFeatureName, setProFeatureName] = useState("Performance Dashboard");
  const tabs = ['Info', 'Teams', 'Standings', 'Matches', 'Brackets', 'Registrations', 'Statistics', 'Analytics', 'Performance'];

  const handleSendAlert = async () => {
    const alertMsg = prompt("Enter the push notification message to broadcast to all followers:");
    if (!alertMsg) return;
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ matchId: tournament.id.toString(), title: `Tournament Alert: ${tournament.name}`, body: alertMsg })
      });
      alert("Push alert sent!");
    } catch (e) {
      console.warn("Failed to send push alert", e);
      alert("Failed to send alert.");
    }
  };

  const renderProLock = (title: string, description: string, featureKey: string) => {
    return (
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
        <div className="absolute inset-0 opacity-10 pointer-events-none filter blur-sm flex flex-col justify-around p-8">
          <div className="h-8 bg-slate-400 rounded w-1/3"></div>
          <div className="flex space-x-4">
            <div className="h-32 bg-slate-400 rounded flex-1"></div>
            <div className="h-32 bg-slate-400 rounded flex-1"></div>
          </div>
          <div className="h-16 bg-slate-400 rounded w-full"></div>
        </div>

        <div className="relative z-10 max-w-md mx-auto bg-white/90 backdrop-blur-md border border-slate-100 p-8 rounded-2xl shadow-xl flex flex-col items-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-4 animate-bounce">
            <Crown className="w-8 h-8 fill-amber-500" />
          </div>
          <h3 className="text-xl font-black text-slate-900">{title}</h3>
          <p className="text-slate-500 text-sm mt-2 text-center leading-relaxed">
            {description}
          </p>
          <button
            onClick={() => {
              setProFeatureName(featureKey);
              setIsProModalOpen(true);
            }}
            className="mt-6 w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-[#d11a2a] to-red-600 hover:from-red-650 hover:to-red-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-500/10 transform hover:-translate-y-0.5"
          >
            <Lock className="w-4 h-4" />
            <span>Upgrade to Streamlify Pro</span>
          </button>
          <p className="text-[10px] text-slate-400 font-medium mt-3">Cancel anytime. Instant activation.</p>
        </div>
      </div>
    );
  };

  const stages = ['Group Stage', 'Quarter-Finals', 'Semi-Finals', 'Finals'];
  const currentStage = tournament?.current_stage || 'Group Stage';
  const currentIndex = stages.indexOf(currentStage);

  const handleStageSelect = async (stage: string) => {
    if (!isOwner) return;
    try {
      const tournamentIdStr = tournament.id.toString();
      await dbService.update('tournaments', tournamentIdStr, { current_stage: stage });
      if (onUpdate) {
        onUpdate({ ...tournament, current_stage: stage });
      }
    } catch (error) {
      console.error("Error updating stage:", error);
    }
  };

  return (
        <div className="bg-white min-h-[500px] flex flex-col rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {tournament?.banner_url && (
        <div className="h-32 w-full bg-slate-800">
          <img src={tournament.banner_url} alt="Banner" className="w-full h-full object-cover opacity-80" />
        </div>
      )}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="hover:bg-slate-800 p-1.5 rounded-full transition-colors z-10 bg-slate-800/50">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="font-bold text-lg">{tournament?.name || tournamentName}</h2>
            {tournament?.sport_type && <p className="text-xs text-slate-400">{tournament.sport_type} &bull; {tournament.format || 'League'}</p>}
          </div>
          <button 
            onClick={() => setIsFollowing(!isFollowing)}
            className={`px-3 py-1 text-xs font-bold rounded-full ml-4 transition-colors ${isFollowing ? 'bg-white text-slate-900' : 'bg-slate-800 text-white border border-slate-600 hover:bg-slate-700'}`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>
        <div className="bg-[#d11a2a] text-xs font-bold px-2 py-1 rounded">LIVE</div>
      </div>

      {/* Modern Interactive Tournament Stage Stepper */}
      <div className="bg-slate-50 px-4 md:px-8 py-5 border-b border-slate-200">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between text-[11px] md:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            <span>Tournament Progress</span>
            <span className="text-slate-900 bg-slate-200/80 px-2 py-0.5 rounded-full lowercase first-letter:uppercase">
              Current: <strong className="text-[#d11a2a] font-bold">{currentStage}</strong>
            </span>
          </div>
          
          <div className="relative flex items-center justify-between w-full px-2">
            {/* Background connecting track */}
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 rounded-full" />
            
            {/* Active progress bar */}
            <div 
              className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-red-500 to-[#d11a2a] rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `calc(${currentIndex >= 0 ? (currentIndex / (stages.length - 1)) * 100 : 0}% - 8px)` 
              }}
            />
            
            {/* Steps */}
            {stages.map((stage, idx) => {
              const isCompleted = idx < currentIndex;
              const isActive = idx === currentIndex;
              const isPastOrActive = idx <= currentIndex;
              
              return (
                <div 
                  key={stage} 
                  onClick={() => handleStageSelect(stage)}
                  className={`relative flex flex-col items-center z-10 ${isOwner ? 'cursor-pointer group' : ''}`}
                  title={isOwner ? `Click to switch stage to ${stage}` : undefined}
                >
                  {/* Step circle */}
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-sm transition-all duration-300 ${
                      isActive 
                        ? 'bg-white border-[#d11a2a] text-[#d11a2a] ring-4 ring-red-100 scale-110' 
                        : isCompleted 
                          ? 'bg-[#d11a2a] border-[#d11a2a] text-white' 
                          : 'bg-white border-slate-300 text-slate-500 group-hover:border-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </div>
                  
                  {/* Step title */}
                  <span 
                    className={`absolute top-9 text-[10px] font-bold tracking-tight whitespace-nowrap transition-colors duration-200 ${
                      isActive 
                        ? 'text-[#d11a2a]' 
                        : isPastOrActive 
                          ? 'text-slate-800' 
                          : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  >
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Admin/Owner Instruction Tip */}
          {isOwner && (
            <div className="mt-8 text-center text-[10px] text-slate-400 font-semibold italic">
              * Organiser controls: Click any stage above to instantly update the live tournament progress.
            </div>
          )}
          {!isOwner && <div className="mt-6" />}
        </div>
      </div>
      
      <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-200">
        {tabs.map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-4 text-sm font-semibold shrink-0 transition-colors ${
              activeTab === tab ? 'text-[#d11a2a] border-b-2 border-[#d11a2a]' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-4 flex-1 bg-slate-50 overflow-y-auto">

        {activeTab === 'Info' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900 text-lg">Tournament Details</h3>
                <div className="flex items-center space-x-3">
                  {isOwner && (
                    <button 
                      onClick={handleSendAlert}
                      className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
                    >
                      Send Alert
                    </button>
                  )}
                  {isOwner && (
                    <button 
                      onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                      className="text-xs font-bold text-[#d11a2a] hover:text-red-700"
                    >
                      {isEditing ? 'Save' : 'Edit'}
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <div className="text-slate-500 mb-1 font-medium">Sport Type</div>
                  {isEditing ? (
                    <input 
                      value={editForm.sport_type} 
                      onChange={(e) => setEditForm({...editForm, sport_type: e.target.value})}
                      className="font-bold text-slate-900 border rounded p-1 w-full"
                    />
                  ) : (
                    <div className="font-bold text-slate-900">{tournament?.sport_type || 'Cricket'}</div>
                  )}
                </div>
                <div>
                  <div className="text-slate-500 mb-1 font-medium">Format</div>
                  {isEditing ? (
                    <input 
                      value={editForm.format} 
                      onChange={(e) => setEditForm({...editForm, format: e.target.value})}
                      className="font-bold text-slate-900 border rounded p-1 w-full"
                    />
                  ) : (
                    <div className="font-bold text-slate-900">{tournament?.format || 'Super League'}</div>
                  )}
                </div>
                {tournament?.sport_type === 'Cricket' && (
                  <div>
                    <div className="text-slate-500 mb-1 font-medium">Ball Type</div>
                    {isEditing ? (
                      <input 
                        value={editForm.ball_type} 
                        onChange={(e) => setEditForm({...editForm, ball_type: e.target.value})}
                        className="font-bold text-slate-900 border rounded p-1 w-full"
                      />
                    ) : (
                      <div className="font-bold text-slate-900">{tournament?.ball_type || 'Leather'}</div>
                    )}
                  </div>
                )}
                <div>
                  <div className="text-slate-500 mb-1 font-medium">Location</div>
                  {isEditing ? (
                    <input 
                      value={editForm.location} 
                      onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                      className="font-bold text-slate-900 border rounded p-1 w-full"
                    />
                  ) : (
                    <div className="font-bold text-slate-900">{tournament?.location || 'TBA'}</div>
                  )}
                </div>
                <div>
                  <div className="text-slate-500 mb-1 font-medium">Entry Fee</div>
                  {isEditing ? (
                    <input 
                      type="number"
                      value={editForm.entryFee} 
                      onChange={(e) => setEditForm({...editForm, entryFee: e.target.value})}
                      className="font-bold text-emerald-600 border rounded p-1 w-full"
                    />
                  ) : (
                    <div className="font-bold text-emerald-600">
                      {tournament?.entryFee ? `${tournament.paymentGateway === 'stripe' ? '$' : '₹'}${tournament.entryFee}` : 'Free'}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-slate-500 mb-1 font-medium">Payment Gateway</div>
                  {isEditing ? (
                    <select 
                      value={editForm.paymentGateway} 
                      onChange={(e) => setEditForm({...editForm, paymentGateway: e.target.value})}
                      className="font-bold text-slate-900 border rounded p-1 w-full"
                    >
                      <option value="none">Offline / Manual</option>
                      <option value="stripe">Stripe</option>
                    </select>
                  ) : (
                    <div className="font-bold text-slate-900 capitalize">
                      {tournament?.paymentGateway && tournament.paymentGateway !== 'none' ? tournament.paymentGateway : 'Offline / Manual'}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-slate-500 mb-1 font-medium">Current Stage</div>
                  {isEditing ? (
                    <select 
                      value={editForm.current_stage || 'Group Stage'} 
                      onChange={(e) => setEditForm({...editForm, current_stage: e.target.value})}
                      className="font-bold text-slate-900 border rounded p-1 w-full"
                    >
                      {stages.map(stg => (
                        <option key={stg} value={stg}>{stg}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="font-bold text-slate-900">{tournament?.current_stage || 'Group Stage'}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-900 text-md mb-3 border-b border-slate-100 pb-2">Management & Officials</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <div className="font-medium text-slate-700">Organiser</div>
                  {isEditing ? (
                    <div className="flex space-x-2">
                        <input value={editForm.organisers.name} onChange={(e) => setEditForm({...editForm, organisers: {...editForm.organisers, name: e.target.value}})} className="font-bold text-slate-900 border rounded p-1 w-24" placeholder="Name"/>
                        <input value={editForm.organisers.number} onChange={(e) => setEditForm({...editForm, organisers: {...editForm.organisers, number: e.target.value}})} className="font-bold text-slate-900 border rounded p-1 w-24" placeholder="Number"/>
                    </div>
                  ) : (
                    <div className="font-bold text-slate-900">{tournament?.organisers?.name || 'N/A'} {tournament?.organisers?.number ? `(${tournament?.organisers?.number})` : ''}</div>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <div className="font-medium text-slate-700">Match Official</div>
                  {isEditing ? (
                    <div className="flex space-x-2">
                        <input value={editForm.officials.name} onChange={(e) => setEditForm({...editForm, officials: {...editForm.officials, name: e.target.value}})} className="font-bold text-slate-900 border rounded p-1 w-24" placeholder="Name"/>
                        <input value={editForm.officials.number} onChange={(e) => setEditForm({...editForm, officials: {...editForm.officials, number: e.target.value}})} className="font-bold text-slate-900 border rounded p-1 w-24" placeholder="Number"/>
                    </div>
                  ) : (
                    <div className="font-bold text-slate-900">{tournament?.officials?.name || 'N/A'} {tournament?.officials?.number ? `(${tournament?.officials?.number})` : ''}</div>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <div className="font-medium text-slate-700">Umpire / Referee</div>
                  {isEditing ? (
                    <input value={editForm.umpires.name} onChange={(e) => setEditForm({...editForm, umpires: {...editForm.umpires, name: e.target.value}})} className="font-bold text-slate-900 border rounded p-1 w-full" placeholder="Name"/>
                  ) : (
                    <div className="font-bold text-slate-900">{tournament?.umpires?.name || 'N/A'}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        
        {activeTab === 'Teams' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Tournament Teams</h3>
              {!showAddTeam && (
                <button 
                  onClick={() => setShowAddTeam(true)}
                  className="bg-[#d11a2a] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-red-700 transition-colors"
                >
                  Add Team
                </button>
              )}
            </div>

            {showAddTeam && (
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <h4 className="font-bold text-slate-900 text-xs">Add New Team</h4>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={newTeamName}
                      onChange={(e) => {
                        setNewTeamName(e.target.value);
                        setShowTeamDropdown(true);
                      }}
                      onFocus={() => setShowTeamDropdown(true)}
                      placeholder="Search or enter team name..."
                      className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                      disabled={addingTeam}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTeamSubmit();
                        }
                      }}
                    />
                    {showTeamDropdown && newTeamName && allRegisteredTeams && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                        {allRegisteredTeams
                          .filter(team => (team.name || '').toLowerCase().includes(newTeamName.toLowerCase()))
                          .map(team => (
                            <div
                              key={team.id}
                              className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm font-medium text-slate-800"
                              onClick={() => {
                                setNewTeamName(team.name);
                                setShowTeamDropdown(false);
                              }}
                            >
                              {team.name}
                            </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleAddTeamSubmit}
                    disabled={addingTeam || !newTeamName.trim()}
                    className="bg-[#d11a2a] hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm disabled:opacity-50 transition-colors"
                  >
                    {addingTeam ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddTeam(false);
                      setNewTeamName('');
                    }}
                    disabled={addingTeam}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                {/* Autocomplete / Existing Teams Suggestions */}
                {(() => {
                  const currentTournamentTeams = tournament?.teamNames
                    ? tournament.teamNames.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean)
                    : [];

                  const query = newTeamName.trim().toLowerCase();
                  
                  if (query) {
                    const matched = allRegisteredTeams.filter(t => 
                      t.name && 
                      t.name.toLowerCase().includes(query) &&
                      !currentTournamentTeams.includes(t.name.toLowerCase())
                    );
                    
                    if (matched.length > 0) {
                      return (
                        <div className="border border-slate-200 rounded-lg bg-slate-50 p-2 space-y-1 max-h-40 overflow-y-auto">
                          <p className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-1">Existing Registered Teams</p>
                          {matched.map((t, idx) => (
                            <button
                              key={idx}
                              onClick={() => setNewTeamName(t.name)}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 text-xs font-semibold text-slate-800 flex justify-between items-center transition-colors"
                            >
                              <span>{t.name}</span>
                              <span className="text-[10px] font-normal text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                {t.city || t.sport_type || 'Cricket'}
                              </span>
                            </button>
                          ))}
                        </div>
                      );
                    }
                  } else {
                    const available = allRegisteredTeams.filter(t => 
                      t.name && 
                      !currentTournamentTeams.includes(t.name.toLowerCase())
                    );
                    
                    if (available.length > 0) {
                      return (
                        <div className="border border-slate-200 rounded-lg bg-slate-50 p-2 space-y-1 max-h-40 overflow-y-auto">
                          <p className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-1">Select from Registered Teams</p>
                          {available.slice(0, 6).map((t, idx) => (
                            <button
                              key={idx}
                              onClick={() => setNewTeamName(t.name)}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 text-xs font-semibold text-slate-800 flex justify-between items-center transition-colors"
                            >
                              <span>{t.name}</span>
                              <span className="text-[10px] font-normal text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                {t.city || t.sport_type || 'Cricket'}
                              </span>
                            </button>
                          ))}
                        </div>
                      );
                    }
                  }
                  return null;
                })()}
              </div>
            )}
            
            {tournament?.teamNames ? (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                {tournament.teamNames.split(',').map((team: string) => team.trim()).filter(Boolean).map((team: string, idx: number) => (
                  <div key={idx} className="p-3 border-b border-slate-100 flex items-center justify-between last:border-b-0 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                        {idx + 1}
                      </div>
                      <div className="font-bold text-slate-900">{team}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveTeam(team)}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded transition-colors"
                      title="Remove Team"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 text-center">
                <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">No teams registered yet.</p>
                <p className="text-xs text-slate-500 mt-1">Teams added to this tournament will appear here.</p>
              </div>
            )}

          </div>
        )}
  
                {activeTab === 'Standings' && (
          <div className="space-y-4">
            {!(isPro || isOwner) ? (
              renderProLock(
                "Unlock Pro Tournament Standings",
                "Upgrade to PRO to view complete points tables, net run rates, goals differences, live standing updates, and detailed team rankings.",
                "Tournament Standings"
              )
            ) : (
              (() => {
                const teams = tournament?.teamNames ? tournament.teamNames.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
                if (teams.length === 0) {
                  return (
                    <div className="bg-white p-8 rounded-xl border border-slate-200 border-dashed text-center">
                      <p className="text-slate-500 text-sm font-medium">No teams registered yet.</p>
                      <p className="text-slate-400 text-xs mt-1">Add teams in the Teams tab to generate the points table.</p>
                    </div>
                  );
                }
                return (
                  <>
                    <h3 className="font-bold text-slate-900 text-sm">Group Stage - Points Table</h3>
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                      <div className="grid grid-cols-12 gap-1 p-3 bg-slate-100 text-xs font-bold text-slate-600 border-b border-slate-200 text-center">
                        <div className="col-span-5 text-left pl-2">Team</div>
                        <div className="col-span-1">M</div>
                        <div className="col-span-1">W</div>
                        {(!tournament?.sport_type || tournament?.sport_type === 'Football') && <div className="col-span-1">D</div>}
                        <div className="col-span-1">L</div>
                        <div className="col-span-2">
                          {(!tournament?.sport_type || tournament?.sport_type === 'Cricket') ? 'NRR' : 
                           (tournament?.sport_type === 'Football') ? 'GD' : 
                           (tournament?.sport_type === 'Basketball') ? 'PD' : 'SD'}
                        </div>
                        <div className="col-span-2 text-[#d11a2a]">Pts</div>
                      </div>
                      {teams.map((tName: string, idx: number) => (
                        <div key={idx} className="grid grid-cols-12 gap-1 p-3 border-b border-slate-100 text-xs text-center items-center hover:bg-slate-50 transition-colors">
                          <div className="col-span-5 text-left pl-2 font-bold text-slate-900 flex items-center space-x-2">
                            <span className="text-slate-400 w-3">{idx + 1}</span>
                            <span className="truncate">{tName}</span>
                          </div>
                          <div className="col-span-1 text-slate-600">0</div>
                          <div className="col-span-1 text-emerald-600 font-medium">0</div>
                          {(!tournament?.sport_type || tournament?.sport_type === 'Football') && <div className="col-span-1 text-slate-500 font-medium">0</div>}
                          <div className="col-span-1 text-red-600 font-medium">0</div>
                          <div className="col-span-2 text-slate-600">0.000</div>
                          <div className="col-span-2 font-bold text-slate-900">0</div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()
            )}
          </div>
        )}

        
        
        {activeTab === 'Matches' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Schedule Matches</h3>
              <button 
                onClick={() => {
                  if (!isPro && !isAdmin) {
                    setProFeatureName("Schedule Match");
                    setIsProModalOpen(true);
                  } else {
                    setSchedulingMatch(true);
                  }
                }}
                className="bg-[#d11a2a] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-red-700"
              >
                Schedule Match
              </button>
            </div>
            
            {schedulingMatch && (
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-slate-900">New Match</h4>
                  <button onClick={() => setSchedulingMatch(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Team 1</label>
                    <select 
                      value={scheduleTeamA}
                      onChange={(e) => setScheduleTeamA(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#d11a2a]"
                    >
                      <option value="">Select Team 1</option>
                      {tournament?.teamNames?.split(',').map((t, i) => <option key={i} value={t.trim()}>{t.trim()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Team 2</label>
                    <select 
                      value={scheduleTeamB}
                      onChange={(e) => setScheduleTeamB(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#d11a2a]"
                    >
                      <option value="">Select Team 2</option>
                      {tournament?.teamNames?.split(',').map((t, i) => <option key={i} value={t.trim()}>{t.trim()}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                    <input 
                      type="date" 
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#d11a2a]" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Time</label>
                    <input 
                      type="time" 
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#d11a2a]" 
                    />
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (!scheduleTeamA || !scheduleTeamB) {
                      alert("Please select both teams.");
                      return;
                    }
                    if (scheduleTeamA === scheduleTeamB) {
                      alert("Teams must be different.");
                      return;
                    }
                    const newMatch = {
                      id: String(Date.now()),
                      name: `Match ${matches.length + 1} - ${tournament?.format || 'Super League'}`,
                      teamA: scheduleTeamA,
                      teamB: scheduleTeamB,
                      time: `${scheduleDate || 'Tomorrow'}, ${scheduleTime || '10:00 AM'}`
                    };
                    setMatches([...matches, newMatch]);
                    setSchedulingMatch(false);
                    setScheduleTeamA('');
                    setScheduleTeamB('');
                    setScheduleDate('');
                    setScheduleTime('');
                  }}
                  className="w-full py-2 bg-[#d11a2a] text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
                >
                  Confirm Schedule
                </button>
              </div>
            )}

            <div className="space-y-3">
              {matches.map((match) => (
                <div key={match.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="font-bold text-slate-700 text-sm">{match.name}</div>
                    <div className="text-xs text-slate-500 flex items-center"><Calendar className="w-3 h-3 mr-1" /> {match.time}</div>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex-1 text-center font-bold text-slate-900">
                      {match.teamA}
                    </div>
                    <div className="px-3 py-1 bg-slate-100 text-slate-500 rounded text-xs font-bold mx-4">VS</div>
                    <div className="flex-1 text-center font-bold text-slate-900">
                      {match.teamB}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                    <button 
                      onClick={() => {
                        const sport = tournament?.sport_type || 'Cricket';
                        localStorage.setItem('prefill_team_a', match.teamA);
                        localStorage.setItem('prefill_team_b', match.teamB);
                        localStorage.setItem('prefill_sport_type', sport);
                        if (tournament?.id) {
                          localStorage.setItem('prefill_tournament_id', String(tournament.id));
                        }
                        if (setFullScreenView) {
                          setFullScreenView('Start A Match');
                        }
                      }}
                      className="text-[#d11a2a] text-xs font-bold hover:underline"
                    >
                      Start Match
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Brackets' && (
          <div className="flex flex-col items-center justify-center space-y-6 pt-4">
            <h3 className="font-bold text-slate-900 text-sm self-start mb-2">Knockout Stage</h3>
            
            {(() => {
              const teams = tournament?.teamNames ? tournament.teamNames.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
              if (teams.length < 2) {
                return (
                  <div className="bg-white p-8 rounded-xl border border-slate-200 border-dashed text-center w-full">
                    <p className="text-slate-500 text-sm font-medium">Insufficient teams for knockout brackets.</p>
                    <p className="text-slate-400 text-xs mt-1">Register at least 2 teams to configure tournament brackets.</p>
                  </div>
                );
              }

              const t1 = teams[0] || 'Team 1';
              const t2 = teams[1] || 'Team 2';
              const t3 = teams[2] || 'TBD';
              const t4 = teams[3] || 'TBD';

              return (
                <div className="flex items-center space-x-4 w-full max-w-lg">
                  {/* Semi Finals */}
                  <div className="flex flex-col space-y-8 w-1/2">
                    <div className="bg-white border border-slate-200 rounded-lg p-2 shadow-sm relative">
                      <div className="flex justify-between text-xs font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1">
                        <span>{t1}</span><span className="text-slate-400">-</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-slate-500">
                        <span>{t3}</span><span className="text-slate-400">-</span>
                      </div>
                      <div className="absolute right-0 top-1/2 w-4 border-t border-slate-300 translate-x-full"></div>
                      <div className="absolute right-4 top-1/2 h-16 border-r border-slate-300 translate-x-full"></div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-2 shadow-sm relative">
                      <div className="flex justify-between text-xs font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1">
                        <span>{t2}</span><span className="text-slate-400">-</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-slate-500">
                        <span>{t4}</span><span className="text-slate-400">-</span>
                      </div>
                      <div className="absolute right-0 top-1/2 w-4 border-t border-slate-300 translate-x-full"></div>
                    </div>
                  </div>

                  {/* Finals */}
                  <div className="flex flex-col justify-center w-1/2 relative">
                    <div className="absolute left-0 top-1/2 w-4 border-t border-slate-300 -translate-x-full"></div>
                    <div className="bg-white border-2 border-[#d11a2a] rounded-lg p-2 shadow-md">
                      <div className="text-[10px] font-bold text-[#d11a2a] text-center mb-1 uppercase tracking-wider">Final</div>
                      <div className="flex justify-between text-xs font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1">
                        <span>Winner SF1</span><span className="text-slate-400">-</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-slate-900">
                        <span>Winner SF2</span><span className="text-slate-400">-</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'Registrations' && (
          <div className="space-y-4">
             <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start space-x-3">
               <Activity className="text-blue-500 shrink-0 mt-0.5" size={20} />
               <div>
                 <h4 className="font-bold text-blue-900 text-sm">Registrations are Open</h4>
                 <p className="text-xs text-blue-700 mt-1">Accepting new teams for the upcoming corporate league.</p>
               </div>
             </div>

             <div className="space-y-3">
               {[
                 { name: 'Neon Knights', status: 'Pending Approval', date: 'Today, 10:30 AM' },
                 { name: 'Tech Titans', status: 'Fee Paid', date: 'Yesterday, 04:15 PM' },
                 { name: 'Agile Avengers', status: 'Verified', date: '04 Jul, 09:00 AM' },
               ].map((team, i) => (
                 <div key={i} className="bg-white border border-slate-200 p-3 rounded-lg flex items-center justify-between shadow-sm">
                   <div className="flex items-center space-x-3">
                     <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                       <Shield className="text-slate-400 w-5 h-5" />
                     </div>
                     <div>
                       <div className="font-bold text-sm text-slate-900">{team.name}</div>
                       <div className="text-xs text-slate-500">{team.date}</div>
                     </div>
                   </div>
                   <div className="flex flex-col items-end">
                     <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                       team.status === 'Verified' ? 'bg-emerald-100 text-emerald-700' :
                       (team.status === 'Fee Paid' || paidTeams.includes(team.name)) ? 'bg-blue-100 text-blue-700' :
                       'bg-amber-100 text-amber-700'
                     }`}>
                       {paidTeams.includes(team.name) ? 'Fee Paid' : team.status}
                     </span>
                     {team.status === 'Pending Approval' && !paidTeams.includes(team.name) && (
                       <div className="flex space-x-2 mt-2">
                         <button onClick={() => setPayingTeam(team.name)}

 className="text-xs font-bold text-[#d11a2a] bg-red-50 px-2 py-1 rounded hover:bg-red-100">Pay Entry Fee {tournament?.paymentGateway === "stripe" ? "$" : "₹"}{tournament?.entryFee !== undefined ? tournament.entryFee : 1500}</button>
                         <button className="text-xs font-bold text-slate-500 hover:underline">Review &gt;</button>
                       </div>
                     )}
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'Statistics' && (
          <div className="space-y-4">
            {!(isPro || isOwner) ? (
              renderProLock(
                "Unlock Pro Tournament Statistics",
                "Upgrade to PRO to view top run-scorers, highest wicket-takers, boundary counts, player statistics leaderboard, and match-by-match metrics.",
                "Tournament Statistics"
              )
            ) : (
              <TournamentStatistics tournamentId={tournament?.id} sportType={tournament?.sport_type} tournament={tournament} />
            )}
          </div>
        )}
        {activeTab === 'Analytics' && (
          <div className="space-y-4">
            {!(isPro || isOwner) ? (
              renderProLock(
                "Unlock Pro Tournament Analytics",
                "Upgrade to PRO to see comprehensive AI-driven analytical insights, wagon-wheel distribution charts, and over-by-over progress indicators.",
                "Tournament Analytics"
              )
            ) : (
              <TournamentAnalytics tournamentId={tournament?.id} sportType={tournament?.sport_type || 'Cricket'} />
            )}
          </div>
        )}
        {activeTab === 'Performance' && (
          <div className="space-y-4 relative">
            {!(isPro || isOwner) ? (
              renderProLock(
                "Unlock Pro Performance Dashboard",
                "Gain access to tactical team fingerprints, MVP strike-rate efficiency quadrants, dismissal breakdown charts, and deep machine-calculated match insights.",
                "Performance Dashboard"
              )
            ) : (
              <TournamentPerformance tournamentId={tournament?.id} sportType={tournament?.sport_type || 'Cricket'} />
            )}
          </div>
        )}
      </div>
      
      {activeTab === 'Premium' && (
        <div className="flex-1 overflow-y-auto">
          <TournamentBranding />
        </div>
      )}
      {payingTeam && (
        <PaymentModal
          amount={tournament?.entryFee !== undefined ? tournament.entryFee : 1500}
          description={`Tournament Entry Fee - ${payingTeam} for ${tournament?.name || tournamentName}`}
          onClose={() => setPayingTeam(null)}
          onSuccess={() => {
            setPaidTeams([...paidTeams, payingTeam]);
            setPayingTeam(null);
          }}
        />
      )}
      <ProUpgradeModal 
        isOpen={isProModalOpen} 
        onClose={() => setIsProModalOpen(false)} 
        featureName={proFeatureName} 
      />
    </div>
  );
}