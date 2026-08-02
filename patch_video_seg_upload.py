import re
with open('src/pages/VideoSegmentation.tsx', 'r') as f:
    content = f.read()

# Remove firebase storage import
content = content.replace("import { auth, db, storage } from '../lib/firebase';", "import { auth, db } from '../lib/firebase';")
content = content.replace("import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';", "")

# Replace activeSourceType state
content = content.replace('useState<"preset" | "upload" | "stream" | "camera">("preset");', 'useState<"preset" | "stream" | "camera">("preset");')

# Remove the whole upload button
upload_tab_start = content.find("id=\"tab-source-upload\"")
if upload_tab_start != -1:
    btn_start = content.rfind("<button", 0, upload_tab_start)
    btn_end = content.find("</button>", upload_tab_start)
    if btn_start != -1 and btn_end != -1:
        content = content[:btn_start] + content[btn_end + 9:]

# Remove the handleCustomVideoUpload function entirely
upload_func_start = content.find("const handleCustomVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {")
if upload_func_start != -1:
    # Need to find the end of this block
    # We can just look for `  const CustomDot = (props: any) => {`
    func_end = content.find("  const CustomDot = (props: any) => {", upload_func_start)
    if func_end != -1:
        content = content[:upload_func_start] + content[func_end:]

# Remove the upload UI section
upload_ui_start = content.find('{activeSourceType === "upload" && (')
if upload_ui_start != -1:
    ui_end = content.find('            {activeSourceType === "stream" && (', upload_ui_start)
    if ui_end != -1:
        content = content[:upload_ui_start] + content[ui_end:]

with open('src/pages/VideoSegmentation.tsx', 'w') as f:
    f.write(content)

print("Patched VideoSegmentation.tsx upload feature out")
