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
  const urls: string[] = [];

  // App relative proxy paths
  urls.push(`/live/${cleanKey}.flv`);
  urls.push(`/live?port=1935&app=live&stream=${cleanKey}`);

  // Parse hostname/IP from stored custom RTMP URL if user entered custom AWS/EC2 IP
  try {
    const match = rtmpUrl.match(/rtmp:\/\/([^/:]+)/);
    if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
      const host = match[1];
      urls.push(`http://${host}:8001/live/${cleanKey}.flv`);
      urls.push(`http://${host}:8001/live?port=1935&app=live&stream=${cleanKey}`);
      urls.push(`http://${host}:8000/live/${cleanKey}.flv`);
      urls.push(`http://${host}/live/${cleanKey}.flv`);
      urls.push(`https://${host}/live/${cleanKey}.flv`);
    }
  } catch (e) {}

  // Streamlify.in direct domain endpoints (HTTPS and HTTP)
  urls.push(`https://streamlify.in/live/${cleanKey}.flv`);
  urls.push(`http://streamlify.in:8001/live/${cleanKey}.flv`);
  urls.push(`http://streamlify.in:8001/live?port=1935&app=live&stream=${cleanKey}`);
  urls.push(`http://streamlify.in:8000/live/${cleanKey}.flv`);
  urls.push(`https://live.streamlify.in/live/${cleanKey}.flv`);

  return Array.from(new Set(urls));
};
