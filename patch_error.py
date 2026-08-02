import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

content = content.replace('console.error("OBS Connection Error:", err);', 'console.warn("OBS Connection Error:", err);')

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)
