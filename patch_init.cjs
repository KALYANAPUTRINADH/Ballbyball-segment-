const fs = require('fs');

let code = fs.readFileSync('src/components/LiveScoring.tsx', 'utf-8');

const regex = /if \(\!user\?\.uid \|\| \(user\.uid \!\=\= data\.ownerId \&\& user\.uid \!\=\= data\.owner_id \&\& user\.uid \!\=\= data\.created_by\)\) \{/s;

const replace = `// Always sync from firestore on first load to prevent data loss on refresh, then only viewers sync continuously
        if (!hasSyncedFromFirebaseRef.current || !user?.uid || (user.uid !== data.ownerId && user.uid !== data.owner_id && user.uid !== data.created_by)) {
          hasSyncedFromFirebaseRef.current = true;`;

if (regex.test(code)) {
  // Add the ref for initialization
  code = code.replace(/const wsRef = useRef<WebSocket \| null>\(null\);/, `const wsRef = useRef<WebSocket | null>(null);\n  const hasSyncedFromFirebaseRef = useRef(false);`);
  fs.writeFileSync('src/components/LiveScoring.tsx', code.replace(regex, replace));
  console.log('Patched LiveScoring.tsx init logic.');
} else {
  console.log('Target not found for init logic.');
}
