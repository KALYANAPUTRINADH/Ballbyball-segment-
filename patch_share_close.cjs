const fs = require('fs');
let code = fs.readFileSync('src/components/MatchStreamer.tsx', 'utf-8');

const targetJSX = `                      Tweet Clip
                    </button>
                  </div>
                </div>
              )}
            </div>`;

const replacementJSX = `                      Tweet Clip
                    </button>
                  </div>
                </div>
                </div>
              )}
            </div>`;

code = code.replace(targetJSX, replacementJSX);
fs.writeFileSync('src/components/MatchStreamer.tsx', code);
