const fs = require('fs');
let code = fs.readFileSync('src/pages/MyCricket.tsx', 'utf-8');

const target = "    if (!user) {\n      setMatches([]);\n      setLoadingMatches(false);\n      return;\n    }\n";
code = code.replace(target, "");
code = code.replace("  }, [user]);", "  }, []);");

fs.writeFileSync('src/pages/MyCricket.tsx', code);
