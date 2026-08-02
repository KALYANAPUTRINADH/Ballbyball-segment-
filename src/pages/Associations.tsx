import { SportIcon } from '../components/SportIcon';
import React, { useState, useMemo, useEffect } from 'react';
import { dbService } from '../lib/database';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Shield, ExternalLink, Plus, Search, MapPin, Map, Check } from 'lucide-react';
import { useToast } from '../components/ToastContext';

const SPORTS = ["Cricket","Football","Basketball","Tennis","Pickleball","Hockey","Volleyball","Badminton","Table Tennis"];

export default function Associations() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [selectedSport, setSelectedSport] = useState('Cricket');
  
  const [assocs, setAssocs] = useState<any[]>([]);
  useEffect(() => {
    dbService.subscribe('associations', {}, (data) => {
      setAssocs(data);
    });
  }, []);

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Regional');
  const [newDesc, setNewDesc] = useState('');
  const [newState, setNewState] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newSport, setNewSport] = useState('Cricket');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('');
  
  const [joinedAssocs, setJoinedAssocs] = useState<number[]>([]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newName || !newState || !newLocation) return;
    setAssocs([
      { 
        id: Date.now(),
        name: newName, 
        type: newType, 
        desc: newDesc, 
        state: newState, 
        location: newLocation,
        members: 1,
        sport: newSport
      }, 
      ...assocs
    ]);
    setShowAdd(false);
    setNewName('');
    setNewType('Regional');
    setNewDesc('');
    setNewState('');
    setNewLocation('');
    setNewSport('Cricket');
    showToast('Association registered successfully!');
  };

  const handleJoin = (id, name) => {
    if (joinedAssocs.includes(id)) {
      showToast(`Already requested ${name}`);
      return;
    }
    setJoinedAssocs([...joinedAssocs, id]);
    dbService.update('associations', id, { members: (assocs.find(a => a.id === id)?.members || 0) + 1 });
    showToast(`Registration request sent to ${name}!`);
  };

  const states = useMemo(() => Array.from(new Set(assocs.map(a => a.state))).sort(), [assocs]);

  const filtered = useMemo(() => {
    return assocs.filter(a => {
      const matchSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchState = filterState ? a.state === filterState : true;
      const matchSport = a.sport === selectedSport;
      return matchSearch && matchState && matchSport;
    });
  }, [assocs, searchQuery, filterState, selectedSport]);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Sports Associations</h1>
          <p className="text-slate-600">Register with official governing bodies to participate in verified tournaments and leagues.</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)} 
          className="bg-[#d11a2a] text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm hover:bg-red-700 flex items-center shrink-0 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" /> Register Association
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
            <h3 className="font-bold text-xl text-slate-900">Register New Association</h3>
            <button type="button" onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Sport</label>
              <select value={newSport} onChange={e => setNewSport(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#d11a2a]/20 focus:border-[#d11a2a] transition-all">
                {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Association Name</label>
              <input type="text" placeholder="e.g. National Youth League" value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#d11a2a]/20 focus:border-[#d11a2a] transition-all" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Type</label>
              <select value={newType} onChange={e => setNewType(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#d11a2a]/20 focus:border-[#d11a2a] transition-all">
                <option value="National">National</option>
                <option value="Regional">Regional</option>
                <option value="State">State</option>
                <option value="Corporate">Corporate</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">State</label>
              <input type="text" placeholder="e.g. Maharashtra" value={newState} onChange={e => setNewState(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#d11a2a]/20 focus:border-[#d11a2a] transition-all" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Description</label>
              <input type="text" placeholder="Brief description of the association..." value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#d11a2a]/20 focus:border-[#d11a2a] transition-all" />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-[#d11a2a] text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-sm">Register</button>
          </div>
        </form>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder={`Search ${selectedSport} associations...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a] shadow-sm transition-all"
          />
        </div>
        <select
          value={filterState}
          onChange={(e) => setFilterState(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a] shadow-sm transition-all md:w-48"
        >
          <option value="">All States</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filtered.map((assoc) => {
          const isJoined = joinedAssocs.includes(assoc.id);
          return (
            <div key={assoc.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col group">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-xl text-slate-900 leading-tight pr-4">
                  {assoc.name}
                </h3>
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full shrink-0">
                  {assoc.type}
                </span>
              </div>
              <p className="text-slate-600 text-sm mb-5 line-clamp-2">{assoc.desc}</p>
              
              <div className="mt-auto grid grid-cols-2 gap-y-3 gap-x-4 text-sm text-slate-600 font-medium bg-slate-50 p-4 rounded-xl mb-4">
                <div className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-slate-400" /> {assoc.location}</div>
                <div className="flex items-center"><Map className="w-4 h-4 mr-2 text-slate-400" /> {assoc.state}</div>
                <div className="flex items-center col-span-2"><Shield className="w-4 h-4 mr-2 text-slate-400" /> {assoc.members.toLocaleString()} Registered Members</div>
              </div>
              
              <button 
                onClick={() => handleJoin(assoc.id, assoc.name)}
                disabled={isJoined}
                className={`w-full py-3 rounded-xl font-bold transition-all flex justify-center items-center ${
                  isJoined 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                    : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-[#d11a2a] hover:text-[#d11a2a]'
                }`}
              >
                {isJoined ? <><Check className="w-5 h-5 mr-2" /> Registration Requested</> : 'Register with Association'}
              </button>
            </div>
          );
        })}
        
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
            <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-900">No associations found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
