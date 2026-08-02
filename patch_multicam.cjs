const fs = require('fs');
let code = fs.readFileSync('src/components/MatchStreamer.tsx', 'utf-8');

const target = "{/* Broadcast Control Center Sidebar */}";
const replacement = `
        {/* Multi-Camera Switcher (Viewers & Owners) */}
        {isLive && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex flex-col space-y-3 z-40 pointer-events-auto">
            <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-col space-y-2">
              {[
                { id: 'cam1', name: 'CAM 1', label: 'Main Pitch', url: 'https://assets.mixkit.co/videos/preview/mixkit-cricket-batsman-playing-a-shot-34281-large.mp4' },
                { id: 'cam2', name: 'CAM 2', label: 'Boundary', url: 'https://assets.mixkit.co/videos/preview/mixkit-cricket-player-hitting-a-ball-34284-large.mp4' },
                { id: 'cam3', name: 'CAM 3', label: 'Tactical', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
              ].map(cam => (
                <button
                  key={cam.id}
                  onClick={() => {
                    if (!useExternalCamera) updateUseExternalCamera(true);
                    updateExternalCameraUrl(cam.url);
                  }}
                  className={\`relative p-2 rounded-xl flex flex-col items-center justify-center w-16 h-16 transition-all \${
                    useExternalCamera && externalCameraUrl === cam.url 
                      ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' 
                      : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
                  }\`}
                  title={cam.label}
                >
                  <Camera className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-black uppercase tracking-wider">{cam.name}</span>
                  {useExternalCamera && externalCameraUrl === cam.url && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Broadcast Control Center Sidebar */}`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/MatchStreamer.tsx', code);
console.log("Success");
