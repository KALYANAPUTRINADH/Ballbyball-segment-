const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf-8');

if (!code.includes('ToastProvider')) {
  code = code.replace(/import \{ AuthProvider \} from '\.\/contexts\/AuthContext';/, "import { AuthProvider } from './contexts/AuthContext';\nimport { ToastProvider } from './components/ToastContext';");
  
  code = code.replace(/<AuthProvider>\s*<App \/>\s*<\/AuthProvider>/, "<AuthProvider>\n        <ToastProvider>\n          <App />\n        </ToastProvider>\n      </AuthProvider>");
  fs.writeFileSync('src/main.tsx', code);
}
