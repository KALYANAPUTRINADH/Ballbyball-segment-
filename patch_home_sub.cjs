const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

const regex = /const fetchSearchData = async \(\) => \{\n      try \{\n        const tData = \(await dbService\.getAll\('tournaments'\)\) \|\| \[\];\n        const cData = \(await dbService\.getAll\('clubs'\)\) \|\| \[\];\n        const aData = \(await dbService\.getAll\('associations'\)\) \|\| \[\];\n        const uData = \(await dbService\.getAll\('profiles'\)\) \|\| \[\];\n        const mData = \(await dbService\.getAll\('matches'\)\) \|\| \[\];\n        \n        setAllMatches\(mData\);\n\n        let combined = \[\n          \.\.\.tData\.map\(\(d: any\) => \(\{ \.\.\.d, searchType: 'Tournament', name: d\.name \|\| 'Unnamed Tournament', icon: Trophy, color: 'indigo' \}\)\),\n          \.\.\.cData\.map\(\(d: any\) => \(\{ \.\.\.d, searchType: 'Club', name: d\.name \|\| 'Unnamed Club', icon: Shield, color: 'emerald' \}\)\),\n          \.\.\.aData\.map\(\(d: any\) => \(\{ \.\.\.d, searchType: 'Association', name: d\.name \|\| 'Unnamed Association', icon: Users, color: 'amber' \}\)\),\n          \.\.\.uData\.map\(\(d: any\) => \(\{ \.\.\.d, searchType: 'Athlete', name: d\.displayName \|\| d\.username \|\| d\.name \|\| 'Unknown Athlete', icon: User, color: 'slate' \}\)\),\n          \.\.\.mData\.map\(\(d: any\) => \(\{ \.\.\.d, searchType: 'Match', name: \`\$\{d\.teamA \|\| d\.team_a \|\| 'Team A'\} vs \$\{d\.teamB \|\| d\.team_b \|\| 'Team B'\}\`, icon: Play, color: 'red' \}\)\)\n        \];\n        setSearchData\(combined\);\n      \} catch \(e\) \{\n        console\.warn\('Error fetching search data', e\);\n      \}\n    \};\n    fetchSearchData\(\);/g;

const replacement = `const fetchSearchData = async () => {
      try {
        const tData = (await dbService.getAll('tournaments')) || [];
        const cData = (await dbService.getAll('clubs')) || [];
        const aData = (await dbService.getAll('associations')) || [];
        const uData = (await dbService.getAll('profiles')) || [];
        
        let combined = [
          ...tData.map((d: any) => ({ ...d, searchType: 'Tournament', name: d.name || 'Unnamed Tournament', icon: Trophy, color: 'indigo' })),
          ...cData.map((d: any) => ({ ...d, searchType: 'Club', name: d.name || 'Unnamed Club', icon: Shield, color: 'emerald' })),
          ...aData.map((d: any) => ({ ...d, searchType: 'Association', name: d.name || 'Unnamed Association', icon: Users, color: 'amber' })),
          ...uData.map((d: any) => ({ ...d, searchType: 'Athlete', name: d.displayName || d.username || d.name || 'Unknown Athlete', icon: User, color: 'slate' }))
        ];
        setSearchData(combined);
      } catch (e) {
        console.warn('Error fetching search data', e);
      }
    };
    fetchSearchData();
    
    // Subscribe to matches in real-time
    const unsubscribe = dbService.subscribe('matches', {}, (data) => {
      // Sort descending by created_at or updated_at or id
      const sorted = [...data].sort((a, b) => {
        const timeA = a.created_at || a.updated_at || a.id || '';
        const timeB = b.created_at || b.updated_at || b.id || '';
        return String(timeB).localeCompare(String(timeA));
      });
      setAllMatches(sorted);
      
      setSearchData(prev => {
        const nonMatches = prev.filter(item => item.searchType !== 'Match');
        return [
          ...nonMatches,
          ...sorted.map((d: any) => ({ ...d, searchType: 'Match', name: \`\${d.teamA || d.team_a || 'Team A'} vs \${d.teamB || d.team_b || 'Team B'}\`, icon: Play, color: 'red' }))
        ];
      });
    });
    
    return () => unsubscribe();`;

if (regex.test(code)) {
  fs.writeFileSync('src/pages/Home.tsx', code.replace(regex, replacement));
  console.log('Patched Home.tsx to subscribe to all matches.');
} else {
  console.log('Target not found for Home.tsx subscribe.');
}
