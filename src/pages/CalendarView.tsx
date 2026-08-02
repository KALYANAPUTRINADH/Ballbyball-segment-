import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Filter, 
  Sparkles, 
  Check, 
  Trophy, 
  Users, 
  BookOpen, 
  ArrowRight,
  Info,
  CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dbService } from '../lib/database';
import { useToast } from '../components/ToastContext';

interface CalendarEvent {
  id: string;
  type: 'Match' | 'Tournament' | 'Practice' | 'Meeting' | 'Other';
  title: string;
  sport_type: string;
  date: string; // YYYY-MM-DD
  time: string;
  location: string;
  description?: string;
  color?: string;
  sourceId?: string;
}

export default function CalendarView() {
  const { showToast } = useToast();
  
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dbEvents, setDbEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Filter states
  const [sportFilter, setSportFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newType, setNewType] = useState<'Match' | 'Tournament' | 'Practice' | 'Meeting' | 'Other'>('Practice');
  const [newTitle, setNewTitle] = useState('');
  const [newSport, setNewSport] = useState('Cricket');
  const [newDate, setNewDate] = useState(() => {
    const y = new Date().getFullYear();
    const m = String(new Date().getMonth() + 1).padStart(2, '0');
    const d = String(new Date().getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [newTime, setNewTime] = useState('10:00');
  const [newLocation, setNewLocation] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load database tournaments, matches, and calendar events
  useEffect(() => {
    let isMounted = true;
    const fetchAllSchedules = async () => {
      try {
        if (isMounted) setLoading(true);
        
        // 1. Fetch tournaments
        let tournaments: any[] = [];
        try {
          tournaments = await dbService.getAll('tournaments') || [];
        } catch (err) {
          console.warn("Firestore 'tournaments' fetch failed:", err);
        }

        // 2. Fetch matches
        let matches: any[] = [];
        try {
          matches = await dbService.getAll('matches') || [];
        } catch (err) {
          console.warn("Firestore 'matches' fetch failed:", err);
        }

        // 3. Fetch custom calendar_events
        let customEvents: any[] = [];
        try {
          customEvents = await dbService.getAll('calendar_events') || [];
        } catch (err) {
          console.warn("Firestore 'calendar_events' fetch failed:", err);
        }

        // 4. Fetch local custom events as fallback
        const localEventsJson = localStorage.getItem('local_calendar_events');
        const localEvents: any[] = localEventsJson ? JSON.parse(localEventsJson) : [];

        if (!isMounted) return;

        // Process and map tournaments to unified event structure
        const mappedTournaments: CalendarEvent[] = tournaments
          .filter(t => t.date || t.startDate)
          .map((t: any) => {
            const rawDate = t.date || t.startDate;
            // Ensure format is YYYY-MM-DD
            let formattedDate = rawDate;
            if (rawDate && rawDate.length === 10 && rawDate.includes('-')) {
              formattedDate = rawDate;
            } else {
              // try parsing
              try {
                const parsed = new Date(rawDate);
                if (!isNaN(parsed.getTime())) {
                  formattedDate = parsed.toISOString().split('T')[0];
                }
              } catch (_) {}
            }
            return {
              id: t.id || `tour_${Math.random()}`,
              type: 'Tournament',
              title: t.name || 'Tournament Event',
              sport_type: t.sport_type || 'Cricket',
              date: formattedDate,
              time: 'All Day',
              location: t.location || 'Various Venues',
              description: `Format: ${t.format || 'League'} | Entry Fee: ₹${t.entryFee || 'Free'}`,
              color: 'bg-amber-500',
              sourceId: t.id
            };
          });

        // Process and map matches
        const mappedMatches: CalendarEvent[] = matches
          .map((m: any) => {
            // Find possible dates
            let mDate = m.date;
            if (!mDate && m.time) {
              // Try extracting date if present in time string, else fallback
              const matchDatePattern = /(\d{4}-\d{2}-\d{2})/;
              const found = m.time.match(matchDatePattern);
              if (found) {
                mDate = found[1];
              }
            }
            // If still no date, distribute or default to today's date format
            if (!mDate) {
              mDate = new Date().toISOString().split('T')[0];
            }

            return {
              id: m.id || `match_${Math.random()}`,
              type: 'Match',
              title: m.title || `${m.team_a || 'Team A'} vs ${m.team_b || 'Team B'}`,
              sport_type: m.sport_type || 'Cricket',
              date: mDate,
              time: m.time || '10:00 AM',
              location: m.venue || m.location || 'Main Stadium',
              description: `Match Duration: ${m.duration || 120} mins`,
              color: 'bg-rose-500',
              sourceId: m.id
            };
          });

        // Merge all custom and local events
        const processedCustom: CalendarEvent[] = [...customEvents, ...localEvents].map((e: any) => ({
          id: e.id || `custom_${Math.random()}`,
          type: e.type || 'Practice',
          title: e.title || 'Practice Session',
          sport_type: e.sport_type || 'Cricket',
          date: e.date,
          time: e.time || '10:00 AM',
          location: e.location || 'Club Ground',
          description: e.description || '',
          color: e.type === 'Practice' ? 'bg-teal-500' : e.type === 'Meeting' ? 'bg-blue-500' : 'bg-slate-500',
          sourceId: e.id
        }));

        setDbEvents([...mappedTournaments, ...mappedMatches, ...processedCustom]);
      } catch (err) {
        console.error("Error aggregating calendar events:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllSchedules();
    return () => { isMounted = false; };
  }, [refreshKey]);

  // Return empty array for seededEvents
  const seededEvents = useMemo(() => [] as CalendarEvent[], []);

  // Combine seeded events and user custom / DB events
  const allEvents = useMemo(() => {
    // Avoid duplicating titles/dates
    const uniqueKeys = new Set<string>();
    const combined: CalendarEvent[] = [];

    // Add DB events first
    dbEvents.forEach(e => {
      const key = `${e.date}_${e.title}`;
      uniqueKeys.add(key);
      combined.push(e);
    });

    // Add seeds if they don't clash
    seededEvents.forEach(e => {
      const key = `${e.date}_${e.title}`;
      if (!uniqueKeys.has(key)) {
        combined.push(e);
      }
    });

    return combined;
  }, [dbEvents, seededEvents]);

  // Filtered Events based on sport and event type
  const filteredEvents = useMemo(() => {
    return allEvents.filter(e => {
      const matchesSport = sportFilter === 'All' || e.sport_type.toLowerCase() === sportFilter.toLowerCase();
      const matchesType = typeFilter === 'All' || e.type.toLowerCase() === typeFilter.toLowerCase();
      return matchesSport && matchesType;
    });
  }, [allEvents, sportFilter, typeFilter]);

  // Calculate Calendar days
  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const grid = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const pDate = new Date(year, month - 1, prevMonthTotalDays - i);
      grid.push({
        date: pDate,
        isCurrentMonth: false,
        dayNum: prevMonthTotalDays - i
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      grid.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
        dayNum: i
      });
    }

    // Next month padding
    const remainingCells = 42 - grid.length; // standard 6-row grid
    for (let i = 1; i <= remainingCells; i++) {
      grid.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        dayNum: i
      });
    }

    return grid;
  }, [currentDate]);

  // Check if dates match (ignoring times)
  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  // Format Date string: "YYYY-MM-DD"
  const formatDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Get events on a specific day
  const getEventsForDate = (date: Date) => {
    const dateStr = formatDateString(date);
    return filteredEvents.filter(e => e.date === dateStr);
  };

  // Active events on the currently selected date
  const selectedDateEvents = useMemo(() => {
    return getEventsForDate(selectedDate);
  }, [selectedDate, filteredEvents]);

  // Navigate months
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const jumpToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Create a new custom calendar event
  const handleAddEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast("Please enter a title for the event", "error");
      return;
    }
    if (!newLocation.trim()) {
      showToast("Please specify a location or venue", "error");
      return;
    }

    try {
      setSubmitting(true);

      const eventPayload: Omit<CalendarEvent, 'id'> = {
        type: newType,
        title: newTitle.trim(),
        sport_type: newSport,
        date: newDate,
        time: newTime,
        location: newLocation.trim(),
        description: newDescription.trim() || undefined
      };

      // 1. Try Firestore save
      try {
        await dbService.create('calendar_events', eventPayload);
      } catch (err) {
        console.warn("Firestore save failed, resorting to local storage", err);
      }

      // 2. Always persist in local storage as reliable backup
      const localEventsJson = localStorage.getItem('local_calendar_events');
      const localEvents: any[] = localEventsJson ? JSON.parse(localEventsJson) : [];
      localEvents.push({
        id: `local_evt_${Date.now()}`,
        ...eventPayload
      });
      localStorage.setItem('local_calendar_events', JSON.stringify(localEvents));

      showToast(`Successfully scheduled: ${newTitle}`, "success");
      
      // Reset fields
      setNewTitle('');
      setNewLocation('');
      setNewDescription('');
      setIsAddModalOpen(false);
      setRefreshKey(prev => prev + 1);

    } catch (err) {
      console.error("Failed to add event:", err);
      showToast("Could not schedule the event. Please check inputs.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Select day handler
  const handleDaySelect = (date: Date) => {
    setSelectedDate(date);
    // Sync prefilled date in modal
    setNewDate(formatDateString(date));
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      
      {/* Visual Hub Header */}
      <div className="bg-gradient-to-r from-slate-900 via-[#1e293b] to-slate-900 text-white shadow-lg border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-[#d11a2a] text-xs font-bold tracking-wider uppercase mb-1">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>Unified Schedules</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold font-sans tracking-tight">
                Calendar & Match Schedules
              </h1>
              <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-xl">
                Stay updated on upcoming matches, team workouts, tactical briefings, and tournament brackets in one interactive dashboard.
              </p>
            </div>
            
            <button 
              onClick={() => {
                // Prefill newDate with current selection
                setNewDate(formatDateString(selectedDate));
                setIsAddModalOpen(true);
              }}
              className="self-start sm:self-center bg-[#d11a2a] hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg active:scale-95 transition duration-150 ease-in-out flex items-center space-x-2 shrink-0"
              id="schedule-event-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Event</span>
            </button>
          </div>

          {/* Quick Filter Bar */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Sport Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 text-xs font-medium flex items-center shrink-0">
                <Filter className="w-3 h-3 mr-1 text-slate-500" /> Sport:
              </span>
              <div className="flex flex-wrap gap-1">
                {['All', 'Cricket', 'Football', 'Tennis'].map((sport) => (
                  <button
                    key={sport}
                    onClick={() => setSportFilter(sport)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 ${
                      sportFilter === sport 
                        ? 'bg-white text-slate-900 shadow-sm font-bold' 
                        : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {sport === 'All' ? '🌐 All' : sport === 'Cricket' ? '🏏 Cricket' : sport === 'Football' ? '⚽ Football' : '🎾 Tennis'}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Type Filter */}
            <div className="flex items-center space-x-2 md:justify-end">
              <span className="text-slate-400 text-xs font-medium flex items-center shrink-0">
                <CalendarDays className="w-3 h-3 mr-1 text-slate-500" /> Type:
              </span>
              <div className="flex flex-wrap gap-1">
                {['All', 'Match', 'Tournament', 'Practice', 'Meeting'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 ${
                      typeFilter === type 
                        ? 'bg-[#d11a2a] text-white shadow-sm font-bold' 
                        : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {type === 'All' ? '📅 All' : type === 'Match' ? '⚔️ Match' : type === 'Tournament' ? '🏆 Tournament' : type === 'Practice' ? '🏃 Practice' : '💬 Meeting'}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-4xl mx-auto px-4 py-6 w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
        
        {/* LEFT COLUMN: Calendar Month Grid (7/12 layout) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col">
          
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-extrabold text-slate-800 font-sans tracking-tight">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              {/* Reset to Today Button */}
              {!isSameDay(currentDate, new Date()) && (
                <button 
                  onClick={jumpToToday}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded transition-colors"
                >
                  TODAY
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              <button 
                onClick={prevMonth}
                className="p-1.5 hover:bg-slate-100 active:scale-90 text-slate-600 rounded-lg transition duration-150"
                aria-label="Previous Month"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={nextMonth}
                className="p-1.5 hover:bg-slate-100 active:scale-90 text-slate-600 rounded-lg transition duration-150"
                aria-label="Next Month"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Weekday Titles */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
              <div key={day} className="text-[10px] font-bold text-slate-400 tracking-wider py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1 flex-1">
            {calendarGrid.map(({ date, isCurrentMonth, dayNum }, index) => {
              const dayEvents = getEventsForDate(date);
              const isSelected = isSameDay(date, selectedDate);
              const activeToday = isToday(date);
              
              return (
                <div
                  key={index}
                  onClick={() => handleDaySelect(date)}
                  className={`min-h-[64px] p-1 rounded-xl flex flex-col justify-between cursor-pointer border transition-all duration-150 relative select-none ${
                    isSelected 
                      ? 'bg-[#d11a2a] text-white border-[#d11a2a] shadow-md shadow-red-200/50 scale-102 z-10' 
                      : isCurrentMonth
                        ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-100'
                        : 'bg-slate-50/50 text-slate-300 border-slate-50/30 hover:bg-slate-50'
                  } ${activeToday && !isSelected ? 'ring-2 ring-blue-500 ring-offset-1 font-extrabold border-blue-200' : ''}`}
                >
                  {/* Day Number */}
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold ${isSelected ? 'text-white' : activeToday ? 'text-blue-600' : isCurrentMonth ? 'text-slate-700' : 'text-slate-400'}`}>
                      {dayNum}
                    </span>
                    {activeToday && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} title="Today" />
                    )}
                  </div>

                  {/* Dot Event Indicators (Max 4 to prevent clutter) */}
                  <div className="flex flex-wrap gap-0.5 mt-auto pt-1 max-w-full">
                    {dayEvents.slice(0, 4).map((event) => {
                      let dotColor = 'bg-slate-400';
                      if (event.type === 'Match') dotColor = isSelected ? 'bg-white' : 'bg-rose-500';
                      else if (event.type === 'Tournament') dotColor = isSelected ? 'bg-amber-300' : 'bg-amber-500';
                      else if (event.type === 'Practice') dotColor = isSelected ? 'bg-teal-200' : 'bg-teal-500';
                      else if (event.type === 'Meeting') dotColor = isSelected ? 'bg-blue-200' : 'bg-blue-500';

                      return (
                        <span 
                          key={event.id} 
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`}
                          title={`${event.type}: ${event.title}`}
                        />
                      );
                    })}
                    {dayEvents.length > 4 && (
                      <span className={`text-[8px] font-extrabold leading-none ${isSelected ? 'text-red-100' : 'text-slate-400'}`}>
                        +{dayEvents.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Legend Info */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-slate-500 font-medium">
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block"></span>
              <span>Match</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block"></span>
              <span>Tournament</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 block"></span>
              <span>Practice / Drills</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block"></span>
              <span>Briefing / Meeting</span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Selected Day Event Detail Stream (5/12 layout) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          {/* Header Display Selected Day */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              SCHEDULED EVENTS FOR
            </span>
            <h3 className="text-base font-extrabold text-white mt-1 font-sans">
              {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </h3>
            <div className="text-xs text-[#d11a2a] font-bold mt-1.5 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              <span>{selectedDateEvents.length} Events on this day</span>
            </div>
          </div>

          {/* Events Card List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[420px]">
            <AnimatePresence mode="popLayout">
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map((event) => {
                  let iconBg = 'bg-slate-100 text-slate-600';
                  let badgeStyle = 'bg-slate-50 text-slate-700 border-slate-200';
                  
                  if (event.type === 'Match') {
                    iconBg = 'bg-rose-50 text-rose-600';
                    badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
                  } else if (event.type === 'Tournament') {
                    iconBg = 'bg-amber-50 text-amber-600';
                    badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
                  } else if (event.type === 'Practice') {
                    iconBg = 'bg-teal-50 text-teal-600';
                    badgeStyle = 'bg-teal-50 text-teal-700 border-teal-200';
                  } else if (event.type === 'Meeting') {
                    iconBg = 'bg-blue-50 text-blue-600';
                    badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
                  }

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all p-4 flex items-start space-x-3.5"
                    >
                      {/* Left icon container */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${iconBg}`}>
                        {event.type === 'Match' ? '⚔️' : event.type === 'Tournament' ? '🏆' : event.type === 'Practice' ? '🏃' : '💬'}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-1 mb-1">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                            {event.type}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                            {event.sport_type}
                          </span>
                        </div>
                        
                        <h4 className="font-extrabold text-slate-800 text-sm leading-tight truncate">
                          {event.title}
                        </h4>
                        
                        {event.description && (
                          <p className="text-slate-500 text-xs mt-1 leading-snug">
                            {event.description}
                          </p>
                        )}

                        <div className="space-y-1.5 mt-3 pt-2.5 border-t border-slate-100 text-slate-500 font-medium">
                          <div className="flex items-center text-xs">
                            <Clock size={13} className="mr-1.5 text-slate-400" />
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center text-xs">
                            <MapPin size={13} className="mr-1.5 text-slate-400" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center flex flex-col items-center justify-center min-h-[220px]"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-3 border border-slate-100 shadow-inner">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-slate-700 text-sm">No Events Scheduled</h4>
                  <p className="text-slate-400 text-xs mt-1.5 max-w-[200px] leading-snug">
                    There are no games, workouts or tactical briefs lined up on this date.
                  </p>
                  <button 
                    onClick={() => {
                      setNewDate(formatDateString(selectedDate));
                      setIsAddModalOpen(true);
                    }}
                    className="mt-4 px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition duration-150 flex items-center space-x-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1 text-[#d11a2a]" />
                    <span>Quick Add Event</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Notice */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[10.5px] text-blue-700 leading-normal">
              <strong>Live Sync:</strong> Creating or scoring matches inside the <strong className="font-bold">Tournaments Hub</strong> automatically populates match fixtures onto this calendar dynamically.
            </p>
          </div>

        </div>

      </div>

      {/* SCHEDULE EVENT MODAL DIALOG */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden"
            >
              
              {/* Modal Header */}
              <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="w-5 h-5 text-[#d11a2a]" />
                  <h3 className="font-bold text-base">Schedule Event</h3>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleAddEventSubmit} className="p-5 space-y-4">
                
                {/* Event Type Grid */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Event Type
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['Practice', 'Meeting', 'Match', 'Tournament', 'Other'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewType(type as any)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold border transition text-center ${
                          newType === type 
                            ? 'bg-[#d11a2a]/10 text-[#d11a2a] border-[#d11a2a] font-extrabold shadow-sm' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                        }`}
                      >
                        {type === 'Practice' ? '🏃 Practice' : type === 'Meeting' ? '💬 Meet' : type === 'Match' ? '⚔️ Match' : type === 'Tournament' ? '🏆 Tour' : '📅 Other'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Event Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Event Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Squad Net Drills, Team Briefing"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d11a2a]/20 focus:border-[#d11a2a] text-sm text-slate-800 placeholder-slate-400"
                  />
                </div>

                {/* Sport Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Sport Type
                  </label>
                  <select
                    value={newSport}
                    onChange={(e) => setNewSport(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d11a2a]/20 focus:border-[#d11a2a] text-sm text-slate-700 bg-white"
                  >
                    <option value="Cricket">🏏 Cricket</option>
                    <option value="Football">⚽ Football</option>
                    <option value="Tennis">🎾 Tennis</option>
                    <option value="Other">🌐 Other Sport</option>
                  </select>
                </div>

                {/* Date and Time selectors */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d11a2a]/20 focus:border-[#d11a2a] text-sm text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d11a2a]/20 focus:border-[#d11a2a] text-sm text-slate-700"
                    />
                  </div>
                </div>

                {/* Location / Venue */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Location / Venue <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Indoor Nets, Main Ground, Club Pavilion"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d11a2a]/20 focus:border-[#d11a2a] text-sm text-slate-800 placeholder-slate-400"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Notes & Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Optional notes or drills details..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d11a2a]/20 focus:border-[#d11a2a] text-sm text-slate-800 placeholder-slate-400 resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-[#d11a2a] hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold rounded-xl shadow-md transition duration-150 flex items-center justify-center space-x-1 disabled:opacity-50"
                  >
                    {submitting ? (
                      <span>Scheduling...</span>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1" />
                        <span>Confirm Schedule</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

