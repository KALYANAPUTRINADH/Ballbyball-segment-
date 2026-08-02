import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

content = content.replace('Simulcast to YouTube / OBS', 'YouTube Simulcast')

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)

