const fs = require('fs');
let code = fs.readFileSync('src/components/LiveScoring.tsx', 'utf-8');

// Ensure ScoreboardWidget is imported
if (!code.includes("import { ScoreboardWidget } from './ScoreboardWidget';")) {
  code = code.replace(/import \{ ShareImageCard \} from '\.\/ShareImageCard';/, "import { ShareImageCard } from './ShareImageCard';\nimport { ScoreboardWidget } from './ScoreboardWidget';");
}

const lines = code.split('\n');
const startIdx = lines.findIndex(l => l.includes("              ) : config.type === 'periods' && sportType !== 'Basketball' ? ("));
const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes("                <div className=\"bg-slate-900/80 backdrop-blur-md rounded-xl p-3 border border-slate-700/50 flex justify-between items-center text-white shadow-2xl\">"));
let actualEndIdx = endIdx;
for (let i = endIdx; i < lines.length; i++) {
  if (lines[i].includes("                </div>") && lines[i+1].includes("              )")) {
    actualEndIdx = i + 1;
    break;
  }
}

if (startIdx > -1 && actualEndIdx > startIdx) {
  lines.splice(startIdx, actualEndIdx - startIdx + 1, 
    "              ) : (",
    "                <ScoreboardWidget",
    "                  theme={scoreboardTheme}",
    "                  sportType={sportType}",
    "                  teamA={teamA}",
    "                  teamB={teamB}",
    "                  scoreA={scoreA}",
    "                  scoreB={scoreB}",
    "                  setsA={setsA}",
    "                  setsB={setsB}",
    "                  period={period}",
    "                  isExtraTime={isExtraTime}",
    "                  umpireSignal={umpireSignal}",
    "                />",
    "              )"
  );
  fs.writeFileSync('src/components/LiveScoring.tsx', lines.join('\n'));
  console.log('Replaced correctly');
} else {
  console.log('Failed to match inline scoreboards', startIdx, actualEndIdx);
}
