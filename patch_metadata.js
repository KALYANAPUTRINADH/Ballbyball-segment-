const fs = require('fs');
const metadata = JSON.parse(fs.readFileSync('metadata.json', 'utf8'));
if (!metadata.requestFramePermissions.includes('display-capture')) {
  metadata.requestFramePermissions.push('display-capture');
}
fs.writeFileSync('metadata.json', JSON.stringify(metadata, null, 2));
