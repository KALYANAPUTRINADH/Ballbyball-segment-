const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

const targetState = "const [showBroadcastModal, setShowBroadcastModal] = useState(false);";
const replacementState = "const [showBroadcastModal, setShowBroadcastModal] = useState(false);\n  const [isWhatsappEnabled, setIsWhatsappEnabled] = useState(false);";
code = code.replace(targetState, replacementState);

const targetUI = `<h3 className="font-bold text-slate-800 flex items-center pt-2"><Youtube className="w-5 h-5 mr-2 text-red-600" /> YouTube Live Integration</h3>`;
const replacementUI = `<div className="mt-4 border-t border-slate-200 pt-4">
                  <h3 className="font-bold text-slate-800 flex items-center mb-2"><MessageCircle className="w-5 h-5 mr-2 text-green-600" /> Automated WhatsApp Alerts</h3>
                  <p className="text-sm text-slate-600 mb-3">
                    Notify your followers automatically via Twilio when the match goes live or a major milestone (e.g., 50 runs, Hat-trick) occurs.
                  </p>
                  <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-100">
                    <div>
                      <p className="text-xs font-bold text-green-900">Enable Live Match Alerts</p>
                      <p className="text-[10px] text-green-700">Messages will be sent to registered tournament subscribers.</p>
                    </div>
                    <button 
                      onClick={() => { setIsWhatsappEnabled(!isWhatsappEnabled); if(!isWhatsappEnabled) alert('WhatsApp Integration Enabled: Twilio SMS alerts will be triggered on key match events.'); }}
                      className={\`relative inline-flex h-6 w-11 items-center rounded-full transition-colors \${isWhatsappEnabled ? 'bg-green-600' : 'bg-slate-300'}\`}
                    >
                      <span className={\`inline-block h-4 w-4 transform rounded-full bg-white transition-transform \${isWhatsappEnabled ? 'translate-x-6' : 'translate-x-1'}\`} />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-800 flex items-center pt-4 border-t border-slate-200 mt-4"><Youtube className="w-5 h-5 mr-2 text-red-600" /> YouTube Live Integration</h3>`;

code = code.replace(targetUI, replacementUI);

fs.writeFileSync('./src/components/LiveScoring.tsx', code);
