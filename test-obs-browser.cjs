const crypto = require('crypto');

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest();
}

const base64Encode = (bytes) => {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return Buffer.from(binary, 'binary').toString('base64');
};

const passSaltHash = sha256("supersecretpassword123" + "F928j+Jp");
const passSaltBase64 = base64Encode(passSaltHash);
const finalHash = sha256(passSaltBase64 + "Z7B/0oZ9T=");
const authResponse = base64Encode(finalHash);

console.log(authResponse);
