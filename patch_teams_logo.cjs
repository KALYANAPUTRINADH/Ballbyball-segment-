const fs = require('fs');
let code = fs.readFileSync('src/components/Teams.tsx', 'utf-8');

code = code.replace(/<div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">\n\s*<Shield className="w-6 h-6 text-slate-500" \/>\n\s*<\/div>/g, `{team.logoUrl ? (
                      <div className="w-12 h-12 rounded-full mb-4 overflow-hidden border border-slate-200">
                        <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Shield className="w-6 h-6 text-slate-500" />
                      </div>
                    )}`);

fs.writeFileSync('src/components/Teams.tsx', code);
