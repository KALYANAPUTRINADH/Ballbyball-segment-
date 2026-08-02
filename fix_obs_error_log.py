import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

content = content.replace('addStreamLog("Failed to connect to local OBS: " + (err?.message || "Check IP, Port and Password."));', 
                          'addStreamLog("Failed to connect to OBS: " + (err?.message || "Check IP, Port, Password. Note: Browsers may block ws:// from https://. Try using Chrome or enabling Insecure Content."));')

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)
