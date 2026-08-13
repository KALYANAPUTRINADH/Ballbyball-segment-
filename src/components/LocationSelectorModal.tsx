import React, { useState, useMemo } from 'react';
import { Search, X, MapPin, Building, Flag, Trophy, Check, Plus } from 'lucide-react';
import { ALL_LOCATIONS, POPULAR_LOCATIONS, LocationItem } from '../data/locations';

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation: string;
  onSelectLocation: (location: string) => void;
  title?: string;
}

export function LocationSelectorModal({
  isOpen,
  onClose,
  selectedLocation,
  onSelectLocation,
  title = "Select Location"
}: LocationSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = [
    { id: 'All', label: 'All' },
    { id: 'Popular', label: '⭐ Popular' },
    { id: 'US City', label: '🇺🇸 US Cities' },
    { id: 'US State', label: '🗺️ US States' },
    { id: 'US Venue', label: '🏟️ US Stadiums' },
    { id: 'India', label: '🇮🇳 India' },
    { id: 'International', label: '🌐 Global' },
  ];

  const filteredLocations = useMemo(() => {
    let items = ALL_LOCATIONS;

    if (activeCategory === 'Popular') {
      items = ALL_LOCATIONS.filter(item => POPULAR_LOCATIONS.includes(item.name));
    } else if (activeCategory !== 'All') {
      items = ALL_LOCATIONS.filter(item => item.category === activeCategory);
    }

    if (!searchQuery.trim()) {
      return items;
    }

    const q = searchQuery.toLowerCase().trim();
    return ALL_LOCATIONS.filter(item => 
      item.name.toLowerCase().includes(q) || 
      item.category.toLowerCase().includes(q)
    );
  }, [searchQuery, activeCategory]);

  if (!isOpen) return null;

  const handleSelect = (locName: string) => {
    onSelectLocation(locName);
    onClose();
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'US City':
        return <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold border border-blue-200">US City</span>;
      case 'US State':
        return <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold border border-indigo-200">US State</span>;
      case 'US Venue':
        return <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold border border-emerald-200">Stadium</span>;
      case 'India':
        return <span className="text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded font-semibold border border-orange-200">India</span>;
      default:
        return <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">Global</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] border border-slate-100 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-100 text-[#d11a2a] rounded-xl">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{title}</h2>
              <p className="text-xs text-slate-500">Choose location across USA and world</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-slate-100 shrink-0 bg-white">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search US cities, states, venues, or type custom location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#d11a2a] focus:ring-2 focus:ring-[#d11a2a]/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto mt-3 pb-1 no-scrollbar text-xs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-slate-900 text-white font-bold shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100">
          
          {/* Custom Entry if search query exists */}
          {searchQuery.trim() && (
            <button
              onClick={() => handleSelect(searchQuery.trim())}
              className="w-full text-left px-4 py-3 hover:bg-red-50/50 rounded-xl transition-colors flex items-center justify-between mb-2 border border-dashed border-red-200 text-[#d11a2a]"
            >
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-[#d11a2a]" />
                <div>
                  <span className="font-bold text-sm">Use "{searchQuery.trim()}"</span>
                  <p className="text-[11px] text-slate-500">Custom location entry</p>
                </div>
              </div>
              <span className="text-xs bg-[#d11a2a] text-white px-2.5 py-1 rounded-lg font-bold">Select</span>
            </button>
          )}

          {filteredLocations.length > 0 ? (
            filteredLocations.map((item, idx) => {
              const isSelected = selectedLocation.toLowerCase() === item.name.toLowerCase();
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(item.name)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-red-50 text-[#d11a2a] font-bold border border-red-200'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <MapPin className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#d11a2a]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    <span className="text-sm truncate">{item.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 shrink-0">
                    {getCategoryBadge(item.category)}
                    {isSelected && <Check className="w-4 h-4 text-[#d11a2a] ml-1" />}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500">
              <p className="text-sm">No standard locations found matching "{searchQuery}"</p>
              {searchQuery.trim() && (
                <button
                  onClick={() => handleSelect(searchQuery.trim())}
                  className="mt-3 inline-flex items-center space-x-1.5 px-4 py-2 bg-[#d11a2a] text-white text-xs font-bold rounded-xl shadow-md hover:bg-red-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Set "{searchQuery.trim()}" as location</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
          <span>{filteredLocations.length} locations available</span>
          <span className="font-semibold text-slate-700">Currently: {selectedLocation || 'None'}</span>
        </div>

      </div>
    </div>
  );
}
