import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

start_marker = "  const startStreamingPipeline = async () => {"
end_marker = "  }, []);"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx) + len(end_marker)

if start_idx != -1 and end_idx != -1:
    old_block = content[start_idx:end_idx]
    
    new_block = """  const startStreamingPipeline = async () => {
    if (!simulcastEnabled) return;
    
    // Use the Stream Management API from the cloud architecture
    addStreamLog("Initializing Stream Management API via Cloud Run...");
    
    try {
      const session = await streamManagement.createStream(matchId || 'live_test', '1080p');
      addStreamLog(`Stream provisioned. RTMP Ingest: ${session.rtmpIngestUrl}`);
      
      await streamManagement.startTranscoding(session.streamId);
      addStreamLog("FFmpeg Transcoding Service started. Generating HLS...");
      
      // Update the streamUrl in Firestore using the scoreboard service
      scoreboardService.updateScore(matchId || '', { streamUrl: session.hlsPlaybackUrl }, 'cricket');
      
    } catch (e) {
      addStreamLog("Cloud Run API Error: " + String(e));
    }
  };

  const stopStreamingPipeline = () => {
    if (simulcastEnabled) {
      addStreamLog("Stopping Stream Management API...");
      setSimulcastStatus('disconnected');
      setStreamHealth('disconnected');
    }
  };

  const startStream = async () => {
    if (!videoRef.current || (!videoRef.current.srcObject && !videoRef.current.src)) {
      addStreamLog("Error: Camera not started.");
      return;
    }
    
    const canvas = document.createElement('canvas');
    compositeCanvasRef.current = canvas;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth || (cameraQuality === '4k' ? 3840 : cameraQuality === '1080p' ? 1920 : 1280);
    canvas.height = video.videoHeight || (cameraQuality === '4k' ? 2160 : cameraQuality === '1080p' ? 1080 : 720);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let isStreamingActive = true;
    const drawFrame = () => {
      if (!isStreamingActive || !compositeCanvasRef.current) return;
      
      // Draw main camera
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Draw commentary PIP if active
      if (pipEnabled && pipVideoRef.current && pipVideoRef.current.srcObject) {
        const pipW = canvas.width * 0.22;
        const pipH = canvas.height * 0.22;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(canvas.width - pipW - 25, 25, pipW + 10, pipH + 10);
        ctx.drawImage(pipVideoRef.current, canvas.width - pipW - 20, 30, pipW, pipH);
        
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(canvas.width - pipW + 10, 45, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = `bold ${canvas.height * 0.02}px sans-serif`;
        ctx.fillText("COMMENTARY PIP", canvas.width - pipW + 20, 50);
      }
      
      // Draw Scoreboard overlay inside the video frames
      if (matchData && obsScene !== 'hidden') {
        const isMin = obsScene === 'minimalist';
        const isStatsOnly = obsScene === 'scoreboard-only';
        if (isStatsOnly) {
          // Full stats scoreboard covering center
          ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
          const sbW = canvas.width * 0.7;
          const sbH = canvas.height * 0.5;
          const sbX = (canvas.width - sbW) / 2;
          const sbY = (canvas.height - sbH) / 2;
          
          ctx.fillRect(sbX, sbY, sbW, sbH);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
          ctx.lineWidth = 4;
          ctx.strokeRect(sbX, sbY, sbW, sbH);
          ctx.fillStyle = 'white';
          ctx.font = `bold ${sbH * 0.12}px sans-serif`;
          ctx.fillText("LIVE SCORES & MATCH STATISTICS", sbX + 50, sbY + sbH * 0.15);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(sbX + 50, sbY + sbH * 0.2, sbW - 100, 2);
          ctx.fillStyle = 'white';
          ctx.font = `bold ${sbH * 0.1}px sans-serif`;
          ctx.fillText(`${matchData.teamA} vs ${matchData.teamB}`, sbX + 50, sbY + sbH * 0.35);
          ctx.fillStyle = '#facc15';
          ctx.font = `bold ${sbH * 0.15}px monospace`;
          ctx.fillText(`${matchData.runs || 0}/${matchData.wickets || 0}`, sbX + 50, sbY + sbH * 0.55);
          ctx.fillStyle = 'white';
          ctx.font = `medium ${sbH * 0.08}px sans-serif`;
          ctx.fillText(`Overs: ${matchData.overs_bowled || 0}.${matchData.balls || 0}  |  Sport: ${matchData.sport_type || 'Cricket'}`, sbX + 50, sbY + sbH * 0.75);
          ctx.fillText(`Striker: ${matchData.striker || 'N/A'}  |  Bowler: ${matchData.bowler || 'N/A'}`, sbX + 50, sbY + sbH * 0.88);
        } else {
          // Regular banner
          ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
          const sbHeight = isMin ? canvas.height * 0.08 : canvas.height * 0.13;
          const sbY = canvas.height - sbHeight - 40;
          ctx.fillRect(40, sbY, canvas.width - 80, sbHeight);
          
          ctx.fillStyle = 'white';
          ctx.font = `bold ${sbHeight * (isMin ? 0.45 : 0.4)}px sans-serif`;
          const text = `${matchData.teamA || 'Team A'} ${matchData.runs || 0}/${matchData.wickets || 0} vs ${matchData.teamB || 'Team B'}`;
          ctx.fillText(text, 70, sbY + sbHeight * (isMin ? 0.65 : 0.45));
          
          if (!isMin) {
            ctx.fillStyle = '#f87171'; // soft red for details
            ctx.font = `bold ${sbHeight * 0.22}px sans-serif`;
            const oversText = `Overs: ${matchData.overs_bowled || 0}.${matchData.balls || 0} | Striker: ${matchData.striker || 'N/A'} | Bowler: ${matchData.bowler || 'N/A'}`;
            ctx.fillText(oversText, 70, sbY + sbHeight * 0.82);
          }
        }
      }
      animationFrameRef.current = requestAnimationFrame(drawFrame);
    };
    drawFrame();
    const canvasStream = canvas.captureStream(30);
    
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
    setIsLive(true);
    if (matchId) {
       if (isOwner) await dbService.update('matches', matchId, { is_live: true });
    }
    if (simulcastEnabled) {
      startStreamingPipeline();
    }
  };

  const stopStream = async () => {
    setIsLive(false);
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setViewerConnections(0);
    if (matchId && isOwner) {
      await dbService.update('matches', matchId, { webrtc_peer_id: null, is_live: false });
    }
    stopStreamingPipeline();
  };

  const toggleLive = () => {
    if (isLive) {
      stopStream();
    } else {
      startStream();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
      stopStreamingPipeline();
      if (physicalObsWs.current) {
        physicalObsWs.current.disconnect();
      }
    };
  }, []);"""

    new_content = content[:start_idx] + new_block + content[end_idx:]
    with open('src/components/MatchStreamer.tsx', 'w') as f:
        f.write(new_content)
    print("Successfully patched MatchStreamer.tsx")
else:
    print("Could not find start or end markers")
