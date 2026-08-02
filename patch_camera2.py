import os

def patch_file(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r') as f:
        content = f.read()

    # VideoSegmentation.tsx
    if "VideoSegmentation.tsx" in filepath:
        old_fallback_seg = """    } catch (e: any) {
      console.error(e);
      addLog('Could not start video source. Please allow camera permissions.');
    }"""
        
        new_fallback_seg = """    } catch (e: any) {
      console.error(e);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setIsCameraActive(true);
        }
      } catch (err: any) {
        addLog('Could not start video source. Camera might be in use, or permissions denied.');
      }
    }"""
        content = content.replace(old_fallback_seg, new_fallback_seg)

    with open(filepath, 'w') as f:
        f.write(content)

patch_file('src/pages/VideoSegmentation.tsx')
print("Patched VideoSegmentation.tsx")
