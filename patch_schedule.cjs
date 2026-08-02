const fs = require('fs');
let code = fs.readFileSync('src/components/TournamentSchedule.tsx', 'utf-8');

const importRegex = /import \{ ChevronLeft, ChevronRight, MapPin, Clock, Trophy, Bell \} from 'lucide-react';/;
if (!code.match(importRegex)) {
  code = code.replace(/import \{ ChevronLeft, ChevronRight, MapPin, Clock, Trophy \} from 'lucide-react';/, "import { ChevronLeft, ChevronRight, MapPin, Clock, Trophy, Bell, BellRing } from 'lucide-react';");
}
if (!code.includes('useToast')) {
    code = code.replace(/import \{ dbService \} from '\.\.\/lib\/database';/, "import { dbService } from '../lib/database';\nimport { useToast } from './ToastContext';");
}

code = code.replace(/export function TournamentSchedule\(\) \{/, `export function TournamentSchedule() {
  const { showToast } = useToast();
  const [alertMatches, setAlertMatches] = useState<string[]>([]);
  
  useEffect(() => {
    try {
      const stored = localStorage.getItem('match_alerts');
      if (stored) {
        setAlertMatches(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  const toggleAlert = (matchId: string) => {
    let newAlerts;
    if (alertMatches.includes(matchId)) {
      newAlerts = alertMatches.filter(id => id !== matchId);
      showToast("Alert removed for this match");
    } else {
      newAlerts = [...alertMatches, matchId];
      showToast("Alert set! We will notify you when this match starts");
    }
    setAlertMatches(newAlerts);
    try {
      localStorage.setItem('match_alerts', JSON.stringify(newAlerts));
    } catch (e) {}
  };`);

code = code.replace(/<span className="px-2 py-0.5 rounded text-\[10px\] font-bold bg-amber-100 text-amber-700 whitespace-nowrap">\s*\{m\.status \|\| 'Upcoming'\}\s*<\/span>/, `<span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 whitespace-nowrap">
                      {m.status || 'Upcoming'}
                    </span>
                    {m.id && (m.status === 'Upcoming' || !m.status) && (
                      <button 
                        onClick={() => toggleAlert(m.id)}
                        className="ml-2 p-1 rounded-full hover:bg-slate-100 transition-colors"
                        title={alertMatches.includes(m.id) ? "Remove Alert" : "Set Alert"}
                      >
                        {alertMatches.includes(m.id) ? (
                          <BellRing className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Bell className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    )}`);

fs.writeFileSync('src/components/TournamentSchedule.tsx', code);
