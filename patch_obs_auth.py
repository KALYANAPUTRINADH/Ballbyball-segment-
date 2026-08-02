import re
with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

content = content.replace("await obs.connect(`ws://${physicalObsAddress}`, physicalObsPassword || undefined);", "await obs.connect(`ws://${physicalObsAddress.trim()}`, physicalObsPassword.trim() || undefined);")
content = content.replace('addStreamLog("Failed to connect to OBS: " + (err?.message || "Check IP, Port, Password. Note: Browsers may block ws:// from https://. Try using Chrome or enabling Insecure Content."));', 'addStreamLog("OBS Authentication or Connection failed. Double-check your OBS WebSocket Password. Remove trailing spaces.");')

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)

print("Patched OBS auth")
