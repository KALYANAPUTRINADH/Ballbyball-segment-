const fs = require('fs');
let code = fs.readFileSync('src/components/LiveScoring.tsx', 'utf-8');

const target = `              {sportType === 'Cricket' ? (`;
const replace = `              {!isOwner && !isBroadcastMode && (
                <div className="flex justify-between items-center bg-slate-100 text-slate-500 text-xs px-3 py-1.5 rounded-lg mb-2 shadow-sm border border-slate-200">
                  <span className="font-semibold flex items-center"><Shield className="w-3.5 h-3.5 mr-1" /> Match Creator: {ownerName}</span>
                  <span>{sportType} Match</span>
                </div>
              )}
              {sportType === 'Cricket' ? (`;

if (code.includes(target) && !code.includes('Match Creator: {ownerName}')) {
  code = code.replace(target, replace);
  fs.writeFileSync('src/components/LiveScoring.tsx', code);
  console.log('Replaced correctly');
} else {
  console.log('Failed to patch owner badge');
}
