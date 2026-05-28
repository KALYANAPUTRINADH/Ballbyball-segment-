const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const t = `  const getCleanDeliveryTimestamps = (d: Delivery) => {
    let cleanStart = d.startTime;
    let cleanEnd = d.endTime;

    // Safety padding
    cleanStart = Math.max(0, cleanStart - 0.5);
    cleanEnd = cleanEnd + 1.0;

    return { startTime: cleanStart, endTime: cleanEnd };
  };

  const handleBulkClipCollection =`;

code = code.replace('  const handleBulkClipCollection =', t);
fs.writeFileSync('src/App.tsx', code);
