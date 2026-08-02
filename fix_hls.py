import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

# The wrongly inserted block inside HlsPlayer
wrong_block = """  const connectPhysicalObs = async () => {
    try {
      setObsConnectionStatus('connecting');
      addStreamLog("Connecting to local OBS Studio at " + physicalObsAddress);
      const obs = new OBSWebSocket();
      physicalObsWs.current = obs;
      
      obs.on('ConnectionClosed', () => {
        setObsConnectionStatus('disconnected');
        addStreamLog("OBS WebSocket Connection Closed");
      });

      obs.on('ConnectionError', (err: any) => {
        addStreamLog("OBS WebSocket Error");
      });

      await obs.connect(`ws://${physicalObsAddress.trim()}`, physicalObsPassword ? physicalObsPassword.trim() : undefined);
      setObsConnectionStatus('connected');
      addStreamLog("Successfully connected to OBS Studio!");
    } catch (e: any) {
      console.error(e);
      setObsConnectionStatus('error');
      addStreamLog(`OBS Connection Error: ${e.message || 'Check IP/Port/Password'}`);
    }
  };

  const disconnectPhysicalObs = async () => {
    if (physicalObsWs.current) {
      try {
        await physicalObsWs.current.disconnect();
      } catch (e) {}
      physicalObsWs.current = null;
    }
    setObsConnectionStatus('disconnected');
    addStreamLog("Disconnected from OBS Studio.");
  };

"""

if wrong_block in content:
    content = content.replace(wrong_block, "")
    with open('src/components/MatchStreamer.tsx', 'w') as f:
        f.write(content)
    print("Removed wrong block in HlsPlayer")
else:
    print("Could not find wrong block in HlsPlayer")

