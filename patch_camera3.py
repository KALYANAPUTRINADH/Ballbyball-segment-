import os

def patch_file(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r') as f:
        content = f.read()

    # VideoSegmentation.tsx
    if "VideoSegmentation.tsx" in filepath:
        old_code = """      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });"""
        new_code = """      // Basic video settings
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });"""
        content = content.replace(old_code, new_code)
        
        old_catch = """    } catch (err: any) {
      console.warn("Error accessing camera:", err);
      if (err.message && err.message.includes('Could not start video source')) {
         try {
           const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
           setCameraStream(stream);
           if (videoPreviewRef.current) {
             videoPreviewRef.current.srcObject = stream;
           }
         } catch(e2: any) {
           alert("Failed to access camera. Please ensure permissions are granted. Error: " + e2.message);
         }
      } else {
        alert("Failed to access camera. Please ensure permissions are granted.");
      }
    }"""
        
        new_catch = """    } catch (err: any) {
      console.warn("Error accessing camera:", err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setCameraStream(stream);
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
      } catch(e2: any) {
        addLog("Failed to access camera. Ensure no other app is using it. Error: " + (e2.message || err.message));
      }
    }"""
        content = content.replace(old_catch, new_catch)

    with open(filepath, 'w') as f:
        f.write(content)

patch_file('src/pages/VideoSegmentation.tsx')
print("Patched VideoSegmentation.tsx camera")
