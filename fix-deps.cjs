const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (!pkg.dependencies) pkg.dependencies = {};
if (pkg.devDependencies) {
  for (const dep of Object.keys(pkg.devDependencies)) {
    pkg.dependencies[dep] = pkg.devDependencies[dep];
  }
  delete pkg.devDependencies;
}
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
