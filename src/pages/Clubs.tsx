import { SportIcon } from '../components/SportIcon';
import React, { useState, useMemo, useEffect } from 'react';
import { dbService } from '../lib/database';
import { useAuth } from '../contexts/AuthContext';
import { Search, MapPin, Users, ShieldCheck, Plus, Check } from 'lucide-react';
import { useToast } from '../components/ToastContext';

const SPORTS = ["Cricket","Football","Basketball","Tennis","Pickleball","Hockey","Volleyball","Badminton","Table Tennis"];

export default function Clubs() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [selectedSport, setSelectedSport] = useState('Cricket');
  const [newSport, setNewSport] = useState('Cricket');
  
  const [clubs, setClubs] = useState<any[]>([]);
  useEffect(() => {
    dbService.subscribe('clubs', {}, (data) => {
      setClubs(data);
    });
  }, []);

  const [joinedClubs, setJoinedClubs] = useState<number[]>([]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newName || !newLocation) return;
    dbService.create('clubs', { name: newName, location: newLocation, members: 1, verified: false, sport: newSport, owner_id: user?.uid });
    setShowAdd(false);
    setNewName('');
    setNewLocation('');
    setNewSport('Cricket');
    showToast('Club created successfully!');
  };

  const handleJoin = (id, name) => {
    if (joinedClubs.includes(id)) {
      showToast(`You have already joined ${name}`);
      return;
    }
    setJoinedClubs([...joinedClubs, id]);
    dbService.update('clubs', id, { members: (clubs.find(c => c.id === id)?.members || 0) + 1 });
    showToast(`Request sent to join ${name}!`);
  };

  const filtered = useMemo(() => {
    return clubs.filter(c => 
       c.sport === selectedSport &&
       (c.name.toLowerCase().includes(search.toLowerCase()) || 
       c.location.toLowerCase().includes(search.toLowerCase()))
    );
  }, [clubs, search, selectedSport]);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Sports Clubs</h1>
          <p className="text-slate-600">Find and join local clubs to participate in organized tournaments and expand your network.</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)} 
          className="bg-[#d11a2a] text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm hover:bg-red-700 flex items-center shrink-0 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" /> Create Club
        </button>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar mb-4">
        {SPORTS.map(sport => (
          <button
            key={sport}
            onClick={() => setSelectedSport(sport)}
            className={`px-4 py-2 whitespace-nowrap rounded-full font-bold text-sm transition-colors ${selectedSport === sport ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            {sport}
          </button>
        ))}
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 space-y-4 animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-xl text-slate-900">Create New Club</h3>
            <button type="button" onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Sport</label>
              <select value={newSport} onChange={e => setNewSport(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#d11a2a]/20 focus:border-[#d11a2a] transition-all">
                {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Club Name</label>
              <input type="text" placeholder="e.g. Phoenix Strikers" value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#d11a2a]/20 focus:border-[#d11a2a] transition-all" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">City / Location</label>
              <input type="text" placeholder="e.g. Mumbai" value={newLocation} onChange={e => setNewLocation(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#d11a2a]/20 focus:border-[#d11a2a] transition-all" required />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-[#d11a2a] text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-sm">Create</button>
          </div>
        </form>
      )}

      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder={`Search ${selectedSport} clubs by name or city...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a] shadow-sm transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((club) => {
          const isJoined = joinedClubs.includes(club.id);
          return (
            <div key={club.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-slate-900 flex items-center leading-tight">
                  {club.name}
                  {club.verified && <ShieldCheck className="w-4 h-4 ml-2 text-emerald-500 shrink-0" title="Verified Club" />}
                </h3>
                <button 
                  onClick={() => handleJoin(club.id, club.name)}
                  disabled={isJoined}
                  className={`text-xs font-bold px-4 py-2 rounded-full transition-colors flex items-center shrink-0 ml-2 ${
                    isJoined 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-transparent'
                  }`}
                >
                  {isJoined ? <><Check className="w-3 h-3 mr-1" /> Requested</> : 'Join'}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium">
                <span className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-slate-400" /> {club.location}</span>
                <span className="flex items-center"><Users className="w-4 h-4 mr-1 text-slate-400" /> {club.members} Members</span>
              </div>
            </div>
          );
        })}
        
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-bold text-slate-900">No clubs found</h3>
            <p className="text-slate-500 mt-1">Try adjusting your search query or selecting a different sport.</p>
          </div>
        )}
      </div>
    </div>
  );
}
