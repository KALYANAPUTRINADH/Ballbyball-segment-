import re
with open('src/pages/VideoSegmentation.tsx', 'r') as f:
    content = f.read()

if "getDownloadURL" not in content:
    content = content.replace("import { auth, db } from '../lib/firebase';", "import { auth, db, storage } from '../lib/firebase';\nimport { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';")
    
# Find the handleCustomVideoUpload. We will completely rewrite the file upload portion to use Firebase storage.
# Currently it uses URL.createObjectURL(file). Let's keep URL.createObjectURL for instant preview, but upload to Storage in the background.

patch_code = """
  const handleCustomVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Fast local preview
    const localUrl = URL.createObjectURL(file);
    
    // Upload to Firebase Cloud Storage
    const storageRef = ref(storage, `videos/custom_${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadStatus(`Uploading to Cloud Storage...`);
        setUploadProgress(progress);
      }, 
      (error) => {
        console.error("Storage upload error", error);
        setUploadError("Failed to upload video to Cloud Storage.");
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        
        const newFeed: MatchFeed = {
          id: `custom_${Date.now()}`,
          title: file.name,
          venue: "Analysed Live Feed",
          description: "Video loaded successfully from Cloud Storage.",
          videoUrl: downloadURL,
          videoFile: file,
          duration: 120,
          quality: "Cloud Storage Video",
          deliveries: []
        };
        setIsLiveStreaming(false);
        setPresets((prev) => [newFeed, ...prev]);
        setSelectedMatch(newFeed);
        
        setUploadStatus('Done');
        setUploadProgress(100);
      }
    );
  };
"""

start_idx = content.find("const handleCustomVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {")
end_idx = content.find("  const CustomDot = (props: any) => {", start_idx)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + patch_code + "\n" + content[end_idx:]
    with open('src/pages/VideoSegmentation.tsx', 'w') as f:
        f.write(content)
    print("Patched VideoSegmentation.tsx")
else:
    print("Could not find handleCustomVideoUpload or CustomDot")
