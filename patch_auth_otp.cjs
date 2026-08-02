const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf-8');

const target = `  const verifyOtp = async (confirmationResult: any, otp: string, username?: string) => {
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      
      // Update the user profile if a username is provided
      if (username) {
        // We'll update the Firestore profile directly
        await dbService.upsert('profiles', {
          id: user.uid,
          uid: user.uid,
          full_name: username,
          username: username,
          phone: user.phoneNumber || '',
          updated_at: new Date().toISOString()
        });
      }
    } catch (error: any) {`;

const replacement = `  const verifyOtp = async (confirmationResult: any, otp: string, username?: string) => {
    try {
      if (confirmationResult.isMockAdmin) {
         await confirmationResult.confirm(otp);
         return;
      }
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      
      // Update the user profile if a username is provided
      if (username) {
        // We'll update the Firestore profile directly
        await dbService.upsert('profiles', {
          id: user.uid,
          uid: user.uid,
          full_name: username,
          username: username,
          phone: user.phoneNumber || '',
          updated_at: new Date().toISOString()
        });
      }
    } catch (error: any) {`;

code = code.replace(target, replacement);
fs.writeFileSync('src/contexts/AuthContext.tsx', code);
console.log("Success");
