import React, { useState, useEffect } from 'react';

import { MatchAnalytics } from './MatchAnalytics';
import { ShareImageCard } from './ShareImageCard';
import { MatchTimeline } from './MatchTimeline';

interface MatchTabsProps {
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  thisOver: string[];
  matchFormat?: string;
  striker: string;
  nonStriker: string;
  bowler: string;
  strikerStats?: any;
  nonStrikerStats?: any;
  bowlerStats?: any;
  deliveries?: any[];
  teamA?: string;
  teamB?: string;
  sportType?: string;
  scoreA?: number;
  scoreB?: number;
  inningsScores?: any[];
  playerStats?: Record<string, any>;
  teamASquad?: string[];
  teamBSquad?: string[];
}

import { ExportService } from '../services/ExportService';
import { FileText, Download, Share2, ClipboardList } from 'lucide-react';

export function MatchTabs(props: MatchTabsProps) {
  const [activeTab, setActiveTab] = useState('Scorecard');
  const allTabs = ['Scorecard', 'Timeline', 'Summary', 'Commentary', 'Squads', 'Analytics', 'Reports', 'Info'];
  const tabs = props.sportType && props.sportType !== 'Cricket' 
    ? ['Scorecard', 'Squads', 'Analytics', 'Info'] 
    : allTabs;
  
  const teamA = props.teamA || (typeof window !== 'undefined' ? localStorage.getItem('match_team_a') || 'Mumbai Indians' : 'Mumbai Indians');
  const teamB = props.teamB || (typeof window !== 'undefined' ? localStorage.getItem('match_team_b') || 'Chennai Super Kings' : 'Chennai Super Kings');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
      <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-200 bg-slate-50">
        {tabs.map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab 
                ? 'text-[#d11a2a] border-b-2 border-[#d11a2a] bg-white' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      
      <div className="p-0">
        {activeTab === 'Timeline' && <MatchTimeline inningsScores={props.inningsScores} currentDeliveries={props.deliveries} teamA={teamA} teamB={teamB} runs={props.runs} wickets={props.wickets} overs={props.overs} balls={props.balls} />}
        {activeTab === 'Scorecard' && <ScorecardTab sportType={props.sportType} matchFormat={props.matchFormat} scoreA={props.scoreA} scoreB={props.scoreB} runs={props.runs} wickets={props.wickets} overs={props.overs} balls={props.balls} teamA={teamA} teamB={teamB} striker={props.striker} nonStriker={props.nonStriker} bowler={props.bowler} strikerStats={props.strikerStats} nonStrikerStats={props.nonStrikerStats} bowlerStats={props.bowlerStats} playerStats={props.playerStats} teamASquad={props.teamASquad} teamBSquad={props.teamBSquad} inningsScores={props.inningsScores} deliveries={props.deliveries} />}
        {activeTab === 'Summary' && (
          <div className="p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Match Summary</h3>
            <ShareImageCard 
              matchData={{
                teamA,
                teamB,
                runs: props.runs,
                wickets: props.wickets,
                overs: props.overs,
                balls: props.balls,
                target: undefined,
                scoreA: props.scoreA,
                scoreB: props.scoreB,
                inningsScores: props.inningsScores
              }} 
              sportType={props.sportType || 'Cricket'} 
            />
          </div>
        )}
        {activeTab === 'Commentary' && <CommentaryTab runs={props.runs} wickets={props.wickets} overs={props.overs} balls={props.balls} thisOver={props.thisOver} teamA={teamA} bowler={props.bowler} striker={props.striker} />}
        {activeTab === 'Squads' && <SquadsTab teamA={teamA} teamB={teamB} sportType={props.sportType} />}
        {activeTab === 'Overs' && <OversTab thisOver={props.thisOver} overs={props.overs} balls={props.balls} bowler={props.bowler} />}
        {activeTab === 'Stats' && <StatsTab runs={props.runs} teamA={teamA} teamB={teamB} />}
        {activeTab === 'Info' && <InfoTab teamA={teamA} teamB={teamB} sportType={props.sportType} />}
              {activeTab === 'Analytics' && (
        <MatchAnalytics deliveries={props.deliveries} inningsScores={props.inningsScores} teamA={teamA} teamB={teamB} />
      )}
      {activeTab === 'Reports' && (
          <ReportsTab 
            runs={props.runs} 
            wickets={props.wickets} 
            overs={props.overs} 
            balls={props.balls} 
            teamA={teamA} 
            teamB={teamB}
            strikerStats={props.strikerStats}
            nonStrikerStats={props.nonStrikerStats}
            bowlerStats={props.bowlerStats}
            deliveries={props.deliveries || []}
            striker={props.striker}
            nonStriker={props.nonStriker}
            bowler={props.bowler}
          />
        )}



      </div>
    </div>
  );
}

