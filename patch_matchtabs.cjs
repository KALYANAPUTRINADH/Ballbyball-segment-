const fs = require('fs');
let code = fs.readFileSync('src/components/MatchTabs.tsx', 'utf-8');

// Import ShareImageCard
code = code.replace(/import \{ MatchAnalytics \} from '.\/MatchAnalytics';/, "import { MatchAnalytics } from './MatchAnalytics';\nimport { ShareImageCard } from './ShareImageCard';");

// Add rendering for Summary Tab
code = code.replace(/\{activeTab === 'Scorecard'.*\}/, `$&
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
        )}`);

fs.writeFileSync('src/components/MatchTabs.tsx', code);
