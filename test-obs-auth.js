const crypto = require('crypto');

function getAuthResponse(password, salt, challenge) {
  const secret = crypto.createHash('sha256').update(password + salt).digest('base64');
  return crypto.createHash('sha256').update(secret + challenge).digest('base64');
}
console.log(getAuthResponse("supersecretpassword123", "F928j+Jp", "Z7B/0oZ9T="));
