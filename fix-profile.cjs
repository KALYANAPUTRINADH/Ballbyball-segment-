const fs = require('fs');
let code = fs.readFileSync('src/pages/Profile.tsx', 'utf-8');
code = code.replace(`import { Fingerprint } from "lucide-react";\n`, ``);
fs.writeFileSync('src/pages/Profile.tsx', code);
