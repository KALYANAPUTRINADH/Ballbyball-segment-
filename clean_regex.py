import re

def clean_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find the start and end indices of the block to remove
    start_str = "    // WebRTC Viewer Logic"
    end_str = "  return () => {\n      if (hls) {"
    
    start_idx = content.find(start_str)
    end_idx = content.find(end_str)
    
    if start_idx != -1 and end_idx != -1:
        content = content[:start_idx] + content[end_idx:]
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Cleaned {filepath}")
    else:
        print(f"Could not find block in {filepath}")

clean_file('src/components/MatchStreamer.tsx')
clean_file('src/components/LiveScoring.tsx')
