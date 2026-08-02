const fs = require('fs');

let code = fs.readFileSync('src/lib/database.ts', 'utf-8');

const importReplacement = `import { db, auth } from './firebase';
import LZString from 'lz-string';`;

code = code.replace("import { db, auth } from './firebase';", importReplacement);

const NO_COMPRESS_KEYS = [
  'id', 'owner_id', 'created_by', 'ownerId', 'author_id', 'user_id', 'status', 'sport_type', 
  'sportType', 'phone', 'email', 'role', 'teamId', 'name', 'type', 'created_at', 'updated_at', 
  'date', 'time', 'searchType', 'is_pro', 'pro_expiration_date', 'venue', 'title', 'team_a', 
  'team_b', 'teamA', 'teamB', 'match_id', 'tournament_id', 'player_id', 'club_id', 'mobileNumber',
  'username', 'displayName'
];

const sanitizeReplacement = `
const NO_COMPRESS_KEYS = ${JSON.stringify(NO_COMPRESS_KEYS)};

function compressValue(val: any): any {
  if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
    const str = JSON.stringify(val);
    if (str.length > 300) {
      const compressed = LZString.compressToBase64(str);
      if (compressed.length < str.length) {
         return { __c: true, d: compressed, t: 'o' };
      }
    }
  } else if (typeof val === 'string' && val.length > 300) {
    const compressed = LZString.compressToBase64(val);
    if (compressed.length < val.length) {
       return { __c: true, d: compressed, t: 's' };
    }
  }
  return val;
}

function sanitizeAndCompressPayload(payload: any, isRoot = true): any {
  if (payload === undefined) return undefined;
  if (!payload || typeof payload !== 'object' || payload instanceof Date) return payload;
  
  if (Array.isArray(payload)) {
    if (isRoot) {
      return payload.map(item => sanitizeAndCompressPayload(item, false));
    } else {
      const cleanedArray = payload.map(item => sanitizeAndCompressPayload(item, false)).filter(item => item !== undefined);
      return compressValue(cleanedArray);
    }
  }
  
  const sanitized: any = {};
  Object.keys(payload).forEach(key => {
    const value = payload[key];
    if (value !== undefined) {
      if (isRoot) {
        if (NO_COMPRESS_KEYS.includes(key)) {
           sanitized[key] = sanitizeAndCompressPayload(value, false);
        } else {
           // We clean undefined values first
           const cleaned = sanitizeAndCompressPayload(value, false);
           sanitized[key] = compressValue(cleaned);
        }
      } else {
        sanitized[key] = sanitizeAndCompressPayload(value, false);
      }
    }
  });
  
  if (!isRoot) {
    return sanitized; // Will be compressed by parent's compressValue if large
  }
  
  return sanitized;
}

function decompressValue(val: any): any {
  if (val && typeof val === 'object' && val.__c === true && val.d) {
    const decompressed = LZString.decompressFromBase64(val.d);
    if (decompressed !== null) {
      if (val.t === 'o') {
        try {
          return JSON.parse(decompressed);
        } catch (e) {
          return decompressed;
        }
      } else {
        return decompressed;
      }
    }
  }
  if (Array.isArray(val)) {
    return val.map(decompressValue);
  } else if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
    const res: any = {};
    for (const k of Object.keys(val)) {
      res[k] = decompressValue(val[k]);
    }
    return res;
  }
  return val;
}

function sanitizePayload(payload: any): any {
  return sanitizeAndCompressPayload(payload, true);
}

function decompressPayload(payload: any): any {
  if (!payload || typeof payload !== 'object') return payload;
  return decompressValue(payload);
}
`;

// Replace sanitizePayload function block entirely
code = code.replace(/function sanitizePayload\(payload: any\): any \{[\s\S]*?return sanitized;\n\}/, sanitizeReplacement.trim());

// Now patch the decompressions
code = code.replace(/const items = snapshot\.docs\.map\(doc => \(\{ id: doc\.id, \.\.\.doc\.data\(\) \}\)\);/g, "const items = snapshot.docs.map(doc => decompressPayload({ id: doc.id, ...doc.data() }));");
code = code.replace(/callback\(\{ id: snapshot\.id, \.\.\.snapshot\.data\(\) \}\);/g, "callback(decompressPayload({ id: snapshot.id, ...snapshot.data() }));");
code = code.replace(/return docSnap\.exists\(\) \? \{ id: docSnap\.id, \.\.\.docSnap\.data\(\) \} : null;/g, "return docSnap.exists() ? decompressPayload({ id: docSnap.id, ...docSnap.data() }) : null;");
code = code.replace(/return querySnapshot\.docs\.map\(doc => \(\{ id: doc\.id, \.\.\.doc\.data\(\) \}\)\);/g, "return querySnapshot.docs.map(doc => decompressPayload({ id: doc.id, ...doc.data() }));");

fs.writeFileSync('src/lib/database.ts', code);
console.log('Database patched for compression!');
