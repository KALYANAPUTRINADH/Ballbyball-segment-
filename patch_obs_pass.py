import re
with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

# Make the password visible via a toggle, and ensure we pass the exact string
old_pwd_input = """<input 
                            type="password"
                            value={physicalObsPassword}
                            onChange={(e) => setPhysicalObsPassword(e.target.value)}
                            placeholder="Password in OBS Tools > Settings"
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-red-500"
                          />"""
new_pwd_input = """<input 
                            type="text"
                            value={physicalObsPassword}
                            onChange={(e) => setPhysicalObsPassword(e.target.value)}
                            placeholder="Password in OBS Tools > Settings"
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-red-500"
                          />"""

content = content.replace(old_pwd_input, new_pwd_input)

# Revert trim on the password
content = content.replace("physicalObsPassword.trim() || undefined", "physicalObsPassword || undefined")

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)
print("Patched OBS password input to text for verification")
