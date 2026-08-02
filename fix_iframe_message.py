import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

old_text = """<strong className="text-white">How to fix in Chrome/Edge:</strong><br />
                          1. Click the <strong>Lock / Settings icon</strong> next to the URL in your browser address bar.<br />
                          2. Go to <strong>Site Settings</strong>.<br />
                          3. Find <strong>Insecure content</strong> (or Mixed content) and change it to <strong>Allow</strong>.<br />
                          4. Reload this page and try connecting again.<br /><br />"""

new_text = """<strong className="text-white">How to fix in Chrome/Edge:</strong><br />
                          1. <strong>OPEN IN A NEW TAB:</strong> You cannot connect to OBS while inside the AI Studio preview iframe. Click the "Open in new tab" arrow icon at the top right of the screen.<br />
                          2. Once in the new tab, click the <strong>Lock / Settings icon</strong> next to the URL in your browser address bar.<br />
                          3. Go to <strong>Site Settings</strong>.<br />
                          4. Find <strong>Insecure content</strong> (or Mixed content) and change it to <strong>Allow</strong>.<br />
                          5. Reload this page and try connecting again.<br /><br />"""

content = content.replace(old_text, new_text)

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)
print("Added iframe warning")
