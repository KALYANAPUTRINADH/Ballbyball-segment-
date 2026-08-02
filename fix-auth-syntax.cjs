const fs = require('fs');

let content = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

content = content.replace(/const verifyAdmin = async \(\) => \{[^]+?verifyAdmin\(\);/g, `
      const verifyAdmin = async () => {
        try {
          const profile = await dbService.get('profiles', user.uid);
          const role = profile?.role || 'user';
          const phone = user.phoneNumber || '';
          const cleanPhoneNum = phone.replace(/\\D/g, '');
          const adminPhones = ['6305605194', '8688678943'];
          const phoneIsAdmin = adminPhones.some(p => cleanPhoneNum.endsWith(p) || cleanPhoneNum === p || user.uid.includes(p));
          
          setIsAdmin(role === 'admin' || phoneIsAdmin);
        } catch (verifyErr) {
          console.warn("Proxy verification failed", verifyErr);
        }
      };
      verifyAdmin();
`);

fs.writeFileSync('src/contexts/AuthContext.tsx', content);
