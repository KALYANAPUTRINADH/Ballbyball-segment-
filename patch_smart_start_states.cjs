const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

const importReplacement = `import { Tv, MessageCircle, Twitter, Facebook, Wifi, Video as VideoIcon, Mic, Globe, Play, Pause, Square, Circle, RotateCcw, Video, Camera, Scissors, Download, Loader2, X, Maximize, Minimize, Sparkles, Share2, Copy, Radio, Settings, Info, Youtube, ExternalLink, Trophy, Calculator, Check, Search, CloudRain, Umbrella, RefreshCw, Shield, Clock, AlertTriangle } from 'lucide-react';`;

code = code.replace(/import { Tv.*? } from 'lucide-react';/, importReplacement);

const stateInsertTarget = `const [showBroadcastModal, setShowBroadcastModal] = useState(false);`;
const stateInsert = `const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [isSmartStartActive, setIsSmartStartActive] = useState(false);
  const [broadcastStartTime, setBroadcastStartTime] = useState<number | null>(null);
  const [broadcastDuration, setBroadcastDuration] = useState('00:00:00');
  const [obsWs, setObsWs] = useState<WebSocket | null>(null);
  const [obsPluginStatus, setObsPluginStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Stopwatch effect
  useEffect(() => {
    let interval: any;
    if (isSmartStartActive && broadcastStartTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.floor((now - broadcastStartTime) / 1000);
        const hrs = Math.floor(diff / 3600).toString().padStart(2, '0');
        const mins = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const secs = (diff % 60).toString().padStart(2, '0');
        setBroadcastDuration(\`\${hrs}:\${mins}:\${secs}\`);
      }, 1000);
    } else {
      setBroadcastDuration('00:00:00');
    }
    return () => clearInterval(interval);
  }, [isSmartStartActive, broadcastStartTime]);

  // Mock WebSocket Auto-Reconnect effect
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any;

    const connectWebSocket = () => {
      if (!isSmartStartActive) return;
      
      setObsPluginStatus('connecting');
      try {
        // Attempt to connect to local OBS plugin WebSocket
        ws = new window.WebSocket('ws://127.0.0.1:4455');

        ws.onopen = () => {
          setObsPluginStatus('connected');
          setReconnectAttempts(0);
        };

        ws.onclose = () => {
          if (!isSmartStartActive) return;
          setObsPluginStatus('error');
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          setReconnectAttempts(prev => prev + 1);
          reconnectTimeout = setTimeout(connectWebSocket, delay);
        };

        ws.onerror = (err) => {
          console.error("OBS Plugin WebSocket error", err);
          // onclose will handle reconnect
        };
        
        setObsWs(ws);
      } catch (err) {
        setObsPluginStatus('error');
      }
    };

    if (isSmartStartActive && (obsPluginStatus === 'disconnected' || obsPluginStatus === 'error')) {
      if (reconnectAttempts === 0) {
        connectWebSocket();
      }
    }

    return () => {
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [isSmartStartActive, reconnectAttempts]);

  const handleSmartStartToggle = () => {
    if (isSmartStartActive) {
      setIsSmartStartActive(false);
      setBroadcastStartTime(null);
      setObsPluginStatus('disconnected');
      setReconnectAttempts(0);
      if (obsWs) obsWs.close();
    } else {
      setIsSmartStartActive(true);
      setBroadcastStartTime(Date.now());
      setObsPluginStatus('disconnected');
      setReconnectAttempts(0);
    }
  };
`;

code = code.replace(stateInsertTarget, stateInsert);

const uiTargetStr = `<div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                    <h5 className="text-xs font-bold text-indigo-800 mb-1 flex items-center"><Play className="w-3 h-3 mr-1" /> Smart Start</h5>
                    <p className="text-[10px] text-indigo-600 mb-2">Automate OBS stream start and local scoring recording via plugin integration.</p>
                    <button onClick={() => { alert('Smart Start triggered: Connecting to OBS plugin and initializing live score recording...'); }} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded text-xs font-bold transition-colors shadow-sm flex justify-center items-center">
                      <Sparkles className="w-3 h-3 mr-2" />
                      Initialize Smart Start
                    </button>
                  </div>`;

const uiReplacement = `<div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <h5 className="text-xs font-bold text-indigo-800 flex items-center"><Play className="w-3 h-3 mr-1" /> Smart Start</h5>
                      {isSmartStartActive && (
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1 bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-mono">
                            <Clock className="w-3 h-3 text-red-500 animate-pulse" />
                            <span>{broadcastDuration}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-[10px] text-indigo-600 mb-2">Automate OBS stream start and local scoring recording via plugin integration.</p>
                    
                    {isSmartStartActive && (
                      <div className="flex items-center space-x-2 mb-2 p-1.5 rounded bg-white/60 border border-indigo-100/50">
                        {obsPluginStatus === 'connecting' && <div className="flex items-center text-[10px] text-amber-600 font-medium"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Connecting to OBS (Attempt {reconnectAttempts + 1})...</div>}
                        {obsPluginStatus === 'connected' && <div className="flex items-center text-[10px] text-emerald-600 font-medium"><Check className="w-3 h-3 mr-1" /> OBS Plugin Connected</div>}
                        {obsPluginStatus === 'error' && <div className="flex items-center text-[10px] text-red-500 font-medium"><AlertTriangle className="w-3 h-3 mr-1" /> Connection Dropped. Reconnecting in {Math.min(1 * Math.pow(2, reconnectAttempts - 1), 30)}s...</div>}
                      </div>
                    )}

                    <button 
                      onClick={handleSmartStartToggle} 
                      className={\`w-full text-white py-2 rounded text-xs font-bold transition-colors shadow-sm flex justify-center items-center \${isSmartStartActive ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-500 hover:bg-indigo-600'}\`}
                    >
                      {isSmartStartActive ? (
                        <>
                          <Square className="w-3 h-3 mr-2" />
                          Stop Broadcast
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 mr-2" />
                          Initialize Smart Start
                        </>
                      )}
                    </button>
                  </div>`;

if (code.includes(uiTargetStr)) {
  code = code.replace(uiTargetStr, uiReplacement);
  fs.writeFileSync('./src/components/LiveScoring.tsx', code);
  console.log("Success");
} else {
  console.log("Target string not found");
}

