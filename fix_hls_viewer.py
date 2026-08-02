import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # We want to extract the WebRTC Viewer Logic and create a WebRtcViewer component
    webrtc_logic_pattern = r"(    // WebRTC Viewer Logic\s+useEffect\(\(\) => \{.*?\n    \};\s+\}, \[.*?\]\);\s+)"
    
    match = re.search(webrtc_logic_pattern, content, re.DOTALL)
    if not match:
        print(f"Could not find webrtc logic in {filepath}")
        return
        
    webrtc_logic = match.group(1)
    
    # Remove from HlsPlayer
    content = content.replace(webrtc_logic, "")
    
    # Create WebRtcViewer component
    webrtc_component = """
const WebRtcViewer = ({ isOwner, matchData }: { isOwner: boolean, matchData: any }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<any>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

""" + webrtc_logic.replace("    // WebRTC Viewer Logic", "  // WebRTC Viewer Logic").replace("    useEffect", "  useEffect").replace("    if (!isOwner", "    if (!isOwner") + """
  return (
    <video
      ref={videoRef}
      className={`absolute inset-0 w-full h-full object-cover ${!isOwner ? 'hidden' : ''}`}
      playsInline
      muted
      autoPlay
    />
  );
};
"""
    
    # Wait, the className has `${!isOwner ? 'hidden' : ''}` which means if viewer, it is HIDDEN?!
    # No, if viewer it should NOT be hidden. Let's fix className to just be visible.
    webrtc_component = webrtc_component.replace("className={`absolute inset-0 w-full h-full object-cover ${!isOwner ? 'hidden' : ''}`}", 'className="absolute inset-0 w-full h-full object-cover"')
    
    # Add WebRtcViewer before MatchStreamer/LiveScoring
    content = content.replace("export function ", webrtc_component + "\nexport function ")
    
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Fixed {filepath}")

fix_file('src/components/MatchStreamer.tsx')
fix_file('src/components/LiveScoring.tsx')
