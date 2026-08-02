import re

with open('src/components/LiveScoring.tsx', 'r') as f:
    content = f.read()

content = content.replace("streamUrl:", "youtubeUrl:")
content = content.replace("data.streamUrl", "data.youtubeUrl")
content = content.replace("streamUrl", "youtubeUrl")
content = content.replace("setStreamUrl", "setYoutubeUrl")
# But keep "Stream URL"
content = content.replace("youtubeUrl.includes", "youtubeUrl?.includes")

with open('src/components/LiveScoring.tsx', 'w') as f:
    f.write(content)

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

content = content.replace("matchData?.streamUrl || matchData?.youtubeUrl || ''", "matchData?.youtubeUrl || ''")
content = content.replace("matchData?.streamUrl", "matchData?.youtubeUrl")
content = content.replace("streamUrl:", "youtubeUrl:")

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)
