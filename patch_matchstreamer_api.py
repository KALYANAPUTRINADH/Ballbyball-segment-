import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

# Add import for StreamManagementAPI
if "import { streamManagement }" not in content:
    content = content.replace("import { useParams } from 'react-router-dom';", "import { useParams } from 'react-router-dom';\nimport { streamManagement } from '../services/StreamManagementAPI';")

# When simulcast is enabled, we could pretend to call Stream Management API
# Let's find startStreamingPipeline
old_pipeline = """  const startStreamingPipeline = () => {
    if (!simulcastEnabled) return;

    let rtmpUrl = 'rtmp://a.rtmp.youtube.com/live2';
    let rtmpKey = simulcastDestination === 'primary'
      ? 'kalyanapu-secret-key-trinadh-4k'
      : streamKey;"""

new_pipeline = """  const startStreamingPipeline = async () => {
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

    let rtmpUrl = 'rtmp://live.streamlify.in/live';
    let rtmpKey = simulcastDestination === 'primary'
      ? 'kalyanapu-secret-key-trinadh-4k'
      : streamKey;"""

content = content.replace(old_pipeline, new_pipeline)

# Fix the HLS patch inside startStreamingPipeline which might be wrong, wait, let's just make sure it parses properly.
# Actually let's use regex for safety on the old_pipeline replacement.
with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)
