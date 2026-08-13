import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, Globe, ChevronDown, Check } from 'lucide-react';
import { ALL_LOCATIONS, LocationItem } from '../data/locations';
import { LocationSelectorModal } from './LocationSelectorModal';

interface LocationSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export function LocationSearchInput({
  value,
  onChange,
  placeholder = "Search US city, state, venue, or ground...",
  className = "",
  label
}: LocationSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredItems = value.trim()
    ? ALL_LOCATIONS.filter(item =>
        item.name.toLowerCase().includes(value.toLowerCase().trim())
      ).slice(0, 8)
    : ALL_LOCATIONS.slice(0, 8);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
          <span>{label}</span>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-[11px] text-[#d11a2a] hover:underline flex items-center font-semibold"
          >
            <Globe className="w-3 h-3 mr-1" />
            Browse USA & All Locations
          </button>
        </label>
      )}

      <div className="relative flex items-center">
        <MapPin className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-20 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
        />
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="absolute right-1.5 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-bold transition-colors flex items-center"
        >
          <Globe className="w-3 h-3 mr-1" />
          Browse
        </button>
      </div>

      {/* Dropdown Suggestions */}
      {isOpen && (
        <div className="absolute z-[100] top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>USA & Global Suggestions</span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsModalOpen(true);
              }}
              className="text-[#d11a2a] hover:underline"
            >
              See All ({ALL_LOCATIONS.length})
            </button>
          </div>

          <div className="py-1 divide-y divide-slate-50">
            {filteredItems.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onChange(item.name);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-xs text-slate-700 transition-colors"
              >
                <div className="flex items-center space-x-2 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate font-medium">{item.name}</span>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium shrink-0 ml-2">
                  {item.category}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Full Modal */}
      <LocationSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedLocation={value}
        onSelectLocation={(loc) => {
          onChange(loc);
          setIsOpen(false);
        }}
        title="Select Match / Tournament Location"
      />
    </div>
  );
}
