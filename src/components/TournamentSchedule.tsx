import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock, Trophy, Bell, BellRing } from 'lucide-react';
import { dbService } from '../lib/database';
import { useToast } from './ToastContext';

export function TournamentSchedule() {
  const { showToast } = useToast();
  const [alertMatches, setAlertMatches] = useState<string[]>([]);
  
  useEffect(() => {
    try {
      const stored = localStorage.getItem('match_alerts');
      if (stored) {
        setAlertMatches(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  const toggleAlert = (matchId: string) => {
    let newAlerts;
    if (alertMatches.includes(matchId)) {
      newAlerts = alertMatches.filter(id => id !== matchId);
      showToast("Alert removed for this match");
    } else {
      newAlerts = [...alertMatches, matchId];
      showToast("Alert set! We will notify you when this match starts");
    }
    setAlertMatches(newAlerts);
    try {
      localStorage.setItem('match_alerts', JSON.stringify(newAlerts));
    } catch (e) {}
  };
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [matches, setMatches] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const fetchedMatches: any = await dbService.getAll('matches') || [];
      const fetchedTournaments: any = await dbService.getAll('tournaments') || [];
      setMatches(fetchedMatches.filter((m: any) => m.status !== 'Completed'));
      setTournaments(fetchedTournaments);
    } catch (error) {
      console.warn("Failed to fetch schedule data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Build calendar days
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }, (_, i) => i); // adjusting for monday start (or standard 0=Sunday)
  // standard: 0 = Sunday. Let's stick to Sunday start
  const blanksSunday = Array.from({ length: firstDay }, (_, i) => i);
  
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const isSameDay = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  // Consider matches from DB
  const seededMatches: any[] = [];
  const allMatches = matches.map(m => ({ ...m, isReal: true }));

  const getMatchesForDate = (date: Date) => {
    return allMatches.filter(m => {
      if (!m.date && !m.created_at) return false;
      try {
        const mDate = new Date(m.date || m.created_at);
        return isSameDay(mDate, date);
      } catch (e) {
        return false;
      }
    });
  };

  const selectedMatches = getMatchesForDate(selectedDate);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#d11a2a] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4">
      {/* Calendar View */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex space-x-2">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-slate-400 py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {blanksSunday.map(b => (
              <div key={`blank-${b}`} className="h-14 md:h-20 bg-slate-50/50 rounded-lg border border-transparent"></div>
            ))}
            {days.map(d => {
              const date = new Date(year, month, d);
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, new Date());
              const dayMatches = getMatchesForDate(date);
              const hasMatches = dayMatches.length > 0;
              
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDate(date)}
                  className={`h-14 md:h-20 relative rounded-lg border flex flex-col p-1 transition-all ${
                    isSelected 
                      ? 'border-[#d11a2a] bg-red-50 ring-1 ring-[#d11a2a]' 
                      : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className={`text-xs font-semibold ${isToday ? 'bg-[#d11a2a] text-white w-5 h-5 rounded-full flex items-center justify-center' : 'text-slate-700'}`}>
                    {d}
                  </span>
                  {hasMatches && (
                    <div className="absolute bottom-1 right-1 left-1 flex justify-center">
                      <div className="w-1.5 h-1.5 bg-[#d11a2a] rounded-full"></div>
                    </div>
                  )}
                  {hasMatches && (
                    <div className="mt-1 flex flex-col hidden md:flex w-full">
                       <span className="text-[9px] font-bold text-[#d11a2a] truncate w-full text-left bg-red-100/50 px-1 rounded">{dayMatches.length} Match{dayMatches.length > 1 ? 'es' : ''}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Date Matches List */}
      <div className="w-full md:w-80 flex-shrink-0">
        <h3 className="text-sm font-bold text-slate-800 mb-4 px-1">
          Matches on {selectedDate.toLocaleString('default', { month: 'short', day: 'numeric' })}
        </h3>
        
        {selectedMatches.length === 0 ? (
          <div className="bg-slate-50 rounded-xl border border-slate-200 border-dashed p-8 text-center">
            <Trophy className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500 font-medium">No matches scheduled for this date.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedMatches.map((m, idx) => (
              <div key={m.id || idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors">
                <div className="bg-[#d11a2a] w-full h-1"></div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-sm text-slate-900 leading-tight pr-2">{m.name || 'Tournament Match'}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 whitespace-nowrap">
                      {m.status || 'Upcoming'}
                    </span>
                    {m.id && (m.status === 'Upcoming' || !m.status) && (
                      <button 
                        onClick={() => toggleAlert(m.id)}
                        className="ml-2 p-1 rounded-full hover:bg-slate-100 transition-colors"
                        title={alertMatches.includes(m.id) ? "Remove Alert" : "Set Alert"}
                      >
                        {alertMatches.includes(m.id) ? (
                          <BellRing className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Bell className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-1.5 mt-3">
                    <div className="flex items-center text-xs text-slate-600">
                      <Clock className="w-3.5 h-3.5 mr-2 text-slate-400" />
                      {m.time || 'TBD'}
                    </div>
                    {m.location && (
                      <div className="flex items-center text-xs text-slate-600">
                        <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400" />
                        {m.location}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
