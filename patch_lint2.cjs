const fs = require('fs');

let perf = fs.readFileSync('src/components/PerformanceMetrics.tsx', 'utf-8');
perf = perf.replace(/import React from 'react';/, "import React, { useState } from 'react';");
fs.writeFileSync('src/components/PerformanceMetrics.tsx', perf);

let schedule = fs.readFileSync('src/components/TournamentSchedule.tsx', 'utf-8');
schedule = schedule.replace(/Play \} from 'lucide-react';/, "Play, BellRing } from 'lucide-react';");
fs.writeFileSync('src/components/TournamentSchedule.tsx', schedule);
