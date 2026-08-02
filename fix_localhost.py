import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

content = content.replace("useState('127.0.0.1:4455')", "useState('localhost:4455')")
content = content.replace("127.0.0.1:4455", "localhost:4455")

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)
print("Updated to localhost")
