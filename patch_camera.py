import os

def patch_file(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r') as f:
        content = f.read()

    # MatchStreamer.tsx
    if "MatchStreamer.tsx" in filepath:
        old_fallback = """      console.warn(e);
      addStreamLog("Failed to start camera with resolution presets. Falling back to default.");
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
          setStream(mediaStream);
        }
      } catch (err: any) {
        console.error(err);
        if (err.message && err.message.includes('Could not start video source')) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play();
              setStream(stream);
            }
          } catch(e2: any) {
             addStreamLog('Could not start video source. Camera might be in use by another app or browser tab.');
          }
        } else {
          addStreamLog(`Camera Error: ${err.message || 'Permission denied or no camera found.'}`);
        }
      }"""
        
        new_fallback = """      console.warn(e);
      addStreamLog("Failed to start camera with resolution presets. Falling back to default.");
      try {
        // Fallback to basic settings, no exact deviceId constraints
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
          setStream(mediaStream);
        }
      } catch (err: any) {
        console.error(err);
        try {
          // Absolute minimal fallback - just any video
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            setStream(stream);
          }
        } catch(e2: any) {
            addStreamLog('Could not start video source. Camera might be in use by another app, or no camera exists.');
        }
      }"""
        content = content.replace(old_fallback, new_fallback)

    # LiveScoring.tsx
    if "LiveScoring.tsx" in filepath:
        old_fallback_live = """    } catch (e: any) {
      console.warn(e);
      if (e.message && e.message.includes('Could not start video source')) {
         try {
           const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
           if (videoRef.current) {
             videoRef.current.srcObject = stream;
             videoRef.current.play();
             setIsCameraActive(true);
             setShowPreStreamModal(false);
           }
         } catch(e2: any) {
             alert('Could not access camera. Error: ' + e2.message);
         }
      } else {
        alert('Could not access camera. Please ensure permissions are granted.');
      }
    }"""
        
        new_fallback_live = """    } catch (e: any) {
      console.warn(e);
      try {
        // Fallback to basic settings without exact constraints
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setIsCameraActive(true);
          setShowPreStreamModal(false);
        }
      } catch (err: any) {
         try {
           const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
           if (videoRef.current) {
             videoRef.current.srcObject = stream;
             videoRef.current.play();
             setIsCameraActive(true);
             setShowPreStreamModal(false);
           }
         } catch(e2: any) {
             alert('Could not access camera. Ensure it is not being used by another app. Error: ' + (e2.message || e.message));
         }
      }
    }"""
        content = content.replace(old_fallback_live, new_fallback_live)

    with open(filepath, 'w') as f:
        f.write(content)

patch_file('src/components/MatchStreamer.tsx')
patch_file('src/components/LiveScoring.tsx')
print("Patched cameras.")
