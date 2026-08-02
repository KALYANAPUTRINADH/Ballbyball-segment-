const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf-8');

const alertOverride = `
// Override alert to use our custom toast notification system if available
const originalAlert = window.alert;
window.alert = (msg) => {
  if (typeof window !== 'undefined' && (window as any).showToast) {
    (window as any).showToast(msg);
  } else {
    originalAlert(msg);
  }
};
`;

code = code.replace(/const init = async \(\) => \{/, alertOverride + '\nconst init = async () => {');
fs.writeFileSync('src/main.tsx', code);
