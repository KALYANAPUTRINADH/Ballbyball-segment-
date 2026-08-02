const fs = require('fs');

// Fix PerformanceMetrics.tsx
let perf = fs.readFileSync('src/components/PerformanceMetrics.tsx', 'utf-8');
if (!perf.includes('useState')) {
  perf = perf.replace(/import React from 'react';/, "import React, { useState } from 'react';");
  fs.writeFileSync('src/components/PerformanceMetrics.tsx', perf);
}

// Fix TournamentSchedule.tsx
let schedule = fs.readFileSync('src/components/TournamentSchedule.tsx', 'utf-8');
if (!schedule.includes('BellRing')) {
  schedule = schedule.replace(/import \{ Calendar, Clock, MapPin, Search, Filter, AlertCircle, X, ChevronRight, Plus, Map, Play \} from 'lucide-react';/, "import { Calendar, Clock, MapPin, Search, Filter, AlertCircle, X, ChevronRight, Plus, Map, Play, BellRing } from 'lucide-react';");
  fs.writeFileSync('src/components/TournamentSchedule.tsx', schedule);
}
