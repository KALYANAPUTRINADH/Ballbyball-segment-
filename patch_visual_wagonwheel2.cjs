const fs = require('fs');
let code = fs.readFileSync('./src/components/VisualWagonWheel.tsx', 'utf-8');

code = code.replace(
  "x2={`${50 + 50 * Math.sin(shot.angle * (Math.PI / 180))}%`} \n              y2={`${50 - 50 * Math.cos(shot.angle * (Math.PI / 180))}%`}",
  "x2={`${50 + ((shot.distance ?? 100) / 2) * Math.sin(shot.angle * (Math.PI / 180))}%`} \n              y2={`${50 - ((shot.distance ?? 100) / 2) * Math.cos(shot.angle * (Math.PI / 180))}%`}"
);

fs.writeFileSync('./src/components/VisualWagonWheel.tsx', code);
