const fs = require('fs');
let code = fs.readFileSync('src/components/Teams.tsx', 'utf-8');

code = code.replace(/city\?: string;\n\}/, "city?: string;\n  logoUrl?: string;\n}");

code = code.replace(/const \[newTeam, setNewTeam\] = useState\(\{ name: '', captainName: '', playersCount: 11, sport_type: 'Cricket' \}\);/, "const [newTeam, setNewTeam] = useState({ name: '', captainName: '', playersCount: 11, sport_type: 'Cricket', logoUrl: '' });");
code = code.replace(/setNewTeam\(\{ name: '', captainName: '', playersCount: 11, sport_type: activeSport && activeSport !== 'All' \? activeSport : 'Cricket' \}\);/, "setNewTeam({ name: '', captainName: '', playersCount: 11, sport_type: activeSport && activeSport !== 'All' ? activeSport : 'Cricket', logoUrl: '' });");

code = code.replace(/<div className="flex items-center mb-4">\n\s*<div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mr-4 shrink-0">\n\s*<Shield className="w-6 h-6 text-slate-400" \/>\n\s*<\/div>/g, `<div className="flex items-center mb-4">
                      {team.logoUrl ? (
                        <div className="w-12 h-12 rounded-full mr-4 shrink-0 overflow-hidden border border-slate-200">
                          <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mr-4 shrink-0">
                          <Shield className="w-6 h-6 text-slate-400" />
                        </div>
                      )}`);

code = code.replace(/<div>\n\s*<label className="block text-sm font-medium text-slate-700 mb-1">Squad Size<\/label>/, `<div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Team Logo URL (Optional)</label>
                <input 
                  type="url" 
                  value={newTeam.logoUrl}
                  onChange={e => setNewTeam({...newTeam, logoUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                  placeholder="https://example.com/logo.png"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Squad Size</label>`);

fs.writeFileSync('src/components/Teams.tsx', code);
