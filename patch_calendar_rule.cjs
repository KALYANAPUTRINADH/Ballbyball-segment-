const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const calendarRule = `    // 14. CALENDAR EVENTS
    match /calendar_events/{id} {
      allow read: if true;
      allow write: if isMock() || isSignedIn();
    }
`;
rules = rules.replace("  }\n}", "  }\n" + calendarRule + "}");
fs.writeFileSync('firestore.rules', rules);
console.log('Updated calendar_events');
