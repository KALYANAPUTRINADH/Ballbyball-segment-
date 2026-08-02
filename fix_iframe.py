import re

with open('src/components/LiveScoring.tsx', 'r') as f:
    content = f.read()

old_render = r"\) : youtubeUrl \? \(\n\s*<iframe\n\s*src=\{getEmbedUrl\(youtubeUrl\)\}\n\s*className=\"absolute inset-0 w-full h-full\"\n\s*allowFullScreen\n\s*allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\"\n\s*><\/iframe>\n\s*\) : \("

new_render = """) : youtubeUrl ? (
              youtubeUrl.includes('.m3u8') || youtubeUrl.includes('.mp4') ? (
                <HlsPlayer src={youtubeUrl} />
              ) : (
                <iframe
                  src={getEmbedUrl(youtubeUrl)}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                ></iframe>
              )
            ) : ("""

content = re.sub(old_render, new_render, content, flags=re.DOTALL)

with open('src/components/LiveScoring.tsx', 'w') as f:
    f.write(content)
