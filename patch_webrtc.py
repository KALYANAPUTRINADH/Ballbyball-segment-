import re

with open('src/components/LiveScoring.tsx', 'r') as f:
    content = f.read()

# 1. Add viewerVideoRef and state for WebRTC
# Find `const videoRef = useRef<HTMLVideoElement>(null);`
refs_insert = """  const videoRef = useRef<HTMLVideoElement>(null);
  const viewerVideoRef = useRef<HTMLVideoElement>(null);
  const [isReceivingWebRTC, setIsReceivingWebRTC] = useState(false);"""

content = content.replace("  const videoRef = useRef<HTMLVideoElement>(null);", refs_insert)

# 2. Add useEffect to watch matchData?.webrtc_peer_id
effect_logic = """
  // WebRTC Viewer Logic
  useEffect(() => {
    if (!matchData?.webrtc_peer_id || isOwner) {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      setIsReceivingWebRTC(false);
      return;
    }

    const peer = new Peer();
    peer.on('open', () => {
      const conn = peer.call(matchData.webrtc_peer_id, navigator.mediaDevices ? (window as any).dummyStream : undefined);
      if (conn) {
        conn.on('stream', (remoteStream) => {
          setIsReceivingWebRTC(true);
          if (viewerVideoRef.current) {
            viewerVideoRef.current.srcObject = remoteStream;
          }
        });
      }
    });

    peerRef.current = peer;

    return () => {
      peer.destroy();
      setIsReceivingWebRTC(false);
    };
  }, [matchData?.webrtc_peer_id, isOwner]);
"""

# Insert effect before return
content = content.replace("  const startCamera = async () => {", effect_logic + "\n  const startCamera = async () => {")

# 3. Update the render logic
render_old = """            {isCameraActive ? (
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted />
            ) : youtubeUrl ? ("""

render_new = """            {isCameraActive ? (
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted />
            ) : isReceivingWebRTC ? (
              <video ref={viewerVideoRef} className="absolute inset-0 w-full h-full object-cover" autoPlay playsInline controls />
            ) : youtubeUrl ? ("""

content = content.replace(render_old, render_new)

with open('src/components/LiveScoring.tsx', 'w') as f:
    f.write(content)
print("Patched WebRTC")
