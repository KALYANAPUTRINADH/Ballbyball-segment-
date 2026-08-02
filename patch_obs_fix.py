import re
with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

# Replace any UI text mentioning FFMPEG with WebRTC
content = content.replace("FFMPEG Web Workers Active", "WebRTC Viewers connected:")
content = content.replace("FFMPEG initialization failed", "Broadcast initialization failed")

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)
