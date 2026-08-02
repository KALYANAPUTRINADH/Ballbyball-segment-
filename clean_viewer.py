import re

def clean_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Regex to find the WebRTC block and remove it
    pattern = r"    // WebRTC Viewer Logic.*?isOwner\]\);"
    
    new_content = re.sub(pattern, "", content, flags=re.DOTALL)
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Cleaned {filepath}")
    else:
        print(f"Could not find block in {filepath}")

clean_file('src/components/MatchStreamer.tsx')
clean_file('src/components/LiveScoring.tsx')
