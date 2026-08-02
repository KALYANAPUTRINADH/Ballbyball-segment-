const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const importTarget = `import { ScoreboardOverlay } from "./components/ScoreboardOverlay";`;
const importReplace = `import { ScoreboardOverlay } from "./components/ScoreboardOverlay";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DeleteAccountPolicy from "./pages/DeleteAccountPolicy";`;
code = code.replace(importTarget, importReplace);

const loadTarget = `  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('overlay')) {
    return <ScoreboardOverlay />;
  }`;
const loadReplace = `  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('overlay')) {
    return <ScoreboardOverlay />;
  }
  
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('page') === 'privacy') {
    return <PrivacyPolicy />;
  }
  
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('page') === 'delete-account') {
    return <DeleteAccountPolicy />;
  }`;
code = code.replace(loadTarget, loadReplace);

fs.writeFileSync('src/App.tsx', code);
console.log("Success");