function CommentaryTab({ runs, wickets, overs, balls, thisOver, teamA, bowler, striker }: any) {
  const lastBall = thisOver.length > 0 ? thisOver[thisOver.length - 1] : null;
  return (
    <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
      {lastBall && (
        <div className="flex gap-4">
          <div className="w-12 shrink-0 font-bold text-slate-700 text-sm">{overs}.{balls === 0 && overs > 0 ? 6 : balls}</div>
          <div>
            <p className="text-sm">
              <span className="font-bold">{bowler} to {striker}, 
              {lastBall === 'W' ? <span className="text-[#d11a2a]"> OUT!</span> : 
               lastBall === '6' ? <span className="text-[#d11a2a]"> SIX!</span> :
               lastBall === '4' ? <span className="text-[#d11a2a]"> FOUR!</span> :
               ` ${lastBall} runs.`}
              </span>
            </p>
          </div>
        </div>
      )}
      <div className="flex gap-4 opacity-70">
        <div className="w-12 shrink-0 font-bold text-slate-700 text-sm">0.0</div>
        <div>
          <p className="text-sm"><span className="font-bold">Match started.</span> Welcome to the live coverage.</p>
        </div>
      </div>
      <div className="bg-slate-100 p-3 flex justify-between rounded-md items-center my-4 border border-slate-200">
        <span className="font-bold text-slate-800 text-sm">Current Score</span>
        <span className="text-sm font-semibold text-slate-600">{teamA}: {runs}/{wickets}</span>
      </div>
    </div>
  );
}


