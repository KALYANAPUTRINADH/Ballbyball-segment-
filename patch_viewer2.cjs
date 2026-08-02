const fs = require('fs');
let code = fs.readFileSync('src/components/MatchStreamer.tsx', 'utf-8');

code = code.replace(
  "if (data) setMatchData(data);",
  "if (data) {\n        setMatchData(data);\n        if (data.is_live) setIsLive(true);\n      }"
);

code = code.replace(
  "setMatchData(newData);",
  "setMatchData(newData);\n      if (newData && newData.is_live !== undefined) {\n        setIsLive(newData.is_live);\n      }"
);

fs.writeFileSync('src/components/MatchStreamer.tsx', code);
console.log("Success");
