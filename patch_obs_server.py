import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

# Replace YouTube RTMP URL with Streamlify RTMP URL
content = content.replace('rtmp://a.rtmp.youtube.com/live2', 'rtmp://stream-server.streamlify.in:1935/live')

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)
print("Replaced youtube rtmp with streamlify")

