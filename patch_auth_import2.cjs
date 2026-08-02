const fs = require('fs');

function addAuthImport(filepath) {
  let code = fs.readFileSync(filepath, 'utf-8');
  if (!code.includes("import { auth } from '../lib/firebase';")) {
    const target = "import { useAuth } from '../contexts/AuthContext';";
    if (code.includes(target)) {
      code = code.replace(target, "import { useAuth } from '../contexts/AuthContext';\nimport { auth } from '../lib/firebase';");
      fs.writeFileSync(filepath, code);
      console.log('Added auth import to ' + filepath);
    } else {
      console.log('Could not find useAuth import in ' + filepath);
    }
  }
}

addAuthImport('src/components/LiveScoring.tsx');
addAuthImport('src/components/TournamentManagement.tsx');

