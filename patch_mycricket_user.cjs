const fs = require('fs');
let code = fs.readFileSync('src/pages/MyCricket.tsx', 'utf-8');

const target = `  useEffect(() => {
    if (!user) {
      setMatches([]);
      setLoadingMatches(false);
      return;
    }
    setLoadingMatches(true);
    
    // Subscribe to all matches in real-time to auto-sync the scoreboard instantly!
    const unsubscribe = dbService.subscribe('matches', {}, (data) => {`;
const replace = `  useEffect(() => {
    setLoadingMatches(true);
    
    // Subscribe to all matches in real-time to auto-sync the scoreboard instantly!
    const unsubscribe = dbService.subscribe('matches', {}, (data) => {`;

code = code.replace(target, replace);
code = code.replace('return () => unsubscribe();\n  }, [user]);', 'return () => unsubscribe();\n  }, []);');

fs.writeFileSync('src/pages/MyCricket.tsx', code);
