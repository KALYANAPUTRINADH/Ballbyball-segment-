const fs = require('fs');
let code = fs.readFileSync('src/components/LiveScoring.tsx', 'utf-8');

const oldSelect = `{sportType === 'Cricket' && (
                        <select`;
const newSelect = `{true && (
                        <select`;

code = code.replace(oldSelect, newSelect);
fs.writeFileSync('src/components/LiveScoring.tsx', code);
