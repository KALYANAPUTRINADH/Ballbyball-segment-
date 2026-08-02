const fs = require('fs');
let profile = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

// Add import
profile = profile.replace(
  "import { TermsConsentModal } from '../components/TermsConsentModal';",
  "import { TermsConsentModal } from '../components/TermsConsentModal';\nimport { SubscriptionManagement } from '../components/SubscriptionManagement';"
);

// Inject SubscriptionManagement before Payment History
profile = profile.replace(
  "{/* Payment History Section */}",
  "<SubscriptionManagement />\n        {/* Payment History Section */}"
);

fs.writeFileSync('src/pages/Profile.tsx', profile);
console.log('Modified Profile.tsx');
