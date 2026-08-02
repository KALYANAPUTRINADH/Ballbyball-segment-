const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

const oldButtonCode = `{sportType === 'Cricket' && innings === 1 ? (
                        <button 
                          onClick={() => setShowInnings2Modal(true)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] uppercase font-bold px-2 py-1 rounded transition-colors"
                        >
                          End 1st Innings & Start 2nd
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            if (window.confirm("Are you sure you want to end this match?")) {
                              setShowAwardsModal(true);
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white text-[10px] uppercase font-bold px-2 py-1 rounded transition-colors"
                        >
                          End Match
                        </button>
                      )}`;

const newButtonCode = `{(sportType === 'Cricket' && ((matchFormat === 'Test Match' && innings < 4) || (matchFormat !== 'Test Match' && innings < 2))) ? (
                        <button 
                          onClick={() => setShowInnings2Modal(true)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] uppercase font-bold px-2 py-1 rounded transition-colors"
                        >
                          End {innings}{innings === 1 ? 'st' : innings === 2 ? 'nd' : 'rd'} Innings & Start Next
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            if (window.confirm("Are you sure you want to end this match?")) {
                              setShowAwardsModal(true);
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white text-[10px] uppercase font-bold px-2 py-1 rounded transition-colors"
                        >
                          End Match
                        </button>
                      )}`;

code = code.replace(oldButtonCode, newButtonCode);
fs.writeFileSync('./src/components/LiveScoring.tsx', code);
