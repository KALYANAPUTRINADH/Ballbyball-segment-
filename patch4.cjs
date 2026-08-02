const fs = require('fs');
let code = fs.readFileSync('src/components/TournamentManagement.tsx', 'utf-8');

code = code.replace(
  "const [addingTeam, setAddingTeam] = useState(false);",
  "const [addingTeam, setAddingTeam] = useState(false);\n  const [showTeamDropdown, setShowTeamDropdown] = useState(false);"
);

const target = `                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Enter team name"
                    className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                    disabled={addingTeam}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTeamSubmit();
                      }
                    }}
                  />`;

const replacement = `                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={newTeamName}
                      onChange={(e) => {
                        setNewTeamName(e.target.value);
                        setShowTeamDropdown(true);
                      }}
                      onFocus={() => setShowTeamDropdown(true)}
                      placeholder="Search or enter team name..."
                      className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                      disabled={addingTeam}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTeamSubmit();
                        }
                      }}
                    />
                    {showTeamDropdown && newTeamName && allRegisteredTeams && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                        {allRegisteredTeams
                          .filter(team => (team.name || '').toLowerCase().includes(newTeamName.toLowerCase()))
                          .map(team => (
                            <div
                              key={team.id}
                              className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm font-medium text-slate-800"
                              onClick={() => {
                                setNewTeamName(team.name);
                                setShowTeamDropdown(false);
                              }}
                            >
                              {team.name}
                            </div>
                        ))}
                      </div>
                    )}
                  </div>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/TournamentManagement.tsx', code);
