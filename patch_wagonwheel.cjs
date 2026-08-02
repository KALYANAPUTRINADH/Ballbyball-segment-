const fs = require('fs');
let code = fs.readFileSync('./src/components/WagonWheel.tsx', 'utf-8');

code = code.replace(
  "onSave: (run: number, angle: number) => void;",
  "onSave: (run: number, angle: number, distance: number) => void;"
);

code = code.replace(
  "const [selectedAngle, setSelectedAngle] = useState<number | null>(null);",
  "const [selectedAngle, setSelectedAngle] = useState<number | null>(null);\n  const [selectedDistance, setSelectedDistance] = useState<number | null>(null);"
);

code = code.replace(
  "setSelectedAngle(angle);",
  "setSelectedAngle(angle);\n    \n    const maxRadius = rect.width / 2;\n    const rawDistance = Math.sqrt(x * x + y * y);\n    const distance = Math.min(100, (rawDistance / maxRadius) * 100);\n    setSelectedDistance(distance);"
);

code = code.replace(
  "{selectedAngle !== null && (\n                <line \n                  x1=\"50%\" \n                  y1=\"50%\" \n                  x2={`${50 + 50 * Math.sin(selectedAngle * (Math.PI / 180))}%`} \n                  y2={`${50 - 50 * Math.cos(selectedAngle * (Math.PI / 180))}%`} \n                  stroke={run === 4 ? '#3b82f6' : run === 6 ? '#8b5cf6' : '#ef4444'} \n                  strokeWidth=\"3\"\n                />\n              )}",
  "{selectedAngle !== null && selectedDistance !== null && (\n                <g>\n                  <line \n                    x1=\"50%\" \n                    y1=\"50%\" \n                    x2={`${50 + (selectedDistance / 2) * Math.sin(selectedAngle * (Math.PI / 180))}%`} \n                    y2={`${50 - (selectedDistance / 2) * Math.cos(selectedAngle * (Math.PI / 180))}%`} \n                    stroke={run === 4 ? '#3b82f6' : run === 6 ? '#8b5cf6' : '#ef4444'} \n                    strokeWidth=\"3\"\n                  />\n                  <circle\n                    cx={`${50 + (selectedDistance / 2) * Math.sin(selectedAngle * (Math.PI / 180))}%`}\n                    cy={`${50 - (selectedDistance / 2) * Math.cos(selectedAngle * (Math.PI / 180))}%`}\n                    r=\"4\"\n                    fill={run === 4 ? '#3b82f6' : run === 6 ? '#8b5cf6' : '#ef4444'}\n                  />\n                </g>\n              )}"
);

code = code.replace(
  "onSave(run, selectedAngle)}",
  "onSave(run, selectedAngle, selectedDistance!)}"
);

fs.writeFileSync('./src/components/WagonWheel.tsx', code);
