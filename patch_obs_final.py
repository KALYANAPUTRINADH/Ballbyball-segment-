import re
with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

# Fix password trim
content = content.replace("await obs.connect(`ws://${physicalObsAddress.trim()}`, physicalObsPassword || undefined);", "await obs.connect(`ws://${physicalObsAddress.trim()}`, physicalObsPassword ? physicalObsPassword.trim() : undefined);")

# Update hints to explain OBS Virtual Camera
hint = """
                        <div className="text-[10px] text-slate-400 mt-2 p-2 bg-slate-900 rounded border border-slate-800">
                          <strong>Connection Troubleshooting:</strong><br />
                          1. Ensure your IP/Port matches exactly (e.g. 127.0.0.1:4455).<br />
                          2. Uncheck "Enable Authentication" in OBS WebSocket settings and leave password blank here.<br />
                          3. Mixed Content: If browser blocks ws://, you may need to allow Insecure Content for this site.<br /><br />
                          <strong>How to get OBS Video into this App:</strong><br />
                          1. In OBS Studio, click <strong>"Start Virtual Camera"</strong>.<br />
                          2. In this app's "Source Setup", select <strong>"OBS Virtual Camera"</strong> from the camera list.<br />
                          3. The app will now stream your OBS video to all viewers!
                        </div>
"""
# Need to replace the old hint
old_hint = """<div className="text-[10px] text-slate-400 mt-2 p-2 bg-slate-900 rounded border border-slate-800">
                          <strong>Troubleshooting:</strong><br />
                          1. Ensure your IP/Port matches exactly.<br />
                          2. Click "Generate Password" in OBS and try copying again.<br />
                          3. If it still fails, uncheck "Enable Authentication" in OBS and leave password blank.
                        </div>"""
if old_hint in content:
    content = content.replace(old_hint, hint)
else:
    # Just append it after disconnect button
    content = content.replace("Disconnect Link\n                        </button>\n                      </div>", "Disconnect Link\n                        </button>\n" + hint + "\n                      </div>")

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)
print("Patched MatchStreamer OBS settings")
