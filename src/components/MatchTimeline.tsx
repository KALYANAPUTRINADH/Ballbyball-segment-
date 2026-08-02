import React from 'react';
import { Flag, Star, Target, ShieldAlert, CheckCircle2, Download } from 'lucide-react';
import { ExportService } from '../services/ExportService';

export function MatchTimeline({ inningsScores = [], currentDeliveries = [], teamA, teamB, runs, wickets, overs, balls }: any) {
  // Compute timeline events across all innings
  const events: any[] = [];
  
  // Create a unified list of innings data
  const allInnings = [...inningsScores];
  
  // Add current innings if there are deliveries or runs
  if (currentDeliveries.length > 0 || runs > 0) {
    allInnings.push({
      innings: inningsScores.length + 1,
      runs,
      wickets,
      overs,
      balls,
      deliveries: currentDeliveries,
      isDeclared: false
    });
  }

  allInnings.forEach((inning, idx) => {
    const isTeamA = idx % 2 === 0;
    const battingTeam = isTeamA ? teamA : teamB;
    const bowlingTeam = isTeamA ? teamB : teamA;
    
    events.push({
      type: 'innings_start',
      title: `${battingTeam} Innings Started`,
      description: `Innings ${idx + 1}`,
      icon: <Flag className="w-5 h-5 text-indigo-500" />,
      color: 'bg-indigo-100',
      inningIdx: idx
    });

    let currentScore = 0;
    let currentWickets = 0;
    
    // Track batter scores
    const batterScores: Record<string, number> = {};
    const milestonesReached: Record<string, Set<number>> = {}; // Track 50, 100, 150 etc
    
    // For tracking wicket collapses
    const recentWickets: {score: number}[] = [];

    if (inning.deliveries && Array.isArray(inning.deliveries)) {
      inning.deliveries.forEach((d: any) => {
        // Track score
        if (!['W', 'WD', 'NB'].includes(d.type)) {
           // Batsman runs
           batterScores[d.striker] = (batterScores[d.striker] || 0) + (d.runs || 0);
        }
        
        // Add to total
        currentScore += d.runs || 0;
        
        // Check milestones
        if (batterScores[d.striker]) {
          const score = batterScores[d.striker];
          if (!milestonesReached[d.striker]) milestonesReached[d.striker] = new Set();
          
          let milestone = 0;
          if (score >= 300) milestone = 300;
          else if (score >= 200) milestone = 200;
          else if (score >= 150) milestone = 150;
          else if (score >= 100) milestone = 100;
          else if (score >= 50) milestone = 50;
          
          if (milestone > 0 && !milestonesReached[d.striker].has(milestone)) {
            milestonesReached[d.striker].add(milestone);
            events.push({
              type: 'milestone',
              title: `${d.striker} reaches ${milestone}!`,
              description: `${currentScore}/${currentWickets} (${d.over}.${d.ball} ov)`,
              icon: <Star className="w-5 h-5 text-yellow-500" />,
              color: 'bg-yellow-100',
              inningIdx: idx,
              over: d.over,
              ball: d.ball
            });
          }
        }
        
        // Track wickets
        if (d.isWicket) {
          currentWickets++;
          recentWickets.push({ score: currentScore });
          
          events.push({
            type: 'wicket',
            title: `Wicket! ${d.striker} is out`,
            description: `${currentScore}/${currentWickets} (${d.over}.${d.ball} ov) b ${d.bowler}`,
            icon: <Target className="w-5 h-5 text-rose-500" />,
            color: 'bg-rose-100',
            inningIdx: idx,
            over: d.over,
            ball: d.ball
          });
          
          // Check for collapse (3 wickets for 15 runs or less)
          if (recentWickets.length >= 3) {
            const last3 = recentWickets.slice(-3);
            if (last3[2].score - last3[0].score <= 15) {
              events.push({
                type: 'collapse',
                title: `${battingTeam} Batting Collapse`,
                description: `3 wickets fell for just ${last3[2].score - last3[0].score} runs`,
                icon: <ShieldAlert className="w-5 h-5 text-orange-500" />,
                color: 'bg-orange-100',
                inningIdx: idx,
                over: d.over,
                ball: d.ball
              });
              // clear to avoid double triggering immediately
              recentWickets.length = 0;
            }
          }
        }
      });
    }

    if (idx < allInnings.length - 1 || inning.isDeclared) {
      events.push({
        type: 'innings_end',
        title: inning.isDeclared ? `${battingTeam} Declared` : `${battingTeam} Innings Ended`,
        description: `Score: ${inning.runs}/${inning.wickets} (${inning.overs}.${inning.balls} ov)`,
        icon: <CheckCircle2 className={`w-5 h-5 ${inning.isDeclared ? 'text-blue-500' : 'text-slate-500'}`} />,
        color: inning.isDeclared ? 'bg-blue-100' : 'bg-slate-100',
        inningIdx: idx
      });
    }
  });
  
  if (events.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No major events recorded yet.
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800">Match Timeline</h3>
        <button 
          onClick={() => {
            const headers = ['Event', 'Details'];
            const rows = events.map(ev => [ev.title, ev.description]);
            ExportService.exportToPDF(
              headers, 
              rows, 
              `${teamA}_vs_${teamB}_Timeline`, 
              'Match Timeline Report', 
              `${teamA} vs ${teamB}`
            );
          }}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export PDF</span>
        </button>
      </div>
      <div className="relative border-l-2 border-slate-200 ml-3 md:ml-4 space-y-8 pb-4">
        {events.map((ev, i) => (
          <div key={i} className="relative pl-6 md:pl-8">
            <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full ${ev.color} flex items-center justify-center border-4 border-white shadow-sm`}>
              {ev.icon}
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="font-bold text-slate-800">{ev.title}</h4>
              <p className="text-sm text-slate-600 mt-1">{ev.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
