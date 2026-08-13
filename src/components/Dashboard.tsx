import React from 'react';
import { CheckCircle2, Video, Trophy, BarChart2 } from 'lucide-react';

export function Dashboard() {
  const features = [
    {
      title: 'Live Scoring & Streaming',
      description: 'Ball-by-ball updates, RTMP streaming, and instant overlays.',
      icon: Video,
    },
    {
      title: 'Tournament Management',
      description: 'Create leagues, generate fixtures, and manage points tables.',
      icon: Trophy,
    },
    {
      title: 'Advanced Analytics',
      description: 'Wagon wheels, Manhattan graphs, and career statistics.',
      icon: BarChart2,
    },
    {
      title: 'AI Enhancements',
      description: 'Ball detection, player tracking, and performance predictions.',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-4 font-sans tracking-tight">
          Welcome to Cricket Heroes
        </h1>
        <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">
          A comprehensive cricket scoring and management platform that enables players, scorers, 
          organizers, and fans to manage matches digitally. Track live ball-by-ball scoring, 
          manage tournaments, and stream live matches with AI-powered overlays.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <div key={idx} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-600 text-sm">{feature.description}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Development Roadmap</h2>
          <div className="space-y-6">
            {[
              { phase: 'Phase 1', desc: 'Auth, Teams, Live Scoring', time: '1-2 months' },
              { phase: 'Phase 2', desc: 'Tournaments, Stats, Notifications', time: '2-3 months' },
              { phase: 'Phase 3', desc: 'Live Streaming, AI Overlays', time: '2-3 months' },
              { phase: 'Phase 4', desc: 'Payments, Premium Features', time: '1-2 months' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-700 text-sm border border-slate-200 mt-1">
                  {idx + 1}
                </div>
                <div className="ml-4">
                  <h4 className="text-md font-semibold text-slate-900">{item.phase}</h4>
                  <p className="text-slate-600 text-sm mt-1">{item.desc}</p>
                  <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">System Architecture</h2>
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 h-64 flex flex-col justify-center font-mono text-sm text-slate-700 overflow-x-auto whitespace-pre">
            {`      [ Mobile App ]
            |
      [ API Gateway ]
            |
  +---------+---------+
  |                   |
[Auth] [Match] [Tournaments]
  |                   |
  +---------+---------+
            |
       [ PostgreSQL ]`}
          </div>
        </div>
      </div>
    </div>
  );
}
