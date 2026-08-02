const fs = require('fs');
const files = [
  'src/components/PaymentModal.tsx',
  'src/components/MobileLayout.tsx',
  'src/components/ProUpgradeModal.tsx'
];

for (let file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/const verifyRes = await fetch\('\/api\/payments\/verify'[^]+?\}\);/g, `
    await dbService.update('profiles', user.uid, { is_pro: true });
    // Record transaction
    await dbService.create('transactions', {
      user_id: user.uid,
      amount: 49,
      currency: 'INR',
      status: 'completed',
      description: 'Streamlify Pro Subscription',
      created_at: new Date().toISOString()
    });
  `);
  content = content.replace(/await fetch\('\/api\/payments\/verify'[^]+?\}\);/g, `
    await dbService.update('profiles', user.uid, { is_pro: true });
    await dbService.create('transactions', {
      user_id: user.uid,
      amount: 49,
      currency: 'INR',
      status: 'completed',
      description: 'Streamlify Pro Subscription',
      created_at: new Date().toISOString()
    });
  `);
  fs.writeFileSync(file, content);
}
