import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

content = content.replace("physicalObsWs.current.close();", "physicalObsWs.current.disconnect();")

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)

