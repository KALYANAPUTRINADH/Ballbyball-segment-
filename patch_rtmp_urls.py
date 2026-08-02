import os
import re

files_to_patch = [
    'src/pages/StreamingSetup.tsx',
    'src/components/MatchStreamer.tsx',
    'src/components/LiveScoring.tsx'
]

for file_path in files_to_patch:
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Replace fake RTMP with YouTube for demonstration
        content = content.replace("rtmp://stream-server.streamlify.in:1935/live", "rtmp://a.rtmp.youtube.com/live2")
        content = content.replace("rtmp://live.streamlify.in/live", "rtmp://a.rtmp.youtube.com/live2")
        
        with open(file_path, 'w') as f:
            f.write(content)

print("Patched RTMP urls")
