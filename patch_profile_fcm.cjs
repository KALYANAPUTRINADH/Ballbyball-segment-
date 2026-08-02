const fs = require('fs');

let code = fs.readFileSync('src/pages/Profile.tsx', 'utf-8');
const target = `                const token = await requestNotificationPermission();
                if (token && user) {
                  await dbService.update('profiles', user.uid, { fcm_token: token });
                  alert('Push notifications enabled!');
                } else {
                  alert('Failed to enable push notifications or permission denied.');
                }`;

const replace = `                try {
                  const token = await requestNotificationPermission();
                  if (token && user) {
                    await dbService.update('profiles', user.uid, { fcm_token: token });
                    if (token.startsWith('mock_token')) {
                      alert('Push notifications simulated! (Live push requires opening the app in a new tab)');
                    } else {
                      alert('Push notifications enabled successfully!');
                    }
                  } else {
                    alert('Failed to enable push notifications. Please ensure you are not in Incognito mode and have granted permission.');
                  }
                } catch (e) {
                  console.error(e);
                  alert('Error enabling notifications.');
                }`;

if (code.includes(target)) {
  fs.writeFileSync('src/pages/Profile.tsx', code.replace(target, replace));
  console.log('Patched Profile.tsx alert.');
} else {
  console.log('Target not found for Profile.tsx alert.');
}
