import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

# Add enableWebOverlay state
state_block = """  const [isLive, setIsLive] = useState(false);"""
new_state_block = """  const [isLive, setIsLive] = useState(false);
  const [enableWebOverlay, setEnableWebOverlay] = useState(false);"""
content = content.replace(state_block, new_state_block)

# Modify call.answer
call_block = """    peer.on('call', (call) => {
      call.answer(canvasStream);"""
new_call_block = """    peer.on('call', (call) => {
      call.answer(enableWebOverlay ? canvasStream : (originalStream || canvasStream));"""
content = content.replace(call_block, new_call_block)

# Add checkbox in UI next to Simulcast (or above it)
ui_block = """              <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3">

                  <div className="flex items-center text-white font-medium">
                    <Youtube className="w-5 h-5 mr-2 text-red-500" />
                    YouTube Simulcast
                  </div>"""

new_ui_block = """              <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 backdrop-blur-sm mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center text-white font-medium">
                    <Tv className="w-5 h-5 mr-2 text-indigo-500" />
                    Embed Web Scoreboard
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={enableWebOverlay}
                      onChange={(e) => setEnableWebOverlay(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <p className="text-[10px] text-slate-400">Turn this OFF if you are using OBS Virtual Camera which already has the scoreboard built-in.</p>
              </div>

              <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3">

                  <div className="flex items-center text-white font-medium">
                    <Youtube className="w-5 h-5 mr-2 text-red-500" />
                    YouTube Simulcast
                  </div>"""
content = content.replace(ui_block, new_ui_block)

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)

