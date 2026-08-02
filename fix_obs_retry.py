import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

retry_logic = """
  const obsRetryCount = useRef(0);
  const obsRetryTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const connectPhysicalObs = async (isRetry = false) => {
    if (!isRetry) {
      obsRetryCount.current = 0;
    }
    
    if (obsRetryTimeout.current) {
      clearTimeout(obsRetryTimeout.current);
      obsRetryTimeout.current = null;
    }

    setObsConnectionStatus('connecting');
    addStreamLog(`Attempting physical OBS WebSocket link to ${physicalObsAddress}... (Attempt ${obsRetryCount.current + 1})`);
    try {
      const obs = new OBSWebSocket();
      
      const handleDisconnect = () => {
        setObsConnectionStatus('disconnected');
        addStreamLog("OBS WebSocket Disconnected.");
        
        // Exponential backoff retry
        if (obsRetryCount.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, obsRetryCount.current), 10000);
          obsRetryCount.current += 1;
          addStreamLog(`Auto-reconnecting to OBS in ${delay/1000}s...`);
          obsRetryTimeout.current = setTimeout(() => connectPhysicalObs(true), delay);
        } else {
          addStreamLog("Max OBS retries reached. Manual reconnect required.");
          setObsConnectionStatus('error');
        }
      };
      
      obs.on('ConnectionClosed', handleDisconnect);
      obs.on('ConnectionError', (err: any) => {
        console.warn("OBS Connection Error:", err);
        addStreamLog("OBS WebSocket Error. Check password and network.");
      });
      
      await obs.connect(`ws://${physicalObsAddress.trim()}`, physicalObsPassword ? physicalObsPassword.trim() : undefined);
      
      setObsConnectionStatus('connected');
      addStreamLog("OBS WebSocket successfully linked!");
      physicalObsWs.current = obs;
      obsRetryCount.current = 0;
      
    } catch (e: any) {
      console.warn("OBS Connection Catch Error:", e);
      let msg = e.message || 'Check IP/Port or Password';
      if (e.code === 4009) msg = 'Authentication failed (Incorrect Password)';
      else if (e.code === 4010) msg = 'OBS requires a password, but none was provided';
      else if (e.code === 4011) msg = 'OBS does not require a password, but one was provided';
      else if (e instanceof Event || e.name === 'ErrorEvent') msg = 'Network/Browser block (Try allowing Insecure Content for ws:// or check if OBS is running)';
      
      addStreamLog(`OBS WebSocket failed: ${msg}`);
      
      // Exponential backoff retry
      if (obsRetryCount.current < 5) {
        const delay = Math.min(1000 * Math.pow(2, obsRetryCount.current), 10000);
        obsRetryCount.current += 1;
        addStreamLog(`Auto-reconnecting to OBS in ${delay/1000}s...`);
        obsRetryTimeout.current = setTimeout(() => connectPhysicalObs(true), delay);
      } else {
        addStreamLog("Max OBS retries reached. Manual reconnect required.");
        setObsConnectionStatus('error');
      }
    }
  };

  const disconnectPhysicalObs = () => {
    if (obsRetryTimeout.current) {
      clearTimeout(obsRetryTimeout.current);
      obsRetryTimeout.current = null;
    }
    obsRetryCount.current = 0;
    
    if (physicalObsWs.current) {
      // Remove listeners to prevent auto-reconnect on manual disconnect
      physicalObsWs.current.removeAllListeners();
      physicalObsWs.current.disconnect();
      physicalObsWs.current = null;
    }
    setObsConnectionStatus('disconnected');
    addStreamLog("OBS WebSocket manual disconnect.");
  };
"""

# Extract the old connectPhysicalObs and disconnectPhysicalObs
old_start = "  const connectPhysicalObs = async () => {"
old_end = "  const stopCamera = () => {"

start_idx = content.find(old_start)
end_idx = content.find(old_end)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + retry_logic + "\n" + content[end_idx:]
    with open('src/components/MatchStreamer.tsx', 'w') as f:
        f.write(content)
    print("Replaced connection logic")
else:
    print("Could not find logic to replace")

