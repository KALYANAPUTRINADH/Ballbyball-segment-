import re

with open('src/pages/VideoSegmentation.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'const [activeSourceType, setActiveSourceType] = useState<"preset" | "stream" | "camera">("preset");',
    'const [activeSourceType, setActiveSourceType] = useState<"preset" | "stream" | "camera" | "upload">("preset");'
)

# Insert handleCustomVideoUpload and addLog around line 480
# Find a good place to insert it
insert_point = "  // Camera Recording States"

handlers = """
  const addLog = (msg: string) => {
    setOcrLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 40));
  };

  const handleCustomVideoUpload = (e: React.ChangeEvent<HTMLInputElement> | any) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomVideoMeta({
        filename: file.name,
        sizeMB: (file.size / (1024 * 1024)).toFixed(1),
        url: url
      });
      setActiveSourceType("upload");
      addLog(`Loaded custom video: ${file.name}`);
    }
  };

"""
content = content.replace(insert_point, handlers + insert_point)

with open('src/pages/VideoSegmentation.tsx', 'w') as f:
    f.write(content)
print("Fixed VideoSegmentation")
