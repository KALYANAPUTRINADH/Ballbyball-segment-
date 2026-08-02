const fs = require('fs');
let code = fs.readFileSync('./src/components/ScoreboardWidget.tsx', 'utf-8');

code = code.replace(
  "  isExtraTime?: boolean;\n}",
  "  isExtraTime?: boolean;\n  umpireSignal?: string | null;\n}"
);

code = code.replace(
  "  isExtraTime = false\n}: ScoreboardWidgetProps) {",
  "  isExtraTime = false,\n  umpireSignal = null\n}: ScoreboardWidgetProps) {"
);

fs.writeFileSync('./src/components/ScoreboardWidget.tsx', code);
