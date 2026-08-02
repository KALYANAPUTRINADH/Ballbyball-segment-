const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/import \{ ToastProvider \} from "\.\/components\/ToastContext";\n/g, "");
code = code.replace(/<ToastProvider>/g, "");
code = code.replace(/<\/ToastProvider>/g, "");

fs.writeFileSync('src/App.tsx', code);
