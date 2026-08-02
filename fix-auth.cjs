const fs = require('fs');

let profile = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

// Remove webauthn imports
profile = profile.replace(/import \{ startRegistration, startAuthentication \} from '@simplewebauthn\/browser';/g, '');

// Replace passkey functions and terms logic with simpler logic
// Or I can just edit the file using sed/awk.
