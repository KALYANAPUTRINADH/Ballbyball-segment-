import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

target = "  useEffect(() => {"
replacement = """  const connectPhysicalObs = async () => {
    setObsConnectionStatus('connecting');
    addStreamLog(`Attempting physical OBS WebSocket link to ${physicalObsAddress}...`);
    try {
      const obs = new OBSWebSocket();
      obs.on('ConnectionClosed', () => {
        setObsConnectionStatus('disconnected');
        addStreamLog("OBS WebSocket Disconnected.");
      });
      obs.on('ConnectionError', (err: any) => {
        console.error("OBS Connection Error:", err);
        addStreamLog("OBS WebSocket Error. Check password and network.");
        setObsConnectionStatus('error');
      });
      
      await obs.connect(`ws://${physicalObsAddress.trim()}`, physicalObsPassword ? physicalObsPassword.trim() : undefined);
      
      setObsConnectionStatus('connected');
      addStreamLog("OBS WebSocket successfully linked!");
      physicalObsWs.current = obs;
      
    } catch (e: any) {
      console.error(e);
      setObsConnectionStatus('error');
      addStreamLog(`OBS WebSocket failed: ${e.message || 'Check IP/Port or Password'}`);
    }
  };

  const disconnectPhysicalObs = () => {
    if (physicalObsWs.current) {
      physicalObsWs.current.disconnect();
      physicalObsWs.current = null;
    }
    setObsConnectionStatus('disconnected');
    addStreamLog("OBS WebSocket manual disconnect.");
  };

  useEffect(() => {"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/MatchStreamer.tsx', 'w') as f:
        f.write(content)
    print("Fixed connectPhysicalObs")
else:
    print("Could not find useEffect")
