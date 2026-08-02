const fs = require('fs');
let code = fs.readFileSync('src/middleware/auth.ts', 'utf-8');

const target = `  // WARNING: This mock token bypass is for the AI Studio preview environment ONLY.
  // In production, we strictly require valid Firebase ID tokens.
  const isMockToken = token === 'mock_token' || token.startsWith('mock_token:');
  if (isMockToken) {
    const parts = token.split(':');
    const mockUid = parts[1] || 'mock_user_123';
    
    // In preview mode, ensure mock admins can access everything
    const isMockAdmin = mockUid.includes('6305605194') || mockUid.includes('8688678943') || mockUid === 'mock_admin';
    
    req.user = {
      uid: mockUid,
      email: 'mock@example.com',
      name: 'Mock User',
      role: isMockAdmin ? 'admin' : 'user'
    };
    return next();
  }`;

if (code.includes(target)) {
  fs.writeFileSync('src/middleware/auth.ts', code.replace(target, ''));
  console.log('Removed mock token bypass from auth.ts');
} else {
  console.log('Could not find target in auth.ts');
}
