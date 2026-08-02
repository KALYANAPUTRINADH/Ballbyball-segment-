const fs = require('fs');

let content = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

// Remove handleRegisterPasskey, handlePasskeyLogin, handleCreateProfile, proceedWithLogin
content = content.replace(/const handleRegisterPasskey = async \(\) => \{[^]+?const handleCreateProfile = async \(e: React\.FormEvent\) => \{/g, 'const handleCreateProfile = async (e: React.FormEvent) => {');
content = content.replace(/const handleCreateProfile = async \(e: React\.FormEvent\) => \{[^]+?if \(\!user\) \{/g, 'if (!user) {');

fs.writeFileSync('src/pages/Profile.tsx', content);
