import re

def rewrite(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find the HlsPlayer block and replace it
    start_idx = content.find("const HlsPlayer =")
    end_idx = content.find("const getEmbedUrl =")
    
    if start_idx != -1 and end_idx != -1:
        new_hls = """const HlsPlayer = ({ src }: { src: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let hls: Hls | null = null;
    
    if (Hls.isSupported() && src.includes('.m3u8')) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.log('Auto-play prevented', e));
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(e => console.log('Auto-play prevented', e));
      });
    } else {
      video.src = src;
    }
    
    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 w-full h-full object-contain bg-black"
      controls
      playsInline
      autoPlay
    />
  );
};

"""
        content = content[:start_idx] + new_hls + content[end_idx:]
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Rewrote HlsPlayer in {filepath}")

rewrite('src/components/MatchStreamer.tsx')
rewrite('src/components/LiveScoring.tsx')
