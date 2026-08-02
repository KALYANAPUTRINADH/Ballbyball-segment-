import re

def update_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    content = content.replace('rtmp://stream-server.streamlify.in:1935/live', 'rtmp://streamlify.in:1935/live')

    with open(filepath, 'w') as f:
        f.write(content)

update_file('src/components/MatchStreamer.tsx')
update_file('src/services/StreamManagementAPI.ts')
print("Updated RTMP URL")
