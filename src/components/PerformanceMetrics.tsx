import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { TrendingUp, Activity, BarChart2, Target } from 'lucide-react';

interface PerformanceMetricsProps {
  activeSport: string;
}

const COLORS = ['#4f46e5', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

export function PerformanceMetrics({ activeSport }: PerformanceMetricsProps) {
  
  // Mock data for Cricket
  const [cricketStrikeRateData, setCricketStrikeRateData] = useState<any[]>([]);
  
  const [cricketBowlingData, setCricketBowlingData] = useState<any[]>([]);

  const cricketShotDistribution = [
    { name: 'Cover Drive', value: 35 },
    { name: 'Pull Shot', value: 25 },
    { name: 'Cut Shot', value: 20 },
    { name: 'Straight Drive', value: 15 },
    { name: 'Sweep', value: 5 },
  ];

  // Mock data for Football
  const [footballPossessionData, setFootballPossessionData] = useState<any[]>([]);

  const [footballAttackingData, setFootballAttackingData] = useState<any[]>([]);

  // Mock data for Basketball
  const [basketballShootingData, setBasketballShootingData] = useState<any[]>([]);

  const [basketballStatsMap, setBasketballStatsMap] = useState<any[]>([]);

  // Mock data for Tennis
  const [tennisServeData, setTennisServeData] = useState<any[]>([]);

  // Default / Other sports data
  const [defaultPerformanceData, setDefaultPerformanceData] = useState<any[]>([]);

  const renderCricketCharts = () => (
    <>
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2 text-indigo-500" /> Batting Strike Rate Trend
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cricketStrikeRateData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="match" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="sr" name="Strike Rate" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="avg" name="Target Avg" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
          <Target className="w-4 h-4 mr-2 text-rose-500" /> Bowling Figures
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cricketBowlingData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="match" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Bar yAxisId="left" dataKey="wickets" name="Wickets" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Line yAxisId="right" type="monotone" dataKey="economy" name="Economy" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
        <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
          <PieChart className="w-4 h-4 mr-2 text-amber-500" /> Shot Distribution
        </h4>
        <div className="h-64 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={cricketShotDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {cricketShotDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );

  const renderFootballCharts = () => (
    <>
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
          <Activity className="w-4 h-4 mr-2 text-indigo-500" /> Possession & Passing
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={footballPossessionData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="match" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="possession" name="Possession %" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="passAccuracy" name="Pass Accuracy %" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
          <Target className="w-4 h-4 mr-2 text-rose-500" /> Attacking Threat
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={footballAttackingData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 20]} tick={false} axisLine={false} />
              <Radar name="Player Stats" dataKey="A" stroke="#ec4899" fill="#ec4899" fillOpacity={0.5} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );

  const renderBasketballCharts = () => (
    <>
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
          <Target className="w-4 h-4 mr-2 text-indigo-500" /> Shooting Percentages
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={basketballShootingData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="match" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="fg" name="FG %" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar dataKey="3pt" name="3PT %" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
          <PieChart className="w-4 h-4 mr-2 text-amber-500" /> Stats Distribution
        </h4>
        <div className="h-64 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={basketballStatsMap}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name} ${value}`}
                labelLine={false}
              >
                {basketballStatsMap.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );

  const renderTennisCharts = () => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
      <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
        <Activity className="w-4 h-4 mr-2 text-indigo-500" /> Serve Performance
      </h4>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={tennisServeData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="match" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            <Line yAxisId="left" type="monotone" dataKey="firstServe" name="First Serve %" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
            <Line yAxisId="right" type="monotone" dataKey="aces" name="Aces" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderDefaultCharts = () => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
      <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
        <BarChart2 className="w-4 h-4 mr-2 text-indigo-500" /> Overall Performance Score
      </h4>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={defaultPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="metric" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="score" name="Match Score" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Line type="monotone" dataKey="average" name="Baseline Average" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center">
          <BarChart2 className="w-5 h-5 mr-2 text-indigo-500" />
          {activeSport} Performance Metrics
        </h3>
        <span className="text-xs font-medium bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full border border-indigo-100">
          AI Visualized
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeSport === 'Cricket' && renderCricketCharts()}
        {activeSport === 'Football' && renderFootballCharts()}
        {activeSport === 'Basketball' && renderBasketballCharts()}
        {activeSport === 'Tennis' && renderTennisCharts()}
        {!['Cricket', 'Football', 'Basketball', 'Tennis'].includes(activeSport) && renderDefaultCharts()}
      </div>
    </div>
  );
}
