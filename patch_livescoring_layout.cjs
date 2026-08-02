const fs = require('fs');
let code = fs.readFileSync('src/components/LiveScoring.tsx', 'utf-8');

// Fix isOwner logic so admins don't automatically see the scoring layout for everyone's matches
code = code.replace(/setIsOwner\(Boolean\(user\?\.uid && \(data\.ownerId === user\.uid \|\| data\.owner_id === user\.uid \|\| data\.created_by === user\.uid\)\) \|\| isAdmin\);/g, "setIsOwner(Boolean(user?.uid && (data.ownerId === user.uid || data.owner_id === user.uid || data.created_by === user.uid)));");

// Hide the right column entirely if !isOwner
code = code.replace(/\{\!isCompactMode && \!isBroadcastMode && \(/, "{!isCompactMode && !isBroadcastMode && isOwner && (");

// Remove the Viewer Mode Active block from the right column
code = code.replace(/\) : \(\n\s*<div className="space-y-5 py-4 text-center">[\s\S]*?<\/div>\n\s*\)}/, "");

fs.writeFileSync('src/components/LiveScoring.tsx', code);
