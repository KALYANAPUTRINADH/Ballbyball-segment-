import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

# We need to remove all instances of the block we just added, except maybe the last one or we can just remove all and add it to the correct place.

block_to_remove = """  const connectPhysicalObs = async () => {
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

"""

content = content.replace(block_to_remove, "")

# Now add it back exactly once, right before the first useEffect, or at a specific function.
# Let's insert it before "const stopCamera = () => {"

if "const stopCamera = () => {" in content:
    content = content.replace("  const stopCamera = () => {", block_to_remove + "  const stopCamera = () => {")

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)
print("Cleaned up duplicates")
