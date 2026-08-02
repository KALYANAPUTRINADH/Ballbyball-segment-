import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

# 1. Add PeerJS import
if "import { Peer } from 'peerjs';" not in content:
    content = content.replace("import React, { useState, useEffect, useRef } from 'react';", "import React, { useState, useEffect, useRef } from 'react';\nimport { Peer } from 'peerjs';")

# 2. Add Peer refs and states
if "const peerRef = useRef<Peer | null>(null);" not in content:
    content = content.replace("const compositeCanvasRef = useRef<HTMLCanvasElement>(null);", "const compositeCanvasRef = useRef<HTMLCanvasElement>(null);\n  const peerRef = useRef<Peer | null>(null);\n  const [viewerConnections, setViewerConnections] = useState<number>(0);")

# 3. Add WebRTC Broadcaster Logic (Start Broadcast replaces RTMP)
old_start_stream = """const startStream = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) {
      addStreamLog("Error: Camera not started.");
      return;
    }"""

new_start_stream = """const startStream = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) {
      addStreamLog("Error: Camera not started.");
      return;
    }"""

content = content.replace(old_start_stream, new_start_stream)

# Find the FFMPEG capture stream logic and replace with PeerJS
capture_stream_pos = content.find("const canvasStream = canvas.captureStream(30);")
if capture_stream_pos != -1:
    set_is_live_pos = content.find("setIsLive(true);", capture_stream_pos)
    if set_is_live_pos != -1:
        webrtc_broadcaster = """const canvasStream = canvas.captureStream(30);
    
    const originalStream = videoRef.current.srcObject as MediaStream;
    if (originalStream && originalStream.getAudioTracks().length > 0) {
      canvasStream.addTrack(originalStream.getAudioTracks()[0]);
    }
    
    // WebRTC PeerJS Broadcasting
    const peer = new Peer();
    peer.on('open', async (id) => {
      console.log('WebRTC Broadcaster ID:', id);
      addStreamLog(`WebRTC P2P Server started. ID: ${id}`);
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
        content = content[:capture_stream_pos] + webrtc_broadcaster + content[set_is_live_pos:]

# 4. Viewer logic
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

return_pos = content.find("  return (")
if return_pos != -1 and "WebRTC Viewer Logic" not in content:
    content = content[:return_pos] + viewer_effect + content[return_pos:]

# 6. Stop logic
old_stop = """const stopStream = () => {
    setIsLive(false);"""
new_stop = """const stopStream = async () => {
    setIsLive(false);
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
      setViewerConnections(0);
      if (matchId) {
        await dbService.update('matches', matchId, { webrtc_peer_id: null });
      }
    }"""
content = content.replace(old_stop, new_stop)

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)

print("Patched MatchStreamer.tsx for PeerJS WebRTC P2P Broadcasting")
