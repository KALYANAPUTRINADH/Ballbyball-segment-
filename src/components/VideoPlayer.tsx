import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { AlertCircle } from 'lucide-react';

export const VideoPlayer = ({ streamKey, onStatsUpdate }: { streamKey: string, onStatsUpdate?: (stats: any) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    let retryTimeout: any;

    if (!Hls.isSupported() && videoRef.current && !videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      setIsSupported(false);
      setError('HLS is not supported in this browser.');
      return;
    }

    const src = streamKey.includes('http') ? streamKey : `https://streamlify.in/hls/${streamKey}.m3u8`;

    const initPlayer = () => {
      const video = videoRef.current;
      if (!video) return;

      try {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            manifestLoadingMaxRetry: 2,
            manifestLoadingRetryDelay: 3000,
          });
          
          hlsRef.current = hls;
          hls.loadSource(src);
          hls.attachMedia(video);
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setError(null);
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.catch(e => {
                console.log("Auto-play prevented by browser.", e);
              });
            }
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.warn("HLS Network Error, retrying...", data);
                  setError("Waiting for stream to start. Ensure you are streaming to the correct key.");
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.warn("HLS Media Error, recovering...", data);
                  hls.recoverMediaError();
                  break;
                default:
                  console.warn("HLS Fatal Error, destroying...", data);
                  hls.destroy();
                  
                  if (retryTimeout) clearTimeout(retryTimeout);
                  retryTimeout = setTimeout(initPlayer, 5000);
                  break;
              }
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
          video.addEventListener('loadedmetadata', () => {
            setError(null);
            video.play().catch(e => console.log('Auto-play prevented', e));
          });
          video.addEventListener('error', () => {
            setError("Waiting for stream to start. Ensure you are streaming to the correct key.");
            if (retryTimeout) clearTimeout(retryTimeout);
            retryTimeout = setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.src = src;
                videoRef.current.load();
              }
            }, 5000);
          });
        }
      } catch (err) {
        console.error('Error initializing HLS player:', err);
      }
    };

    initPlayer();

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamKey]);

  if (!isSupported) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900 text-neutral-400 p-6 text-center">
        <AlertCircle className="w-12 h-12 mb-4 text-red-500" />
        <p>Your browser does not support HLS video playback.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {error && (
        <div className="absolute z-10 flex flex-col items-center justify-center text-center p-6 bg-black/80 backdrop-blur-sm inset-0">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-neutral-600 border-t-red-500 rounded-full animate-spin mb-4"></div>
            <p className="text-neutral-300 font-medium max-w-sm">{error}</p>
          </div>
        </div>
      )}
      <video 
        ref={videoRef} 
        className="w-full h-full object-contain" 
        controls 
        muted 
        playsInline
      />
    </div>
  );
};

