const fs = require('fs');
let code = fs.readFileSync('src/components/TournamentManagement.tsx', 'utf8');

const target = `{activeTab === 'Statistics' && (
          <div className="space-y-4">
            <TournamentStatistics tournamentId={tournament?.id} sportType={tournament?.sport_type} />
          </div>
        )}`;

const newTabContent = `
        {activeTab === 'Analytics' && (
          <div className="space-y-4">
            <TournamentAnalytics tournamentId={tournament?.id} sportType={tournament?.sport_type || 'Cricket'} />
          </div>
        )}`;

code = code.replace(target, target + newTabContent);

fs.writeFileSync('src/components/TournamentManagement.tsx', code);
