const fs = require('fs');
let code = fs.readFileSync('src/components/TournamentManagement.tsx', 'utf8');

if (!code.includes('import { TournamentAnalytics }')) {
  code = code.replace(
    "import { TournamentStatistics } from './TournamentStatistics';",
    "import { TournamentStatistics } from './TournamentStatistics';\nimport { TournamentAnalytics } from './TournamentAnalytics';"
  );
}

code = code.replace(
  "const tabs = ['Info', 'Teams', 'Standings', 'Matches', 'Brackets', 'Registrations', 'Statistics'];",
  "const tabs = ['Info', 'Teams', 'Standings', 'Matches', 'Brackets', 'Registrations', 'Statistics', 'Analytics'];"
);

const newTabContent = `
        {activeTab === 'Analytics' && (
          <div className="space-y-4">
            <TournamentAnalytics tournamentId={tournament?.id} sportType={tournament?.sport_type || 'Cricket'} />
          </div>
        )}
`;

code = code.replace(
  /\{activeTab === 'Statistics' && \([\s\S]*?\}\)/,
  match => match + "\n" + newTabContent
);

fs.writeFileSync('src/components/TournamentManagement.tsx', code);
