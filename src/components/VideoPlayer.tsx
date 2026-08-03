import React, { useEffect, useRef, useState } from 'react';
import flvjs from 'flv.js';
import { AlertCircle } from 'lucide-react';

export const VideoPlayer = ({ streamKey, onStatsUpdate }: { streamKey: string, onStatsUpdate?: (stats: any) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<flvjs.Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    let retryTimeout: any;

    if (!flvjs.isSupported()) {
      setIsSupported(false);
      setError('FLV.js is not supported in this browser.');
      return;
    }

    const initPlayer = async () => {
      if (videoRef.current) {
        try {
          // Prevent FLV.js from crashing on HTML error pages by doing a pre-flight check
          try {
            const res = await fetch(`https://streamlify.in/live/${streamKey}.flv`, { method: 'HEAD' });
            const contentType = res.headers.get('content-type');
            if (!res.ok || (contentType && contentType.includes('text/html'))) {
              setError("Waiting for OBS stream to start. Ensure you are streaming to the correct key.");
              retryTimeout = setTimeout(initPlayer, 5000);
              return;
            }
          } catch (e) {
            setError("Waiting for OBS stream to start. Ensure you are streaming to the correct key.");
            retryTimeout = setTimeout(initPlayer, 5000);
            return;
          }

          const player = flvjs.createPlayer({
            type: 'flv',
            url: `https://streamlify.in/live/${streamKey}.flv`,
            isLive: true,
            hasAudio: true,
            hasVideo: true,
          });
          
          player.attachMediaElement(videoRef.current);
          player.load();
          
          const playPromise = player.play() as Promise<void> | undefined;
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              console.log("Auto-play prevented by browser. User must click play.", e);
            });
          }
          playerRef.current = player;
          
          player.on(flvjs.Events.ERROR, (errType, errDetail) => {
            console.warn('FLV Player Event:', errType, errDetail);
            setError("Waiting for OBS stream to start. Ensure you are streaming to the correct key.");
            
            // Destroy the broken player to prevent flv.js internal setInterval crashes (currentURL null error)
            if (playerRef.current) {
              try {
                playerRef.current.pause();
                playerRef.current.unload();
                playerRef.current.detachMediaElement();
                playerRef.current.destroy();
              } catch (e) {
                console.error("Error destroying player:", e);
              }
              playerRef.current = null;
            }

            // Retry connecting after 3 seconds
            if (retryTimeout) clearTimeout(retryTimeout);
            retryTimeout = setTimeout(initPlayer, 3000);
          });
          
          player.on(flvjs.Events.MEDIA_INFO, () => {
             setError(null);
          });
          
          player.on(flvjs.Events.STATISTICS_INFO, (stats) => {
            if (onStatsUpdate) {
              onStatsUpdate(stats);
            }
          });
          
        } catch (err) {
          console.error('Error initializing FLV player:', err);
        }
      }
    };

    initPlayer();

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      if (playerRef.current) {
        try {
          playerRef.current.pause();
          playerRef.current.unload();
          playerRef.current.detachMediaElement();
          playerRef.current.destroy();
        } catch (e) {
          console.error("Error destroying player:", e);
        }
        playerRef.current = null;
      }
    };
  }, [streamKey]);

  if (!isSupported) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900 text-neutral-400 p-6 text-center">
        <AlertCircle className="w-12 h-12 mb-4 text-red-500" />
        <p>Your browser does not support FLV video playback.</p>
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
