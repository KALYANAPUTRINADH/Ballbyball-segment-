const fs = require('fs');
let code = fs.readFileSync('src/components/MatchStreamer.tsx', 'utf-8');

const getEmbedUrlCode = `const getEmbedUrl = (url: string) => {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      let videoId = '';
      if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      } else if (urlObj.pathname.includes('/watch')) {
        videoId = urlObj.searchParams.get('v') || '';
      } else if (urlObj.pathname.includes('/live/')) {
        videoId = urlObj.pathname.split('/live/')[1];
      } else if (urlObj.pathname.includes('/embed/')) {
        return url;
      }
      if (videoId) {
        videoId = videoId.split('?')[0].split('&')[0];
        return \`https://www.youtube.com/embed/\${videoId}?autoplay=1&mute=1&playsinline=1\`;
      }
    }
  } catch (e) {
  }
  return url;
};
`;

if (!code.includes('const getEmbedUrl =')) {
  code = code.replace("export function MatchStreamer", getEmbedUrlCode + "\nexport function MatchStreamer");
}

code = code.replace(/const targetUrl = !isOwner \? 'https:\/\/assets\.mixkit\.co[^']*' : externalCameraUrl;/, `const targetUrl = !isOwner ? '' : externalCameraUrl;
        if (!isOwner) {
          // If viewer, we use youtube iframe instead of playing mock video
          return;
        }`);

code = code.replace(/<video \n\s*ref=\{videoRef\} \n\s*className="absolute inset-0 w-full h-full object-cover" \n\s*playsInline \n\s*muted \n\s*\/>/, `{(!isOwner && matchData?.youtubeUrl) ? (
          <iframe
            src={getEmbedUrl(matchData.youtubeUrl)}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          ></iframe>
        ) : (
          <video 
            ref={videoRef} 
            className={\`absolute inset-0 w-full h-full object-cover \${!isOwner ? 'hidden' : ''}\`}
            playsInline 
            muted 
          />
        )}
        {(!isOwner && !matchData?.youtubeUrl) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none bg-slate-900">
            <Radio className="w-16 h-16 text-slate-600 mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold text-slate-400">Stream Not Available</h2>
            <p className="text-slate-500 mt-2 text-center px-6">The broadcaster has not started the live stream yet or YouTube URL is not configured.</p>
          </div>
        )}`);

fs.writeFileSync('src/components/MatchStreamer.tsx', code);
