const fs = require('fs');
let code = fs.readFileSync('src/components/LiveScoring.tsx', 'utf-8');

// Change Right Column condition back to isOwner
code = code.replace(/\{!isCompactMode && !isBroadcastMode && \(\n\s*<>\n\s*\{\/\* Right Column \*\/\}/, "{!isCompactMode && !isBroadcastMode && isOwner && (\n          <>\n          {/* Right Column */}");

// Remove the "Viewer Mode Active" block entirely since we won't render the Right Column for viewers anyway.
// Actually, it doesn't hurt to keep it in code, it just won't be rendered if the whole column is hidden by `isOwner`.
fs.writeFileSync('src/components/LiveScoring.tsx', code);
