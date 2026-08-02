const fs = require('fs');
let code = fs.readFileSync('src/components/TermsConsentModal.tsx', 'utf-8');

const target = "<p><strong>5. Changes</strong><br/>Our Privacy Policy may change from time to time. We will post any privacy policy changes on this page.</p>";
const replacement = "<p><strong>5. Data Deletion Policy</strong><br/>You have the right to request the deletion of your personal data. You can delete your account and associated data directly from the application settings, or by contacting our support team. Upon deletion, your data will be permanently removed from our active systems and backups within a reasonable timeframe, subject to legal obligations.</p>\n            <p><strong>6. Changes</strong><br/>Our Privacy Policy may change from time to time. We will post any privacy policy changes on this page.</p>";

code = code.replace(target, replacement);
fs.writeFileSync('src/components/TermsConsentModal.tsx', code);
console.log("Success");
