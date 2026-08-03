const fs = require('fs');
fs.writeFileSync('pm2-env.log', JSON.stringify(process.argv, null, 2));
