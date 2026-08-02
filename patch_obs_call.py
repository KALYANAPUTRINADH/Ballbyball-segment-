import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

pattern = r"    if \(obsConnectionStatus === 'connected' && physicalObsWs\.current && physicalObsWs\.current\.readyState === WebSocket\.OPEN\) \{\n      const realSceneName = \(obsSceneMapping as any\)\[newScene\] \|\| newScene;\n      physicalObsWs\.current\.send\(JSON\.stringify\(\{\n        op: 6, // Request op-code\n        d: \{\n          requestType: 'SetCurrentProgramScene',\n          requestId: `scene-\$\{Date\.now\(\)\}`,\n          requestData: \{\n            sceneName: realSceneName\n          \}\n        \}\n      \}\)\);\n      addStreamLog\(`Sent OBS Studio scene switch command: \"\$\{realSceneName\}\"`\);\n    \}"

replacement = """    if (obsConnectionStatus === 'connected' && physicalObsWs.current) {
      const realSceneName = (obsSceneMapping as any)[newScene] || newScene;
      try {
        physicalObsWs.current.call('SetCurrentProgramScene', { sceneName: realSceneName });
        addStreamLog(`Sent OBS Studio scene switch command: "${realSceneName}"`);
      } catch(e) {
        console.error(e);
      }
    }"""

content = re.sub(pattern, replacement, content)

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)

