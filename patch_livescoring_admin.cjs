const fs = require('fs');
let code = fs.readFileSync('src/components/LiveScoring.tsx', 'utf-8');

code = code.replace(/if \(\!user\?\.uid \|\| \(user\.uid \!\=\= data\.ownerId && user\.uid \!\=\= data\.owner_id && user\.uid \!\=\= data\.created_by && \!isAdmin\)\) \{/, "if (!user?.uid || (user.uid !== data.ownerId && user.uid !== data.owner_id && user.uid !== data.created_by)) {");

fs.writeFileSync('src/components/LiveScoring.tsx', code);
