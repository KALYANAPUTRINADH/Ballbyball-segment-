import re
with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

# Remove firebase storage import
content = content.replace("import { db, storage } from '../lib/firebase';", "import { db } from '../lib/firebase';")
content = content.replace("import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';", "")

# Remove handleVideoUpload
upload_start = content.find("const handleVideoUpload = async")
if upload_start != -1:
    upload_end = content.find("const handleSaveMatch", upload_start)
    content = content[:upload_start] + content[upload_end:]

# Replace the input block to remove Upload button
old_input = """<div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Video URL (HLS / MP4)"
                        value={editingMatch ? (editingMatch.videoUrl || '') : newMatch.videoUrl}
                        onChange={(e) => editingMatch 
                          ? setEditingMatch({ ...editingMatch, videoUrl: e.target.value })
                          : setNewMatch({ ...newMatch, videoUrl: e.target.value })
                        }
                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-400/10 transition-all"
                      />
                      <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-bold border border-slate-200 transition-colors flex items-center justify-center shrink-0">
                        Upload
                        <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                      </label>
                    </div>"""

new_input = """<input 
                    type="text" required
                    placeholder="e.g. https://domain.com/video.mp4"
                    value={editingMatch ? (editingMatch.videoUrl || '') : newMatch.videoUrl}
                    onChange={e => editingMatch
                      ? setEditingMatch({ ...editingMatch, videoUrl: e.target.value })
                      : setNewMatch({ ...newMatch, videoUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a] text-sm"
                  />"""

content = content.replace(old_input, new_input)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
print("Patched AdminPanel.tsx")
