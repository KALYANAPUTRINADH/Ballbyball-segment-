const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(`import fs from "fs";
import path from "path";
let firebaseConfig: any = {};`, `let firebaseConfig: any = {};`);

fs.writeFileSync('server.ts', code);

code = fs.readFileSync('src/middleware/auth.ts', 'utf-8');
code = code.replace(`import fs from "fs";
import path from "path";
let firebaseConfig: any = {};`, `import fs from "fs";
import path from "path";
let firebaseConfig: any = {};`);
fs.writeFileSync('src/middleware/auth.ts', code);