function ScorecardTab({ sportType, matchFormat, scoreA, scoreB, runs, wickets, overs, balls, teamA, teamB, striker, nonStriker, bowler, strikerStats, nonStrikerStats, bowlerStats, playerStats, teamASquad, teamBSquad, inningsScores, deliveries }: any) {
  const ss = strikerStats || { runs: 0, balls: 0, fours: 0, sixes: 0 };
  const nss = nonStrikerStats || { runs: 0, balls: 0, fours: 0, sixes: 0 };
  const bs = bowlerStats || { runs: 0, wickets: 0, balls: 0 };

  if (sportType && sportType !== 'Cricket') {
    const renderStatsTable = (squad: string[], teamName: string) => {
      if (!squad || squad.length === 0) return null;
      return (
        <div className="mb-6">
          <div className="bg-slate-100 px-4 py-2 font-bold text-sm text-slate-700 border-y border-slate-200">
            {teamName}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-4 font-semibold whitespace-nowrap">Player</th>
                  {sportType === 'Football' || sportType === 'Hockey' ? (
                    <>
                      <th className="py-2 px-2 text-center font-semibold">G</th>
                      <th className="py-2 px-2 text-center font-semibold">A</th>
                      <th className="py-2 px-2 text-center font-semibold">YC</th>
                      <th className="py-2 px-2 text-center font-semibold">RC</th>
                      <th className="py-2 px-2 text-center font-semibold">CS</th>
                    </>
                  ) : sportType === 'Basketball' ? (
                    <>
                      <th className="py-2 px-2 text-center font-semibold">PTS</th>
                      <th className="py-2 px-2 text-center font-semibold">REB</th>
                      <th className="py-2 px-2 text-center font-semibold">AST</th>
                      <th className="py-2 px-2 text-center font-semibold">STL</th>
                      <th className="py-2 px-2 text-center font-semibold">BLK</th>
                    </>
                  ) : (
                    <th className="py-2 px-2 text-center font-semibold">PTS</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {squad.map((player) => {
                  const stats = playerStats?.[player]?.[sportType] || {};
                  return (
                    <tr key={player} className="hover:bg-slate-50">
                      <td className="py-2 px-4 font-medium text-slate-800">{player}</td>
                      {sportType === 'Football' || sportType === 'Hockey' ? (
                        <>
                          <td className="py-2 px-2 text-center text-slate-600">{stats.goals || 0}</td>
                          <td className="py-2 px-2 text-center text-slate-600">{stats.assists || 0}</td>
                          <td className="py-2 px-2 text-center text-slate-600">{stats.yellowCards || 0}</td>
                          <td className="py-2 px-2 text-center text-slate-600">{stats.redCards || 0}</td>
                          <td className="py-2 px-2 text-center text-slate-600">{stats.cleanSheets || 0}</td>
                        </>
                      ) : sportType === 'Basketball' ? (
                        <>
                          <td className="py-2 px-2 text-center text-slate-600">{stats.points || 0}</td>
                          <td className="py-2 px-2 text-center text-slate-600">{stats.rebounds || 0}</td>
                          <td className="py-2 px-2 text-center text-slate-600">{stats.assists || 0}</td>
                          <td className="py-2 px-2 text-center text-slate-600">{stats.steals || 0}</td>
                          <td className="py-2 px-2 text-center text-slate-600">{stats.blocks || 0}</td>
                        </>
                      ) : (
                        <td className="py-2 px-2 text-center text-slate-600">{stats.points || 0}</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    return (
      <div className="p-0">
        <div className="bg-slate-800 text-white p-3 font-semibold text-sm flex justify-between items-center">
          <span>Match Score</span>
        </div>
        <div className="p-8 text-center flex flex-col items-center justify-center space-y-4 border-b border-slate-200">
           <div className="text-5xl font-black text-slate-800 tracking-tight">
             <span className="text-[#d11a2a]">{scoreA || 0}</span>
             <span className="text-slate-300 mx-4">-</span>
             <span className="text-[#d11a2a]">{scoreB || 0}</span>
           </div>
           <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">
             Current Score
           </div>
        </div>
        {renderStatsTable(teamASquad, teamA)}
        {renderStatsTable(teamBSquad, teamB)}
      </div>
    );
  }

  const allInnings = [...(inningsScores || [])];
  
  // Include active ongoing innings so live score updates in parallel with the scorer panel
  if (allInnings.length === (inningsScores || []).length) {
    allInnings.push({
      innings: allInnings.length + 1,
      runs,
      wickets,
      overs,
      balls,
      deliveries: deliveries || [],
      isActive: true
    });
  }

  if (matchFormat === 'Test Match') {
    while (allInnings.length < 4) {
      allInnings.push({
        innings: allInnings.length + 1,
        runs: 0,
        wickets: 0,
        overs: 0,
        balls: 0,
        deliveries: [],
        isActive: false
      });
    }
  }

  const calculateInningsStats = (inningData: any) => {
    const batters: Record<string, any> = {};
    const bowlers: Record<string, any> = {};
    
    const inningDeliveries = inningData.deliveries || [];

    inningDeliveries.forEach((d: any) => {
      const bat = d.striker;
      const bowl = d.bowler;
      if (!batters[bat]) batters[bat] = { runs: 0, balls: 0, fours: 0, sixes: 0, out: false, name: bat };
      if (!bowlers[bowl]) bowlers[bowl] = { runsConceded: 0, wickets: 0, balls: 0, name: bowl };
      
      if (d.isLegal) {
        batters[bat].balls += 1;
        bowlers[bowl].balls += 1;
      }

      if (d.type !== 'W' && !isNaN(d.runs)) {
         if (d.type === 'WD') {
            bowlers[bowl].runsConceded += d.runs;
         } else if (d.type === 'NB') {
            const batRuns = Math.max(0, d.runs - 1);
            batters[bat].runs += batRuns;
            bowlers[bowl].runsConceded += d.runs;
            if (batRuns === 4) batters[bat].fours += 1;
            if (batRuns === 6) batters[bat].sixes += 1;
         } else if (['B', 'LB'].includes(d.type)) {
            // Byes and Leg Byes do not count towards bowler's runs or batter's runs
            // Actually, in standard cricket, they don't count for bowler.
         } else {
            batters[bat].runs += d.runs;
            bowlers[bowl].runsConceded += d.runs;
            if (d.runs === 4) batters[bat].fours += 1;
            if (d.runs === 6) batters[bat].sixes += 1;
         }
      }
      
      if (d.isWicket) {
         bowlers[bowl].wickets += 1;
         batters[bat].out = true;
      }
    });

    if (inningData.isActive) {
      if (striker && ss) {
         if (!batters[striker]) batters[striker] = { runs: 0, balls: 0, fours: 0, sixes: 0, name: striker };
         batters[striker] = { ...batters[striker], ...ss, out: false, isCurrent: true };
      }
      if (nonStriker && nss) {
         if (!batters[nonStriker]) batters[nonStriker] = { runs: 0, balls: 0, fours: 0, sixes: 0, name: nonStriker };
         batters[nonStriker] = { ...batters[nonStriker], ...nss, out: false, isCurrent: true };
      }
      if (bowler && bs) {
         if (!bowlers[bowler]) bowlers[bowler] = { runsConceded: 0, wickets: 0, balls: 0, name: bowler };
         bowlers[bowler] = { ...bowlers[bowler], runsConceded: bs.runs, wickets: bs.wickets, balls: bs.balls, isCurrent: true };
      }
    }
    
    return { batters: Object.values(batters), bowlers: Object.values(bowlers) };
  };

  return (
    <div className="p-0">
      {allInnings.map((inning: any, index: number) => {
        const { batters, bowlers } = calculateInningsStats(inning);
        // Odd innings (1st, 3rd) -> Team A usually bats (unless overridden, but we just alternate for display)
        const isTeamABatting = index % 2 === 0;
        const battingTeamName = isTeamABatting ? teamA : teamB;
        
        // Show current strikers first in active innings, otherwise normal order
        if (inning.isActive) {
           batters.sort((a, b) => (b.isCurrent ? 1 : 0) - (a.isCurrent ? 1 : 0));
        }

        return (
          <div key={index} className="mb-6">
            <div className="bg-slate-800 text-white p-3 font-semibold text-sm flex justify-between">
              <span>{battingTeamName} Innings {allInnings.length > 2 ? `(${index + 1})` : ''}</span>
              <span>{inning.runs}/{inning.wickets}{inning.isDeclared ? 'd' : ''} ({inning.overs}.{inning.balls} Overs)</span>
            </div>
            
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="text-left font-semibold py-2 px-4">Batter</th>
                  <th className="text-right font-semibold py-2 px-2">R</th>
                  <th className="text-right font-semibold py-2 px-2">B</th>
                  <th className="text-right font-semibold py-2 px-2">4s</th>
                  <th className="text-right font-semibold py-2 px-2">6s</th>
                  <th className="text-right font-semibold py-2 px-2">SR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batters.map((player: any) => (
                  <tr key={player.name} className="hover:bg-slate-50">
                    <td className="py-2 px-4">
                      <div className={`font-bold ${player.isCurrent && player.name === striker ? 'text-[#d11a2a]' : 'text-slate-800'}`}>
                        {player.name}{player.isCurrent && player.name === striker ? '*' : ''}
                      </div>
                      <div className="text-xs text-slate-500">
                        {player.isCurrent ? 'not out' : (player.out ? 'out' : 'not out')}
                      </div>
                    </td>
                    <td className="text-right font-bold py-2 px-2">{player.runs || 0}</td>
                    <td className="text-right py-2 px-2 text-slate-600">{player.balls || 0}</td>
                    <td className="text-right py-2 px-2 text-slate-600">{player.fours || 0}</td>
                    <td className="text-right py-2 px-2 text-slate-600">{player.sixes || 0}</td>
                    <td className="text-right py-2 px-2 text-slate-600">
                      {player.balls > 0 ? ((player.runs / player.balls) * 100).toFixed(1) : '-'}
                    </td>
                  </tr>
                ))}
                {batters.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-500 italic">No batting data available</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            <table className="w-full text-sm mt-4 mb-4">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="text-left font-semibold py-2 px-4">Bowler</th>
                  <th className="text-right font-semibold py-2 px-2">O</th>
                  <th className="text-right font-semibold py-2 px-2">M</th>
                  <th className="text-right font-semibold py-2 px-2">R</th>
                  <th className="text-right font-semibold py-2 px-2">W</th>
                  <th className="text-right font-semibold py-2 px-2">ER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bowlers.map((player: any) => (
                  <tr key={player.name} className="hover:bg-slate-50">
                    <td className="py-2 px-4 font-bold text-slate-800">
                      {player.name}{player.isCurrent && player.name === bowler ? '*' : ''}
                    </td>
                    <td className="text-right py-2 px-2 text-slate-600">
                      {Math.floor((player.balls || 0) / 6)}.{(player.balls || 0) % 6}
                    </td>
                    <td className="text-right py-2 px-2 text-slate-600">0</td>
                    <td className="text-right py-2 px-2 text-slate-600">{player.runsConceded || 0}</td>
                    <td className="text-right font-bold py-2 px-2 text-[#d11a2a]">{player.wickets || 0}</td>
                    <td className="text-right py-2 px-2 text-slate-600">
                      {player.balls > 0 ? (((player.runsConceded || 0) / player.balls) * 6).toFixed(1) : '-'}
                    </td>
                  </tr>
                ))}
                {bowlers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-500 italic">No bowling data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}


import { dbService } from '../lib/database';


function SquadsTab({ teamA, teamB, sportType }: any) {
  const defaultA = (!sportType || sportType === 'Cricket') ? ["Player 1 (c)", "Player 2 (wk)", "Player 3", "Player 4", "Player 5"] : ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5"];
  const defaultB = (!sportType || sportType === 'Cricket') ? ["Player 1 (c)", "Player 2 (wk)", "Player 3", "Player 4", "Player 5"] : ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5"];
  const [squadA, setSquadA] = useState<string[]>(defaultA);
  const [squadB, setSquadB] = useState<string[]>(defaultB);
  
  useEffect(() => {
    let activeMatchId = null;
    if (typeof window !== 'undefined') {
      activeMatchId = localStorage.getItem('active_match_id');
      const savedA = localStorage.getItem('match_team_a_squad');
      if (savedA) {
        try { setSquadA(JSON.parse(savedA)); } catch(e) {}
      }
      const savedB = localStorage.getItem('match_team_b_squad');
      if (savedB) {
        try { setSquadB(JSON.parse(savedB)); } catch(e) {}
      }
    }
    
    // Fetch from backend if available
    if (activeMatchId) {
      dbService.get('matches', activeMatchId).then((match: any) => {
        if (match) {
          if (match.team_a_squad) {
            try { setSquadA(JSON.parse(match.team_a_squad)); } catch(e) {}
          }
          if (match.team_b_squad) {
            try { setSquadB(JSON.parse(match.team_b_squad)); } catch(e) {}
          }
        }
      });
    }
  }, []);

  return (
    <div className="flex divide-x divide-slate-200 text-sm">
      <div className="w-1/2 p-0">
        <div className="bg-slate-100 p-3 font-bold text-center border-b border-slate-200 text-slate-800">{teamA}</div>
        <ul className="divide-y divide-slate-100">
          {squadA.map((p, i) => (
            <li key={i} className="p-3 hover:bg-slate-50">{p}</li>
          ))}
        </ul>
      </div>
      <div className="w-1/2 p-0">
        <div className="bg-slate-100 p-3 font-bold text-center border-b border-slate-200 text-slate-800">{teamB}</div>
        <ul className="divide-y divide-slate-100">
          {squadB.map((p, i) => (
            <li key={i} className="p-3 hover:bg-slate-50">{p}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function OversTab({ thisOver, overs, balls, bowler }: any) {
  return (
    <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
      <div className="flex gap-4">
        <div className="w-12 font-bold text-slate-700 mt-1">Ov {overs + 1}</div>
        <div className="flex-1">
          <div className="flex space-x-2 flex-wrap mb-2">
            {thisOver.map((ball: string, idx: number) => (
              <span key={idx} className={`h-8 min-w-[2rem] px-1 flex items-center justify-center rounded-full font-bold text-xs ${
                ball === 'W' ? 'bg-red-500 text-white' :
                ball === '6' || ball === '4' ? 'bg-[#d11a2a]/10 text-[#d11a2a] border border-[#d11a2a]/20' :
                'bg-slate-100 text-slate-700'
              }`}>
                {ball}
              </span>
            ))}
          </div>
          <div className="text-xs text-slate-500">Bowler: {bowler}</div>
        </div>
      </div>
    </div>
  );
}

function StatsTab({ runs, teamA, teamB }: any) {
  return (
    <div className="p-4">
      <h3 className="font-bold text-slate-800 mb-4">Match Statistics</h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold text-slate-700">Win Probability</span>
            <span className="text-slate-500">{teamA}: {Math.min(99, 50 + runs/5)}% | {teamB}: {Math.max(1, 50 - runs/5)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(99, 50 + runs/5)}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoTab({ teamA, teamB, sportType }: any) {
  const overs = typeof window !== 'undefined' ? localStorage.getItem('match_overs') || '20' : '20';
  const location = typeof window !== 'undefined' ? localStorage.getItem('match_location') || 'Unknown Ground' : 'Unknown Ground';
  const tossWinner = typeof window !== 'undefined' ? localStorage.getItem('match_toss_winner') || teamA : teamA;
  const tossChoice = typeof window !== 'undefined' ? localStorage.getItem('match_toss_choice') || 'Bat' : 'Bat';

  return (
    <div className="p-4">
      <ul className="space-y-4 text-sm">
        <li className="flex">
          <span className="w-32 font-semibold text-slate-600 shrink-0">Match</span>
          <span className="text-slate-800">
            {teamA} vs {teamB}, Live Match 
            {(!sportType || sportType === 'Cricket') ? ` (${overs} Overs)` : ''}
          </span>
        </li>
        <li className="flex">
          <span className="w-32 font-semibold text-slate-600 shrink-0">Date</span>
          <span className="text-slate-800">{new Date().toLocaleDateString()}</span>
        </li>
        <li className="flex">
          <span className="w-32 font-semibold text-slate-600 shrink-0">Venue</span>
          <span className="text-slate-800">{location}</span>
        </li>
        {(!sportType || sportType === 'Cricket') && (
          <li className="flex">
            <span className="w-32 font-semibold text-slate-600 shrink-0">Toss</span>
            <span className="text-slate-800">{tossWinner} won the toss and opt to {tossChoice.toLowerCase()}</span>
          </li>
        )}
      </ul>
    </div>
  );
}

function ReportsTab({ runs, wickets, overs, balls, teamA, teamB, strikerStats, nonStrikerStats, bowlerStats, deliveries, striker, nonStriker, bowler }: any) {
  const handleExportCSV = () => {
    const data = (deliveries || []).map((d: any) => ({
      Over: `${d.over}.${d.ball}`,
      Batter: d.striker,
      Bowler: d.bowler,
      Runs: d.runs,
      Type: d.type,
      Wicket: d.isWicket ? 'Yes' : 'No',
      Score: d.scoreAtEnd,
      Timestamp: new Date(d.timestamp).toLocaleTimeString()
    }));
    ExportService.exportToCSV(data, `match_report_${Date.now()}`);
  };

  const handleExportPDF = () => {
    const headers = ['Over', 'Batter', 'Bowler', 'Runs', 'Type', 'Wicket', 'Score'];
    const rows = (deliveries || []).map((d: any) => [
      `${d.over}.${d.ball}`,
      d.striker,
      d.bowler,
      d.runs,
      d.type,
      d.isWicket ? 'OUT' : '',
      d.scoreAtEnd
    ]);

    const title = `Match Report: ${teamA} vs ${teamB}`;
    const subtitle = `Current Score: ${runs}/${wickets} (${overs}.${balls} overs)`;
    
    ExportService.exportToPDF(headers, rows, `match_report_${Date.now()}`, title, subtitle);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-5 hover:border-[#d11a2a]/30 transition-colors">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-[#d11a2a]/10 flex items-center justify-center mr-3">
              <ClipboardList className="w-5 h-5 text-[#d11a2a]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Delivery Data</h3>
              <p className="text-xs text-slate-500">Full ball-by-ball analysis</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Export a detailed CSV report containing all {deliveries?.length || 0} deliveries, including batsman, bowler, runs, and wicket details for deep analysis.
          </p>
          <button 
            onClick={handleExportCSV}
            className="flex items-center justify-center space-x-2 w-full bg-white border border-slate-300 hover:border-[#d11a2a] hover:text-[#d11a2a] py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV Report</span>
          </button>
        </div>

        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-5 hover:border-[#d11a2a]/30 transition-colors">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-[#d11a2a]/10 flex items-center justify-center mr-3">
              <FileText className="w-5 h-5 text-[#d11a2a]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">PDF Scorecard</h3>
              <p className="text-xs text-slate-500">Professional sharing format</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Generate a polished PDF summary including the current scorecard, match situation, and segmented delivery milestones ready for sharing.
          </p>
          <button 
            onClick={handleExportPDF}
            className="flex items-center justify-center space-x-2 w-full bg-[#d11a2a] text-white py-2.5 rounded-lg text-sm font-bold hover:bg-red-700 transition-all shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>Generate PDF Report</span>
          </button>
        </div>
      </div>

      {deliveries && deliveries.length > 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase">All Deliveries</span>
            <span className="text-xs text-slate-400">{deliveries.length} total</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 sticky top-0 backdrop-blur-sm text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="text-left py-2 px-4 font-semibold">Ball</th>
                  <th className="text-left py-2 px-2 font-semibold">Matchup</th>
                  <th className="text-right py-2 px-4 font-semibold">Runs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[...deliveries].reverse().map((d: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-4 font-mono text-xs text-slate-500">{d.over}.{d.ball}</td>
                    <td className="py-2 px-2">
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-medium">{d.striker}</span>
                        <span className="text-[10px] text-slate-400">vs {d.bowler}</span>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-right">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        d.isWicket ? 'bg-red-500 text-white' :
                        d.runs >= 4 ? 'bg-[#d11a2a]/10 text-[#d11a2a]' :
                        'text-slate-600'
                      }`}>
                        {d.isWicket ? 'W' : d.runs}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="w-6 h-6 text-slate-300" />
          </div>
          <h4 className="font-bold text-slate-400">No delivery data yet</h4>
          <p className="text-sm text-slate-300">Data will appear here once the match starts.</p>
        </div>
      )}
    </div>
  );
}
