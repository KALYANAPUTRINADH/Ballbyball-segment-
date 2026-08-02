import re

# REVERT IN MATCHSTREAMER
with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

content = content.replace("matchData?.streamUrl || matchData?.youtubeUrl || ''", "matchData?.youtubeUrl || ''")
content = content.replace("matchData?.streamUrl", "matchData?.youtubeUrl")
content = content.replace("streamUrl:", "youtubeUrl:")
# We keep the placeholder change and text label change.
# Wait, we need to fix the HlsPlayer usage
old_render = r"\{\(!isOwner && matchData\?\.youtubeUrl\) \? \(\n\s*matchData\.youtubeUrl\.includes\('\.m3u8'\) \|\| matchData\.youtubeUrl\.includes\('\.mp4'\) \? \(\n\s*<HlsPlayer src=\{matchData\.youtubeUrl\} />\n\s*\) : \(\n\s*<iframe\n\s*src=\{getEmbedUrl\(matchData\.youtubeUrl\)\}\n\s*className=\"absolute inset-0 w-full h-full\"\n\s*allowFullScreen\n\s*allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\"\n\s*><\/iframe>\n\s*\)\n\s*\) : \("
# Let's just do a string replacement on src/components/MatchStreamer.tsx and src/components/LiveScoring.tsx using git checkout first since we didn't commit?
# We don't have git. Let's just sed/replace carefully.

