export const getStoredRtmpServerUrl = (): string => {
  if (typeof window === 'undefined') return 'rtmp://streamlify.in:1935/live';
  const stored = localStorage.getItem('custom_rtmp_server_url');
  if (stored && stored.trim()) return stored.trim();
  
  // Default to current hostname if valid custom domain/IP, else default to streamlify.in
  const hostname = window.location.hostname;
  if (hostname && hostname !== 'localhost' && !hostname.includes('run.app')) {
    return `rtmp://${hostname}:1935/live`;
  }
  return `rtmp://streamlify.in:1935/live`;
};

export const setStoredRtmpServerUrl = (url: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('custom_rtmp_server_url', url.trim());
  }
};

export const getCandidateFlvUrls = (streamKey: string): string[] => {
  if (!streamKey) return [];
  const raw = streamKey.trim();

  // If raw is already a full http/https video or flv/hls URL
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return [raw];
  }

  // Extract clean key
  let cleanKey = raw;
  if (cleanKey.includes('/')) {
    const parts = cleanKey.split('/');
    cleanKey = parts[parts.length - 1] || raw;
  }
  cleanKey = cleanKey.replace(/\.flv$/i, '').trim();

  const rtmpUrl = getStoredRtmpServerUrl();
  const rawUrls: string[] = [];

  // App relative proxy paths (HTTPS safe - avoids Mixed Content blocking)
  rawUrls.push(`/live/${cleanKey}.flv`);
  rawUrls.push(`/live/${cleanKey}.flv?flvHost=streamlify.in:8001`);
  rawUrls.push(`/live/${cleanKey}.flv?flvHost=streamlify.in:8000`);
  rawUrls.push(`/live/${cleanKey}.flv?flvHost=3.93.170.184:8001`);
  rawUrls.push(`/live?port=1935&app=live&stream=${cleanKey}`);

  // Parse hostname/IP from stored custom RTMP URL if user entered custom AWS/EC2 IP
  try {
    const match = rtmpUrl.match(/rtmp:\/\/([^/:]+)/);
    if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
      const host = match[1];
      rawUrls.push(`/live/${cleanKey}.flv?flvHost=${host}:8001`);
      rawUrls.push(`/live/${cleanKey}.flv?flvHost=${host}:8000`);
      rawUrls.push(`https://${host}/live/${cleanKey}.flv`);
      rawUrls.push(`http://${host}:8001/live/${cleanKey}.flv`);
    }
  } catch (e) {}

  // AWS EC2 Public IP (3.93.170.184) & streamlify.in endpoints
  rawUrls.push(`https://streamlify.in/live/${cleanKey}.flv`);
  rawUrls.push(`http://streamlify.in:8001/live/${cleanKey}.flv`);
  rawUrls.push(`http://3.93.170.184:8001/live/${cleanKey}.flv`);

  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

  // Filter out direct HTTP URLs when on HTTPS to avoid browser Mixed Content blocking
  const finalUrls = rawUrls.filter(u => {
    if (isHttps && u.startsWith('http://')) {
      return false;
    }
    return true;
  });

  return Array.from(new Set(finalUrls));
};
