const fs = require('fs');

let content = fs.readFileSync('src/lib/database.ts', 'utf8');

// Replace subscribe fallback
content = content.replace(/console\.warn\(`Firestore onSnapshot failed[^]+?\}\);/g, 'console.error(`Firestore onSnapshot failed for ${table}`, error); });');

// Replace subscribeDoc fallback
content = content.replace(/console\.warn\(`Firestore subscribeDoc failed[^]+?\}\);/g, 'console.error(`Firestore subscribeDoc failed for ${table}/${id}`, error); });');

// Replace get fallback
content = content.replace(/console\.warn\(`Firestore getDoc failed[^]+?return null;\n    \}/g, 'throw e;\n    }');

// Replace getAll fallback
content = content.replace(/console\.warn\(`Firestore getDocs failed[^]+?return \[\];\n    \}/g, 'throw e;\n    }');

// Replace create fallback
content = content.replace(/console\.warn\(`Firestore addDoc failed[^]+?throw e;\n    \}/g, 'throw e;\n    }');

// Replace update fallback
content = content.replace(/console\.warn\(`Firestore updateDoc failed[^]+?throw e;\n    \}/g, 'throw e;\n    }');

// Replace upsert fallback
content = content.replace(/console\.warn\(`Firestore upsert failed[^]+?throw e;\n    \}/g, 'throw e;\n    }');

// Replace remove fallback
content = content.replace(/try \{\n      \/\/ Always use the backend API[^]+?try \{/g, 'try {');

// Replace set fallback
content = content.replace(/console\.warn\(`Firestore setDoc failed[^]+?throw e;\n    \}/g, 'throw e;\n    }');

fs.writeFileSync('src/lib/database.ts', content);
