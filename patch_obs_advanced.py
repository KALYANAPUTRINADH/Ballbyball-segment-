import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

old_block = """                  {/* Local Physical OBS Websocket Connector */}
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-bold text-xs flex items-center">
                        <Link className="w-3.5 h-3.5 mr-1 text-red-500" /> OBS Scene Auto-Switcher (Optional)
                      </span>"""

new_block = """                  {/* Local Physical OBS Websocket Connector */}
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-bold text-xs flex items-center">
                        <Link className="w-3.5 h-3.5 mr-1 text-slate-500" /> Advanced: OBS Scene Auto-Switcher
                      </span>"""

content = content.replace(old_block, new_block)

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)

