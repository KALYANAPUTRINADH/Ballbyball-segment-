import re

with open('src/components/LiveScoring.tsx', 'r') as f:
    content = f.read()

# Add import Hls from 'hls.js';
if "import Hls from" not in content:
    content = content.replace("import React, { useState, useEffect, useRef } from 'react';", "import React, { useState, useEffect, useRef } from 'react';\nimport Hls from 'hls.js';")

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

# Rename youtubeUrl references in JSX to "streamUrl"
content = content.replace("youtubeUrl:", "streamUrl:")
content = content.replace("data.youtubeUrl", "data.streamUrl")
content = content.replace("youtubeUrl: state.youtubeUrl", "streamUrl: state.streamUrl")
content = content.replace("youtubeUrl", "streamUrl")
content = content.replace("setYoutubeUrl", "setStreamUrl")
content = content.replace("YouTube URL", "Stream URL")

# Now update the iframe rendering for streamUrl
old_render = r"streamUrl \? \(\n\s*<iframe\n\s*src=\{getEmbedUrl\(streamUrl\)\}\n\s*className=\"absolute inset-0 w-full h-full\"\n\s*allowFullScreen\n\s*allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\"\n\s*/>\n\s*\) : \("

new_render = """streamUrl ? (
                streamUrl.includes('.m3u8') || streamUrl.includes('.mp4') ? (
                  <HlsPlayer src={streamUrl} />
                ) : (
                  <iframe
                    src={getEmbedUrl(streamUrl)}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  />
                )
              ) : ("""

content = re.sub(old_render, new_render, content, flags=re.DOTALL)

with open('src/components/LiveScoring.tsx', 'w') as f:
    f.write(content)
