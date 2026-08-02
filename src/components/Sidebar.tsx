import React from 'react';
import { Activity, Trophy, Users, UserCircle, Star, BrainCircuit, FileVideo } from 'lucide-react';
import { LoginButton } from './LoginButton.tsx';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export function Sidebar({ currentView, setCurrentView }: SidebarProps) {
  const navItems = [
    { id: 'scoring', label: 'Live Scoring', icon: Activity },
    { id: 'tournaments', label: 'Tournaments', icon: Trophy },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'players', label: 'Players', icon: UserCircle },
    { id: 'leaderboard', label: 'Leaderboard', icon: Star },
    { id: 'analytics', label: 'Match Insights', icon: BrainCircuit },
    { id: 'video-ai', label: 'AI Video Engine', icon: FileVideo },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col shrink-0">
      <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
        <div className="bg-emerald-500 p-2 rounded-lg">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold font-sans tracking-tight">Streamlify</h1>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 shrink-0">
        <LoginButton />
      </div>
    </div>
  );
}
