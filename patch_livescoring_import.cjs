const fs = require('fs');
let code = fs.readFileSync('src/components/LiveScoring.tsx', 'utf-8');

if (!code.includes('ShareImageCard')) {
  code = code.replace(/import \{ VisualWagonWheel \} from '\.\/VisualWagonWheel';/, "import { VisualWagonWheel } from './VisualWagonWheel';\nimport { ShareImageCard } from './ShareImageCard';");
  fs.writeFileSync('src/components/LiveScoring.tsx', code);
}
