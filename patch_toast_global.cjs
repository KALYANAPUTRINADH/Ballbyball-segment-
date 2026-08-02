const fs = require('fs');
let code = fs.readFileSync('src/components/ToastContext.tsx', 'utf-8');

code = code.replace(/window\.addEventListener\('fcm-message', handleFcmMessage\);/, `window.addEventListener('fcm-message', handleFcmMessage);\n    // @ts-ignore\n    window.showToast = showToast;`);
code = code.replace(/return \(\) => window\.removeEventListener\('fcm-message', handleFcmMessage\);/, `return () => {\n      window.removeEventListener('fcm-message', handleFcmMessage);\n      // @ts-ignore\n      delete window.showToast;\n    };`);

fs.writeFileSync('src/components/ToastContext.tsx', code);
