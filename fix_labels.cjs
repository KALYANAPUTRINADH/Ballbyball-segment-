const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('const getBallLabel = (d: Delivery): string => {')) {
  const insertPos = code.indexOf('const getClipFilename');
  const helper = `  const getBallLabel = (d: Delivery): string => {
    const displayOver = Math.max(0, d.over - 1);
    const outcomeLower = (d.ballOutcome || "").toLowerCase();
    const descLower = (d.description || "").toLowerCase();
    const isWide = !!d.isWide || outcomeLower.includes("wide") || descLower.includes("wide");
    const isNoBall = !!d.isNoBall || outcomeLower.includes("no ball") || outcomeLower.includes("noball") || descLower.includes("no ball") || descLower.includes("noball");
    
    let suffix = "";
    if (isWide) suffix = "_wide";
    else if (isNoBall) suffix = "_noball";
    
    return \`\${displayOver}.\${d.ball}\${suffix}\`;
  };

  `;
  code = code.slice(0, insertPos) + helper + code.slice(insertPos);
}

code = code.replaceAll('${Math.max(0, d.over - 1)}.${d.ball}', '${getBallLabel(d)}');

// Address specific cases that might use displayOver
code = code.replaceAll('`${displayOver}.${d.ball}`', 'getBallLabel(d)');
code = code.replaceAll('`Over ${displayOver}.${d.ball}`', '`Over ${getBallLabel(d)}`');
code = code.replaceAll('name: `Over ${displayOver}.${d.ball}`', 'name: `Over ${getBallLabel(d)}`');

fs.writeFileSync('src/App.tsx', code);
