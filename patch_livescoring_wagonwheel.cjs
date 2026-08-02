const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

code = code.replace(
  "const [shotData, setShotData] = useState<{run: number, angle: number}[]>(savedState?.shotData ?? []);",
  "const [shotData, setShotData] = useState<{run: number, angle: number, distance?: number}[]>(savedState?.shotData ?? []);"
);

code = code.replace(
  "onSave={(run, angle) => {\n            setShotData(prev => [...prev, { run, angle }]);",
  "onSave={(run, angle, distance) => {\n            setShotData(prev => [...prev, { run, angle, distance }]);"
);

fs.writeFileSync('./src/components/LiveScoring.tsx', code);
