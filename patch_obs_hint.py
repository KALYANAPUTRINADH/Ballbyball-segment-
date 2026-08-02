import re
with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

hint = """
                        <div className="text-[10px] text-slate-400 mt-2 p-2 bg-slate-900 rounded border border-slate-800">
                          <strong>Troubleshooting:</strong><br />
                          1. Ensure your IP/Port matches exactly.<br />
                          2. Click "Generate Password" in OBS and try copying again.<br />
                          3. If it still fails, uncheck "Enable Authentication" in OBS and leave password blank.
                        </div>
"""
content = content.replace("</button>\n                      </div>", "</button>\n" + hint + "\n                      </div>")

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)
print("Patched OBS hint")
