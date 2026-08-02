import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

old_text = """                        <div className="text-[10px] text-slate-400 mt-2 p-2 bg-slate-900 rounded border border-slate-800">
                          <strong>Connection Troubleshooting:</strong><br />
                          1. Ensure your IP/Port matches exactly (e.g. localhost:4455).<br />
                          2. Uncheck "Enable Authentication" in OBS WebSocket settings and leave password blank here.<br />
                          3. Mixed Content: If browser blocks ws://, you may need to allow Insecure Content for this site.<br /><br />
                          <strong>How to get OBS Video into this App:</strong><br />
                          1. In OBS Studio, click <strong>"Start Virtual Camera"</strong>.<br />
                          2. In this app's "Source Setup", select <strong>"OBS Virtual Camera"</strong> from the camera list.<br />
                          3. The app will now stream your OBS video to all viewers!
                        </div>"""

new_text = """                        <div className="text-[10px] text-slate-400 mt-2 p-2 bg-slate-900 rounded border border-slate-800">
                          <strong className="text-amber-500">CRITICAL Browser Security Step:</strong><br />
                          Because this app runs on secure HTTPS, but your local OBS runs on insecure WS://, your browser will block the connection by default.<br /><br />
                          <strong className="text-white">How to fix in Chrome/Edge:</strong><br />
                          1. Click the <strong>Lock / Settings icon</strong> next to the URL in your browser address bar.<br />
                          2. Go to <strong>Site Settings</strong>.<br />
                          3. Find <strong>Insecure content</strong> (or Mixed content) and change it to <strong>Allow</strong>.<br />
                          4. Reload this page and try connecting again.<br /><br />
                          <strong>OBS Settings Checklist:</strong><br />
                          • IP/Port must match exactly (e.g. localhost:4455 or 127.0.0.1:4455).<br />
                          • Uncheck "Enable Authentication" in OBS WebSocket settings.<br /><br />
                          <strong>How to get OBS Video into this App:</strong><br />
                          1. In OBS Studio, click <strong>"Start Virtual Camera"</strong>.<br />
                          2. In this app's "Source Setup", select <strong>"OBS Virtual Camera"</strong> from the camera list.
                        </div>"""

content = content.replace(old_text, new_text)

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)

