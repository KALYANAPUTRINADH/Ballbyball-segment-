import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

pattern = r"                    <div>\n                        <label className=\"block text-xs font-medium text-slate-400 mb-1\">Parallel OBS RTMP Server URL.*?Both platforms will receive the feed concurrently using our cloud edge bridge.</p>\n                    </div>"
content = re.sub(pattern, "", content, flags=re.DOTALL)

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)

