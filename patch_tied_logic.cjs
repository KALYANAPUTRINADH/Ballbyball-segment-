const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

const isTiedLogic = `
  const isTied = sportType === 'Cricket' && target && runs === target - 1 && ((matchFormat === 'Test Match' && innings === 4) || (matchFormat !== 'Test Match' && innings % 2 === 0));
`;

code = code.replace(
  "const [ownerName, setOwnerName] = useState('the Match Creator');",
  "const [ownerName, setOwnerName] = useState('the Match Creator');" + isTiedLogic
);

code = code.replace(
  "awards: awards,",
  "awards: isTied ? { ...awards, matchResult: 'Draw' } : awards,"
);

code = code.replace(
  "awards: awards });",
  "awards: isTied ? { ...awards, matchResult: 'Draw' } : awards });"
);

code = code.replace(
  "status: 'Completed', awards }",
  "status: 'Completed', awards: isTied ? { ...awards, matchResult: 'Draw' } : awards }"
);

fs.writeFileSync('./src/components/LiveScoring.tsx', code);
