const fs = require('fs');
let code = fs.readFileSync('./src/services/ScoreboardService.ts', 'utf-8');

code = code.replace(
  "return ['runs', 'wickets', 'overs', 'balls', 'striker', 'nonStriker', 'bowler', 'target', 'innings', 'thisOver', 'strikerStats', 'nonStrikerStats', 'bowlerStats', 'deliveries'];",
  "return ['runs', 'wickets', 'overs', 'balls', 'striker', 'nonStriker', 'bowler', 'target', 'innings', 'thisOver', 'strikerStats', 'nonStrikerStats', 'bowlerStats', 'deliveries', 'matchFormat', 'inningsScores'];"
);

fs.writeFileSync('./src/services/ScoreboardService.ts', code);
