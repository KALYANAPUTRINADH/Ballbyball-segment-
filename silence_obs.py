import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

# Replace the specific console.warn lines
content = content.replace('console.warn("OBS Connection Error:", err);', '// console.warn silenced to avoid spam')
content = content.replace('console.warn("OBS Connection Catch Error:", e);', '// console.warn silenced to avoid spam')
content = content.replace('console.warn("OBS Connection Error:", err)', '// console.warn silenced')
content = content.replace('console.warn("OBS Connection Catch Error:", e)', '// console.warn silenced')

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)
