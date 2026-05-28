const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const newGetClipFilename = `  const getClipFilename = (d: Delivery, passedExt: string = "mp4"): string => {
    let ext = passedExt;
    if (customVideoMeta && customVideoMeta.fileName) {
      const parts = customVideoMeta.fileName.split(".");
      if (parts.length > 1) {
        ext = parts.pop();
      }
    } else if (selectedMatch && selectedMatch.videoUrl && !selectedMatch.videoUrl.startsWith("blob:")) {
      const urlParts = selectedMatch.videoUrl.split(".");
      if (urlParts.length > 1) {
        const extRaw = urlParts.pop().split("?")[0].split("#")[0]; // remove query params
        if (extRaw && extRaw.length <= 4) {
          ext = extRaw;
        }
      }
    }

    const inningsVal = d.innings || (selectedMatch && d.startTime >= selectedMatch.duration * 0.6 ? 2 : 1);
    const inningsPrefix = inningsVal === 4 ? "SuperOver_2" : inningsVal === 3 ? "SuperOver_1" : inningsVal === 2 ? "2nd_Innings" : "1st_Innings";
    
    // Cricket format: over 1 is "0.x", so subtract 1.
    const displayOver = Math.max(0, d.over - 1);
    const strOver = String(displayOver);
    const overBall = \`\${strOver}.\${d.ball}\`;
    
    let suffix = "";
    const outcomeLower = (d.ballOutcome || "").toLowerCase();
    const descLower = (d.description || "").toLowerCase();
    
    const isPractice = !!d.isPractice || outcomeLower.includes("practice") || descLower.includes("practice") || descLower.includes("warm-up");
    const isWide = !!d.isWide || outcomeLower.includes("wide") || descLower.includes("wide");
    const isNoBall = !!d.isNoBall || outcomeLower.includes("no ball") || outcomeLower.includes("noball") || descLower.includes("no ball") || descLower.includes("noball");
    
    if (isPractice) {
      return \`\${inningsPrefix}_practice_clip_\${Math.round(d.startTime)}s.\${ext}\`;
    } else if (isWide) {
      suffix = "_wide";
    } else if (isNoBall) {
      suffix = "_noball";
    } else if (d.wicket) {
      suffix = "_wicket";
    } else if (d.runs >= 6) {
      suffix = "_six";
    } else if (d.runs >= 4) {
      suffix = "_four";
    }

    return \`\${inningsPrefix}_Over_\${overBall}\${suffix}.\${ext}\`;
  };`;

// replace the old one
const startIndex = code.indexOf('  const getClipFilename =');
const endIndex = code.indexOf('  const handleBulkClipCollection =', startIndex);
if (startIndex !== -1 && endIndex !== -1) {
    code = code.slice(0, startIndex) + newGetClipFilename + '\n\n' + code.slice(endIndex);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Successfully replaced getClipFilename");
} else {
    console.log("Could not find getClipFilename");
}
