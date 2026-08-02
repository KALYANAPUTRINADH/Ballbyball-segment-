const fs = require('fs');

let content = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

// Replace verifyAdmin
content = content.replace(/const verifyAdmin = async \(\) => \{[^]+?try \{[^]+?const verifyRes = await fetch\('\/api\/admin\/verify-role'[^]+?\}\);/g, `
      const verifyAdmin = async () => {
        try {
          const profile = await dbService.get('profiles', user.uid);
          const role = profile?.role || 'user';
          const cleanPhone = (user.phoneNumber || '').replace(/\\D/g, '');
          const adminPhones = ['6305605194', '8688678943'];
          const isPhoneAdmin = adminPhones.some(p => cleanPhone.endsWith(p) || cleanPhone === p || user.uid.includes(p));
          
          if (role === 'admin' || isPhoneAdmin) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
`);

// Replace /api/users/sync
content = content.replace(/await fetch\('\/api\/users\/sync'[^]+?\}\);/g, `
      await dbService.upsert('profiles', {
        id: mappedUser.uid,
        full_name: mappedUser.displayName || '',
        phone: mappedUser.phoneNumber || ''
      });
`);

fs.writeFileSync('src/contexts/AuthContext.tsx', content);
