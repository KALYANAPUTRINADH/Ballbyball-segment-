const NO_COMPRESS_KEYS = ["id","owner_id","created_by","ownerId","author_id","user_id","status","sport_type","sportType","phone","email","role","teamId","name","type","created_at","updated_at","date","time","searchType","is_pro","pro_expiration_date","venue","title","team_a","team_b","teamA","teamB","match_id","tournament_id","player_id","club_id","mobileNumber","username","displayName"];

function compressValue(val) {
  return val; // mock
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

console.log(sanitizeAndCompressPayload({ id: "123", team_a: "A", runs: 10 }));
