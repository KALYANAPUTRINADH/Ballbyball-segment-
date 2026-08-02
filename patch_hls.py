import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

# Add import Hls from 'hls.js';
if "import Hls from" not in content:
    content = content.replace("import React, { useState, useRef, useEffect } from 'react';", "import React, { useState, useRef, useEffect } from 'react';\nimport Hls from 'hls.js';")

# Need to update viewer mode conditionally
# We will use a separate Video Component for HLS/MP4, and iframe for YouTube
# If matchData.streamUrl ends with .m3u8 we use HlsPlayer

hls_component = """
const HlsPlayer = ({ src }: { src: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    
    if (Hls.isSupported() && src.includes('.m3u8')) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.log('Auto-play prevented', e));
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(e => console.log('Auto-play prevented', e));
      });
    } else {
      video.src = src;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 w-full h-full object-contain bg-black"
      controls
      playsInline
      autoPlay
    />
  );
};
"""

if "const HlsPlayer =" not in content:
    content = content.replace("const getEmbedUrl =", hls_component + "\nconst getEmbedUrl =")

# Update rendering logic
# Old rendering logic:
#         {(!isOwner && matchData?.streamUrl) ? (
#           <iframe
#             src={getEmbedUrl(matchData.youtubeUrl)}
#             className="absolute inset-0 w-full h-full"
#             allowFullScreen
#             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
#           ></iframe>
#         ) : (
#           <video 

# Wait, we changed matchData.youtubeUrl to matchData.streamUrl in the placeholder but we might have missed replacing matchData.youtubeUrl in the getEmbedUrl call!
old_render = r"\{\(!isOwner && matchData\?\.streamUrl\) \? \(\n\s*<iframe\n\s*src=\{getEmbedUrl\(matchData\.youtubeUrl\)\}\n\s*className=\"absolute inset-0 w-full h-full\"\n\s*allowFullScreen\n\s*allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\"\n\s*></iframe>\n\s*\) : \("

new_render = """{(!isOwner && matchData?.streamUrl) ? (
          matchData.streamUrl.includes('.m3u8') || matchData.streamUrl.includes('.mp4') ? (
            <HlsPlayer src={matchData.streamUrl} />
          ) : (
            <iframe
              src={getEmbedUrl(matchData.streamUrl)}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            ></iframe>
          )
        ) : ("""

content = re.sub(old_render, new_render, content, flags=re.DOTALL)

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)
