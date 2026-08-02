const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

let idx1 = code.indexOf('  } catch (error: any) {\n    console.error("Database query failed:", error);\n    res.status(500).json({ error: error.message });\n  }\n});');
if (idx1 !== -1) {
  code = code.substring(0, idx1) + code.substring(idx1 + 130);
}

fs.writeFileSync('server.ts', code);
