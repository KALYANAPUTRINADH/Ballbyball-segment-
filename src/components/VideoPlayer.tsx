import React, { useEffect, useRef, useState } from 'react';
import flvjs from 'flv.js';
import { AlertCircle } from 'lucide-react';

// Permanently silence internal flv.js logging to prevent error spam in browser/console
if (flvjs.LoggingControl) {
  flvjs.LoggingControl.enableAll = false;
  flvjs.LoggingControl.enableDebug = false;
  flvjs.LoggingControl.enableVerbose = false;
  flvjs.LoggingControl.enableInfo = false;
  flvjs.LoggingControl.enableWarn = false;
  flvjs.LoggingControl.enableError = false;
}

export const VideoPlayer = ({ streamKey }: { streamKey: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<flvjs.Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let pollTimeout: any;

    if (!flvjs.isSupported()) {
      setIsSupported(false);
      setError('FLV.js is not supported in this browser.');
      return;
    }

    // Determine stream URL
    const streamUrl = !streamKey
      ? ''
      : streamKey.startsWith('http://') || streamKey.startsWith('https://') || streamKey.startsWith('/')
      ? streamKey
      : `/live/${streamKey}.flv`;

    const destroyPlayer = () => {
      if (playerRef.current) {
        try {
          playerRef.current.pause();
          playerRef.current.unload();
          playerRef.current.detachMediaElement();
          playerRef.current.destroy();
        } catch (e) {
          // ignore
        }
        playerRef.current = null;
      }
    };

    const checkAndInitPlayer = async () => {
      if (!isMounted || !streamUrl) return;

      // Probe stream endpoint to see if OBS is actively broadcasting
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(streamUrl, { 
          method: 'GET', 
          headers: { 'Range': 'bytes=0-10' },
          signal: controller.signal 
        });
        clearTimeout(timeoutId);

        if (!res.ok && res.status !== 206) {
          if (isMounted) {
            setError("Waiting for OBS stream to start. Ensure you are streaming to the correct key.");
            destroyPlayer();
            pollTimeout = setTimeout(checkAndInitPlayer, 4000);
          }
          return;
        }

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('html') || contentType.includes('json') || contentType.includes('text/plain')) {
          if (isMounted) {
            setError("Waiting for OBS stream to start. Ensure you are streaming to the correct key.");
            destroyPlayer();
            pollTimeout = setTimeout(checkAndInitPlayer, 4000);
          }
          return;
        }

        // Validate FLV signature header ('FLV')
        const buffer = await res.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        if (bytes.length < 3 || bytes[0] !== 0x46 || bytes[1] !== 0x4c || bytes[2] !== 0x56) {
          if (isMounted) {
            setError("Waiting for OBS stream to start. Ensure you are streaming to the correct key.");
            destroyPlayer();
            pollTimeout = setTimeout(checkAndInitPlayer, 4000);
          }
          return;
        }
      } catch (e) {
        if (isMounted) {
          setError("Waiting for OBS stream to start. Ensure you are streaming to the correct key.");
          destroyPlayer();
          pollTimeout = setTimeout(checkAndInitPlayer, 4000);
        }
        return;
      }

      if (!isMounted || !videoRef.current) return;

      try {
        destroyPlayer();

        const player = flvjs.createPlayer({
          type: 'flv',
          url: streamUrl,
          isLive: true,
          hasAudio: true,
          hasVideo: true,
          cors: true,
        }, {
          enableWorker: false,
          enableStashBuffer: false,
          stashInitialSize: 128,
        });

        player.attachMediaElement(videoRef.current);
        player.load();

        const playPromise = player.play() as Promise<void> | undefined;
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Auto-play prevented
          });
        }
        playerRef.current = player;

        player.on(flvjs.Events.ERROR, () => {
          if (!isMounted) return;
          setError("Waiting for OBS stream to start. Ensure you are streaming to the correct key.");
          destroyPlayer();

          if (pollTimeout) clearTimeout(pollTimeout);
          pollTimeout = setTimeout(checkAndInitPlayer, 4000);
        });

        player.on(flvjs.Events.MEDIA_INFO, () => {
          if (isMounted) {
            setError(null);
          }
        });

      } catch (err) {
        if (isMounted) {
          setError("Waiting for OBS stream to start.");
          if (pollTimeout) clearTimeout(pollTimeout);
          pollTimeout = setTimeout(checkAndInitPlayer, 4000);
        }
      }
    };

    checkAndInitPlayer();

    return () => {
      isMounted = false;
      if (pollTimeout) clearTimeout(pollTimeout);
      destroyPlayer();
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
