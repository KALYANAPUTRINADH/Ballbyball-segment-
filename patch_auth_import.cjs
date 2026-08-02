const fs = require('fs');

function addAuthImport(filepath) {
  let code = fs.readFileSync(filepath, 'utf-8');
  if (!code.includes("import { auth } from '../lib/firebase';")) {
    // find a place to import, maybe near other imports
    const target = "import { db } from '../lib/firebase';";
    if (code.includes(target)) {
      code = code.replace(target, "import { db, auth } from '../lib/firebase';");
      fs.writeFileSync(filepath, code);
      console.log('Added auth import to ' + filepath);
    } else {
      console.log('Could not find db import in ' + filepath);
    }
  }
}

addAuthImport('src/components/LiveScoring.tsx');
addAuthImport('src/components/TournamentManagement.tsx');

