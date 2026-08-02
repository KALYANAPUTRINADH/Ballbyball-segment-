const fs = require('fs');
let code = fs.readFileSync('src/components/TournamentAnalytics.tsx', 'utf-8');

code = code.replace(/let completed = 0, upcoming = 0, ongoing = 0;[\s\S]*?\/\/ Mock\n\s*\}/g, `
      let completed = 0, upcoming = 0, ongoing = 0;
      if (matches.length > 0) {
        completed = matches.filter((m: any) => m.status === 'Completed').length;
        upcoming = matches.filter((m: any) => m.status === 'Upcoming').length;
        ongoing = matches.filter((m: any) => m.status === 'Ongoing' || m.is_live).length;
      } else {
        try {
          const res = await fetch('/api/mock-data/analytics');
          const data = await res.json();
          completed = data.completed;
          upcoming = data.upcoming;
          ongoing = data.ongoing;
        } catch (e) {
          console.warn(e);
        }
      }
`);

fs.writeFileSync('src/components/TournamentAnalytics.tsx', code);
