const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

const targetStr = `        deliveries: [...deliveries, deliveryRecord],
        target,
        innings,
        isExtraTime,
        lastAutoSave: new Date().toISOString()
      }, sportType);`;

const newCode = `        deliveries: [...deliveries, deliveryRecord],
        target,
        innings,
        isExtraTime,
        playerStats,
        lastAutoSave: new Date().toISOString()
      }, sportType);`;

code = code.replace(targetStr, newCode);
fs.writeFileSync('./src/components/LiveScoring.tsx', code);
