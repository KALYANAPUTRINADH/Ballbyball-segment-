const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

code = code.replace(
  /const profilesData = await dbService\.getAll\('profiles'\) \|\| \[\];[\s\S]*?const txData = await dbService\.getAll\('transactions'\) \|\| \[\];[\s\S]*?const performanceData = await dbService\.getAll\('performance_stats'\) \|\| \[\];/m,
  `
      let profilesData: any[] = [];
      let txData: any[] = [];
      let performanceData: any[] = [];
      
      try { profilesData = await dbService.getAll('profiles') || []; } catch(e) { console.warn('Failed to load profiles', e); }
      try { txData = await dbService.getAll('transactions') || []; } catch(e) { console.warn('Failed to load txs', e); }
      try { performanceData = await dbService.getAll('performance_stats') || []; } catch(e) { console.warn('Failed to load performance', e); }
`
);
fs.writeFileSync('src/components/AdminPanel.tsx', code);
