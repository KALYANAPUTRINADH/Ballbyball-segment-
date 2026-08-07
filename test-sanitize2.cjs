const LZString = require('lz-string');
const NO_COMPRESS_KEYS = ["id","owner_id","created_by","ownerId","author_id","user_id","status","sport_type","sportType","phone","email","role","teamId","name","type","created_at","updated_at","date","time","searchType","is_pro","pro_expiration_date","venue","title","team_a","team_b","teamA","teamB","match_id","tournament_id","player_id","club_id","mobileNumber","username","displayName"];

function compressValue(val) {
  try {
    if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
      if (val.__c === true) return val;
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
  } catch (e) {
    console.warn("Compression failed", e);
  }
  return val;
}

function sanitizeAndCompressPayload(payload, isRoot = true) {
  if (payload === undefined) return undefined;
  if (!payload || typeof payload !== 'object' || payload instanceof Date) return payload;
  
  if (Array.isArray(payload)) {
    const cleanedArray = payload.map(item => sanitizeAndCompressPayload(item, false)).filter(item => item !== undefined);
    return cleanedArray;
  }
  
  const sanitized = {};
  Object.keys(payload).forEach(key => {
    const value = payload[key];
    if (value !== undefined) {
      const cleaned = sanitizeAndCompressPayload(value, false);
      if (isRoot && !NO_COMPRESS_KEYS.includes(key)) {
         sanitized[key] = compressValue(cleaned);
      } else {
         sanitized[key] = cleaned;
      }
    }
  });
  
  return sanitized;
}

const largeArray = new Array(100).fill({ a: 1, b: 2 });
const payload = {
  id: "123",
  teamA: "India",
  balls: largeArray
};

console.log(sanitizeAndCompressPayload(payload, true).id === "123");
console.log(sanitizeAndCompressPayload(payload, true).teamA === "India");
