const fs = require('fs');
let content = fs.readFileSync('src/components/MatchStreamer.tsx', 'utf-8');
content = content.replace(/<div className="pt-5 border-t border-neutral-800\/80 mt-2">([\s\S]*?)<\/div>/, '');
fs.writeFileSync('src/components/MatchStreamer.tsx', content);
