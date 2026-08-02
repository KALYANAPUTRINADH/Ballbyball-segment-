const fs = require('fs');
let code = fs.readFileSync('src/pages/StreamingSetup.tsx', 'utf-8');

const importTarget = `const { showToast } = useToast();`;
const importReplace = `const { showToast } = useToast();

  const [streamResolution, setStreamResolution] = useState('1080p');
  const [streamBitrate, setStreamBitrate] = useState('4500');`;
code = code.replace(importTarget, importReplace);

const loadTarget = `  // Load saved YouTube Stream Key
  useEffect(() => {
    const loadYoutubeKey = async () => {`;
const loadReplace = `  // Load stream quality preferences
  useEffect(() => {
    const loadQualityPrefs = async () => {
      if (typeof window !== 'undefined') {
        const storedRes = localStorage.getItem(\`stream_res_\${user?.uid || 'guest'}\`);
        const storedBit = localStorage.getItem(\`stream_bit_\${user?.uid || 'guest'}\`);
        if (storedRes) setStreamResolution(storedRes);
        if (storedBit) setStreamBitrate(storedBit);
      }
      if (user && user.uid) {
        try {
          const profile = await dbService.get('profiles', user.uid) as any;
          if (profile && profile.stream_resolution) {
            setStreamResolution(profile.stream_resolution);
          }
          if (profile && profile.stream_bitrate) {
            setStreamBitrate(profile.stream_bitrate);
          }
        } catch (e) {}
      }
    };
    loadQualityPrefs();
  }, [user]);

  const handleSaveQualityPrefs = async (res, bit) => {
    setStreamResolution(res);
    setStreamBitrate(bit);
    if (typeof window !== 'undefined') {
      localStorage.setItem(\`stream_res_\${user?.uid || 'guest'}\`, res);
      localStorage.setItem(\`stream_bit_\${user?.uid || 'guest'}\`, bit);
    }
    if (user && user.uid) {
      try {
        await dbService.update('profiles', user.uid, {
          stream_resolution: res,
          stream_bitrate: bit
        });
      } catch (e) {}
    }
    showToast('Stream quality saved');
  };

  // Load saved YouTube Stream Key
  useEffect(() => {
    const loadYoutubeKey = async () => {`;
code = code.replace(loadTarget, loadReplace);

const uiTarget = `              <p className="text-[10px] text-slate-400 italic">
                Saves your key locally and in your profile, allowing OBS broadcasts and auto-filling YouTube streaming sections.
              </p>
            </div>
          </div>`;
const uiReplace = `              <p className="text-[10px] text-slate-400 italic">
                Saves your key locally and in your profile, allowing OBS broadcasts and auto-filling YouTube streaming sections.
              </p>
            </div>
            
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 mb-2 flex items-center">
                <Settings className="w-4 h-4 mr-1 text-slate-500" /> Stream Quality (YouTube)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Resolution</label>
                  <select
                    value={streamResolution}
                    onChange={(e) => handleSaveQualityPrefs(e.target.value, streamBitrate)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-700 focus:outline-none"
                  >
                    <option value="720p">720p (HD)</option>
                    <option value="1080p">1080p (Full HD)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Video Bitrate</label>
                  <select
                    value={streamBitrate}
                    onChange={(e) => handleSaveQualityPrefs(streamResolution, e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-700 focus:outline-none"
                  >
                    <option value="2500">2500 kbps (Standard 720p)</option>
                    <option value="4500">4500 kbps (High 720p / Std 1080p)</option>
                    <option value="6000">6000 kbps (High 1080p)</option>
                    <option value="9000">9000 kbps (Premium 1080p60)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>`;
code = code.replace(uiTarget, uiReplace);

fs.writeFileSync('src/pages/StreamingSetup.tsx', code);
console.log("Success");
