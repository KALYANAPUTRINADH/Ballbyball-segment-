import re

with open('src/components/LiveScoring.tsx', 'r') as f:
    content = f.read()

content = content.replace("YouTube Live Integration", "Live Stream Integration")
content = content.replace("Open YouTube Studio", "Open Streamlify Studio")
content = content.replace("https://studio.youtube.com/channel/UC/livestreaming", "https://streamlify.in/studio")
content = content.replace("Simulcast to YouTube / OBS", "YouTube Simulcast")
content = content.replace("Paste YouTube Live URL", "Paste Streamlify HLS URL")
content = content.replace("rtmp://a.rtmp.youtube.com/live2", "rtmp://live.streamlify.in/live")

with open('src/components/LiveScoring.tsx', 'w') as f:
    f.write(content)

