import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

old_logic = """    setObsConnectionStatus('connecting');
    addStreamLog(`Attempting physical OBS WebSocket link to ${physicalObsAddress}... (Attempt ${obsRetryCount.current + 1})`);
    try {"""

new_logic = """    setObsConnectionStatus('connecting');
    
    // Check if running in an iframe
    if (window.self !== window.top) {
      addStreamLog(`[WARNING] You are running inside an iframe. Browsers block local OBS connections inside iframes. PLEASE OPEN THIS APP IN A NEW TAB.`);
    }
    
    addStreamLog(`Attempting physical OBS WebSocket link to ${physicalObsAddress}... (Attempt ${obsRetryCount.current + 1})`);
    try {"""

content = content.replace(old_logic, new_logic)

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)
print("Added iframe check to connection logic")
