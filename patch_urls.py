import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

# Replace local rtmp URLs with streamlify URL
content = content.replace("rtmp://${window.location.hostname || 'localhost'}/live", "rtmp://live.streamlify.in/live")

# Change "YouTube URL" to "Stream URL (HLS / YouTube)" where applicable
content = content.replace("value={matchData?.youtubeUrl || ''}", "value={matchData?.streamUrl || matchData?.youtubeUrl || ''}")
content = content.replace("matchData?.youtubeUrl", "matchData?.streamUrl")
content = content.replace("youtubeUrl:", "streamUrl:")
content = content.replace("placeholder=\"https://youtube.com/live/...\"", "placeholder=\"https://live.streamlify.in/.../index.m3u8\"")
content = content.replace("YouTube URL is not configured", "Stream URL is not configured")

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)
