import re
with open('src/components/LiveScoring.tsx', 'r') as f:
    content = f.read()

# Replace viewer logic to set isCameraActive
old_viewer = """call.on('stream', (remoteStream) => {
            if (videoRef.current) {
              videoRef.current.srcObject = remoteStream;
              videoRef.current.play().catch(console.error);
            }
          });"""

new_viewer = """call.on('stream', (remoteStream) => {
            setIsCameraActive(true);
            setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.srcObject = remoteStream;
                videoRef.current.play().catch(console.error);
              }
            }, 100);
          });"""

content = content.replace(old_viewer, new_viewer)

with open('src/components/LiveScoring.tsx', 'w') as f:
    f.write(content)

print("Patched Viewer Logic for isCameraActive")
