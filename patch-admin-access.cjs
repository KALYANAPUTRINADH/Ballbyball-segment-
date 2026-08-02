const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

code = code.replace(
  'const { user } = useAuth();',
  'const { user, isAdmin } = useAuth();\n  if (!isAdmin) return <div className="p-8 text-center text-red-500 font-bold">Access Denied: You must be an admin to view this page.</div>;'
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
