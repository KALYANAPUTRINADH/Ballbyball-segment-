const fs = require('fs');

function patchFile(filepath, searchStr, replaceStr) {
  let code = fs.readFileSync(filepath, 'utf-8');
  if (code.includes(searchStr)) {
    code = code.replace(searchStr, replaceStr);
    fs.writeFileSync(filepath, code);
    console.log('Patched ' + filepath);
  } else {
    console.log('Target not found in ' + filepath);
  }
}

const liveScoringTarget = `      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, title, body })
      });`;
const liveScoringReplace = `      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({ matchId, title, body })
      });`;
patchFile('src/components/LiveScoring.tsx', liveScoringTarget, liveScoringReplace);

const tmTarget = `      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: tournament.id.toString(), title: \`Tournament Alert: \${tournament.name}\`, body: alertMsg })
      });`;
const tmReplace = `      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({ matchId: tournament.id.toString(), title: \`Tournament Alert: \${tournament.name}\`, body: alertMsg })
      });`;
patchFile('src/components/TournamentManagement.tsx', tmTarget, tmReplace);

