const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const oldProfilesRule = `    // 3. PROFILES
    match /profiles/{userId} {
      allow read: if true;
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }`;

const newProfilesRule = `    // 3. PROFILES
    match /profiles/{userId} {
      allow read, write: if true;
    }`;

rules = rules.replace(oldProfilesRule, newProfilesRule);

// Let's also fix the calendar events location
const calendarRuleOld = `  }
    // 14. CALENDAR EVENTS
    match /calendar_events/{id} {
      allow read: if true;
      allow write: if isMock() || isSignedIn();
    }
}`;
const calendarRuleNew = `    // 14. CALENDAR EVENTS
    match /calendar_events/{id} {
      allow read: if true;
      allow write: if isMock() || isSignedIn();
    }
  }
}`;
rules = rules.replace(calendarRuleOld, calendarRuleNew);

fs.writeFileSync('firestore.rules', rules);
console.log('Updated to allow all profiles temporarily');
