import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

old_header = """                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-bold text-xs flex items-center">
                        <Link className="w-3.5 h-3.5 mr-1 text-red-500" /> Direct OBS Studio Link
                      </span>"""

new_header = """                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-bold text-xs flex items-center">
                        <Link className="w-3.5 h-3.5 mr-1 text-red-500" /> OBS Scene Auto-Switcher (Optional)
                      </span>"""

content = content.replace(old_header, new_header)

old_p = """                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Synchronize your physical local OBS scene program switches directly with our active scoreboard toggles using the standard OBS v5 WebSocket protocol.
                    </p>"""

new_p = """                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Synchronize your physical local OBS scene program switches directly with our active scoreboard toggles using the standard OBS v5 WebSocket protocol.
                    </p>
                    <div className="bg-blue-500/10 text-blue-400 p-2 text-[10px] rounded border border-blue-500/20 font-bold">
                      ℹ️ NOTE: This link only controls scene switching. It DOES NOT send video. To send video, you must use "Start Virtual Camera" in OBS and select it in the Source Setup above.
                    </div>"""

content = content.replace(old_p, new_p)

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)

