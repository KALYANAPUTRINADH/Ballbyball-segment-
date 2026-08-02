const fs = require('fs');
let content = fs.readFileSync('src/components/MatchStreamer.tsx', 'utf8');

// I'll replace `      }\n    }\n  };\n\n  useEffect(() => {`
// with `      }\n  };\n\n  useEffect(() => {`

content = content.replace("      }\n    }\n  };\n\n  useEffect(() => {", "      }\n  };\n\n  useEffect(() => {");
fs.writeFileSync('src/components/MatchStreamer.tsx', content);
