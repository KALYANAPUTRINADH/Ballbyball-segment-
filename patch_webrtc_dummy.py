import re

with open('src/components/LiveScoring.tsx', 'r') as f:
    content = f.read()

old_call = "const conn = peer.call(matchData.webrtc_peer_id, navigator.mediaDevices ? (window as any).dummyStream : undefined);"
new_call = """      const dummyCanvas = document.createElement('canvas');
      const dummyStream = dummyCanvas.captureStream();
      const conn = peer.call(matchData.webrtc_peer_id, dummyStream);"""

content = content.replace(old_call, new_call)

with open('src/components/LiveScoring.tsx', 'w') as f:
    f.write(content)

print("Fixed dummy stream")
