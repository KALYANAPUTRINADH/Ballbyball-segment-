const fs = require('fs');
let code = fs.readFileSync('src/components/LiveScoring.tsx', 'utf-8');

// Add sync to viewer
code = code.replace(/if \(data.youtubeUrl !== undefined\) setYoutubeUrl\(data.youtubeUrl\);/, "if (data.youtubeUrl !== undefined) setYoutubeUrl(data.youtubeUrl);\n          if (data.scoreboardTheme !== undefined) setScoreboardTheme(data.scoreboardTheme);");

// Add sync from owner
const themeSelectOld = `                          onChange={(e) => {
                            setScoreboardTheme(e.target.value);
                            localStorage.setItem('scoreboard_theme', e.target.value);
                          }}`;
                          
const themeSelectNew = `                          onChange={(e) => {
                            const val = e.target.value;
                            setScoreboardTheme(val);
                            localStorage.setItem('scoreboard_theme', val);
                            if (matchId && isOwner) {
                              scoreboardService.updateScore(matchId, { scoreboardTheme: val }, sportType);
                            }
                          }}`;

code = code.replace(themeSelectOld, themeSelectNew);

fs.writeFileSync('src/components/LiveScoring.tsx', code);
