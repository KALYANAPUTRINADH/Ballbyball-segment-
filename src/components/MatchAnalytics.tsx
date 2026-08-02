import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts';

export function MatchAnalytics({ deliveries, inningsScores, teamA, teamB }: any) {
  // We want to calculate the run rate and wickets per over.
  // We'll prepare data for the current innings and the past innings (if available).
  const data = useMemo(() => {
    // Current innings
    const currentInningsDeliveries = deliveries || [];
    
    // Group by over for current innings
    const currentOversData = new Map();
    let cumulativeRuns1 = 0;
    
    currentInningsDeliveries.forEach((d: any) => {
      const overNum = d.over + 1;
      if (!currentOversData.has(overNum)) {
        currentOversData.set(overNum, { runs: 0, wickets: 0, overNum });
      }
      const overData = currentOversData.get(overNum);
      overData.runs += d.runs;
      if (d.isWicket) overData.wickets += 1;
    });

    const maxOver = Math.max(...Array.from(currentOversData.keys()), 0);

    const pastInnings = inningsScores && inningsScores.length > 0 ? inningsScores[inningsScores.length - 1] : null;
    const pastInningsDeliveries = pastInnings && pastInnings.deliveries ? pastInnings.deliveries : [];
    
    const pastOversData = new Map();
    let cumulativeRuns2 = 0;
    
    pastInningsDeliveries.forEach((d: any) => {
      const overNum = d.over + 1;
      if (!pastOversData.has(overNum)) {
        pastOversData.set(overNum, { runs: 0, wickets: 0, overNum });
      }
      const overData = pastOversData.get(overNum);
      overData.runs += d.runs;
      if (d.isWicket) overData.wickets += 1;
    });

    const maxPastOver = Math.max(...Array.from(pastOversData.keys()), 0);
    const totalOvers = Math.max(maxOver, maxPastOver, 20); // Default to 20 or max overs

    const chartData = [];
    cumulativeRuns1 = 0;
    cumulativeRuns2 = 0;

    let w1Count = 0;
    let w2Count = 0;

    for (let i = 1; i <= totalOvers; i++) {
      const point: any = { over: i };
      
      if (i <= maxOver) {
        const cOver = currentOversData.get(i) || { runs: 0, wickets: 0 };
        cumulativeRuns1 += cOver.runs;
        point.currentTeamRuns = cumulativeRuns1;
        point.currentTeamRunRate = parseFloat((cumulativeRuns1 / i).toFixed(2));
        point.currentTeamStrikeRate = parseFloat(((cumulativeRuns1 / (i * 6)) * 100).toFixed(2));
        if (cOver.wickets > 0) {
          w1Count += cOver.wickets;
          point.wicket1 = cumulativeRuns1;
        }
      }
      
      if (i <= maxPastOver) {
        const pOver = pastOversData.get(i) || { runs: 0, wickets: 0 };
        cumulativeRuns2 += pOver.runs;
        point.pastTeamRuns = cumulativeRuns2;
        point.pastTeamRunRate = parseFloat((cumulativeRuns2 / i).toFixed(2));
        point.pastTeamStrikeRate = parseFloat(((cumulativeRuns2 / (i * 6)) * 100).toFixed(2));
        if (pOver.wickets > 0) {
          w2Count += pOver.wickets;
          point.wicket2 = cumulativeRuns2;
        }
      }

      chartData.push(point);
    }
    
    return chartData;
  }, [deliveries, inningsScores]);

  const currentTeamName = (inningsScores && inningsScores.length % 2 !== 0) ? teamB : teamA;
  const pastTeamName = (inningsScores && inningsScores.length % 2 !== 0) ? teamA : teamB;

  return (
    <div className="p-6 space-y-8">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Run Rate Comparison (Worm)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="over" label={{ value: 'Overs', position: 'insideBottomRight', offset: -10 }} />
              <YAxis label={{ value: 'Runs', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" height={36} />
              
              <Line 
                type="monotone" 
                dataKey="currentTeamRuns" 
                name={`${currentTeamName} (Current)`}
                stroke="#d11a2a" 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 6 }} 
              />
              {data.filter(d => d.wicket1).map((entry, index) => (
                <ReferenceDot key={`w1-${index}`} x={entry.over} y={entry.wicket1} r={4} fill="#d11a2a" stroke="#fff" />
              ))}

              {inningsScores && inningsScores.length > 0 && (
                <Line 
                  type="monotone" 
                  dataKey="pastTeamRuns" 
                  name={`${pastTeamName} (Past)`}
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 6 }} 
                />
              )}
              {inningsScores && inningsScores.length > 0 && data.filter(d => d.wicket2).map((entry, index) => (
                <ReferenceDot key={`w2-${index}`} x={entry.over} y={entry.wicket2} r={4} fill="#3b82f6" stroke="#fff" />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Strike Rate Trends</h3>
        <div className="h-64 mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="over" label={{ value: 'Overs', position: 'insideBottomRight', offset: -10 }} />
              <YAxis label={{ value: 'Strike Rate', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" height={36} />
              
              <Line 
                type="monotone" 
                dataKey="currentTeamStrikeRate" 
                name={`${currentTeamName} SR`}
                stroke="#10b981" 
                strokeWidth={2} 
                dot={false}
              />
              {inningsScores && inningsScores.length > 0 && (
                <Line 
                  type="monotone" 
                  dataKey="pastTeamStrikeRate" 
                  name={`${pastTeamName} SR`}
                  stroke="#f59e0b" 
                  strokeWidth={2} 
                  dot={false} 
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Run Rate Progress</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="over" label={{ value: 'Overs', position: 'insideBottomRight', offset: -10 }} />
              <YAxis label={{ value: 'Run Rate', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" height={36} />
              
              <Line 
                type="stepAfter" 
                dataKey="currentTeamRunRate" 
                name={`${currentTeamName} RR`}
                stroke="#d11a2a" 
                strokeWidth={2} 
                dot={false} 
              />
              {inningsScores && inningsScores.length > 0 && (
                <Line 
                  type="stepAfter" 
                  dataKey="pastTeamRunRate" 
                  name={`${pastTeamName} RR`}
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  dot={false} 
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
