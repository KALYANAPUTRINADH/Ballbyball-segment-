import re

with open('src/components/LiveScoring.tsx', 'r') as f:
    content = f.read()

# 1. Add PeerJS import
if "import { Peer } from 'peerjs';" not in content:
    content = content.replace("import React, { useState, useEffect, useRef } from 'react';", "import React, { useState, useEffect, useRef } from 'react';\nimport { Peer } from 'peerjs';")

# 2. Add Peer refs and states
if "const peerRef = useRef<Peer | null>(null);" not in content:
    content = content.replace("const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);", "const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);\n  const peerRef = useRef<Peer | null>(null);\n  const [viewerConnections, setViewerConnections] = useState<number>(0);")

# 3. Add WebRTC Broadcaster Logic (Start Broadcast replaces RTMP)
old_start_youtube = """const startYoutubeStream = () => {
    if ((!streamSettings.rtmpUrl || !streamSettings.rtmpKey) && (!streamSettings.obsRtmpUrl || !streamSettings.obsRtmpKey)) {
      alert("Please configure RTMP URL and Key for YouTube or OBS in Broadcast Settings");
      setShowBroadcastModal(true);
      return;
    }"""

new_start_youtube = """const startYoutubeStream = () => {
    """

content = content.replace(old_start_youtube, new_start_youtube)

# Inside startYoutubeStream, replace RTMP ffmpeg/mediarecorder logic with PeerJS
# The original function captures stream: `const canvasStream = canvas.captureStream(30);`
# Let's find this line and replace what follows it until `setIsStreaming(true);`
capture_stream_pos = content.find("const canvasStream = canvas.captureStream(30);")
if capture_stream_pos != -1:
    set_is_streaming_pos = content.find("setIsStreaming(true);", capture_stream_pos)
    if set_is_streaming_pos != -1:
        webrtc_broadcaster = """const canvasStream = canvas.captureStream(30);
    
    // Add audio track if available
    const originalStream = video.srcObject as MediaStream;
    if (originalStream && originalStream.getAudioTracks().length > 0) {
      canvasStream.addTrack(originalStream.getAudioTracks()[0]);
    }
    
    // WebRTC PeerJS Broadcasting
    const peer = new Peer();
    peer.on('open', async (id) => {
      console.log('WebRTC Broadcaster ID:', id);
      if (matchId) {
        await dbService.update('matches', matchId, { webrtc_peer_id: id });
      }
    });
    
    peer.on('call', (call) => {
      call.answer(canvasStream);
      setViewerConnections(prev => prev + 1);
      call.on('close', () => setViewerConnections(prev => prev - 1));
    });
    
    peerRef.current = peer;
    """
        content = content[:capture_stream_pos] + webrtc_broadcaster + content[set_is_streaming_pos:]

# 4. Viewer logic
# For viewers, if matchData has webrtc_peer_id, connect and play!
viewer_effect = """
  // WebRTC Viewer Logic
  useEffect(() => {
    if (!isOwner && matchData?.webrtc_peer_id && matchData.is_live) {
      if (!peerRef.current) {
        const peer = new Peer();
        peer.on('open', () => {
          const call = peer.call(matchData.webrtc_peer_id, undefined as any);
          call.on('stream', (remoteStream) => {
            if (videoRef.current) {
              videoRef.current.srcObject = remoteStream;
              videoRef.current.play().catch(console.error);
            }
          });
        });
        peerRef.current = peer;
      }
    } else if (!isOwner && (!matchData?.is_live || !matchData?.webrtc_peer_id)) {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
    
    return () => {
      if (peerRef.current && !isOwner) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, [matchData?.is_live, matchData?.webrtc_peer_id, isOwner]);
"""

# Insert viewer_effect just before return (
return_pos = content.find("  return (")
if return_pos != -1:
    content = content[:return_pos] + viewer_effect + content[return_pos:]

# 5. Fix UI text for "Start RTMP Broadcast" -> "Start WebRTC Broadcast"
content = content.replace("Start RTMP Broadcast", "Start P2P Broadcast")
content = content.replace("Stop Broadcast", "Stop P2P Broadcast")
content = content.replace("Streaming to YouTube/OBS", "Broadcasting to Viewers via WebRTC")
content = content.replace("{isStreaming && <span className=\"text-xs font-mono ml-2 opacity-70\">(FFMPEG/RTMP Active)</span>}", "{isStreaming && <span className=\"text-xs font-mono ml-2 opacity-70\">({viewerConnections} Viewers Connected)</span>}")


# 6. Stop logic
old_stop = """const stopYoutubeStream = () => {
    setIsStreaming(false);"""
new_stop = """const stopYoutubeStream = async () => {
    setIsStreaming(false);
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
      setViewerConnections(0);
      if (matchId) {
        await dbService.update('matches', matchId, { webrtc_peer_id: null });
      }
    }"""
content = content.replace(old_stop, new_stop)

with open('src/components/LiveScoring.tsx', 'w') as f:
    f.write(content)

print("Patched LiveScoring.tsx for PeerJS WebRTC P2P Broadcasting")
