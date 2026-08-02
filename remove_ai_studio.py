import re

def replace_in_file(filepath, old_text, new_text):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # case insensitive replacement for "ai studio"
    # Wait, the outputs gave exact text so we can just do exact replacements or use re
    
    with open(filepath, 'w') as f:
        f.write(content)

# File 1: DeviceDiagnostics.tsx
with open('src/components/DeviceDiagnostics.tsx', 'r') as f:
    content = f.read()
content = content.replace("If using AI Studio, try", "If using the embedded preview, try")
with open('src/components/DeviceDiagnostics.tsx', 'w') as f:
    f.write(content)

# File 2: MatchStreamer.tsx
with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()
content = content.replace("while inside the AI Studio preview iframe", "while inside the embedded preview iframe")
content = content.replace("The AI Studio preview environment cannot", "This cloud environment cannot")
content = content.replace("AI Studio", "Streamlify")
with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)

# File 3: src/lib/firebase.ts
with open('src/lib/firebase.ts', 'r') as f:
    content = f.read()
content = content.replace("AI Studio preview environment", "embedded preview environment")
with open('src/lib/firebase.ts', 'w') as f:
    f.write(content)

# File 4: src/lib/webauthnUtils.ts
with open('src/lib/webauthnUtils.ts', 'r') as f:
    content = f.read()
content = content.replace("AI Studio Cricket", "Cricket Delivery")
with open('src/lib/webauthnUtils.ts', 'w') as f:
    f.write(content)
