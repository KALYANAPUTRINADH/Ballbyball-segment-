const fs = require('fs');
let code = fs.readFileSync('./src/components/LiveScoring.tsx', 'utf-8');

const targetStr = `        strikerStats, nonStrikerStats, bowlerStats, shotData, activeBadge, youtubeUrl, liveStreamOption, viewersCount, recentEvents, deliveries, umpireSignal
      }, sportType);
    }
  }, [runs, wickets, overs, balls, thisOver, strikerStats, nonStrikerStats, bowlerStats, shotData, activeBadge, youtubeUrl, liveStreamOption, viewersCount, recentEvents, matchId, isOwner, scoreA, scoreB, setsA, setsB, period, deliveries, isExtraTime, isRainDelayed, preDelayTarget, dlsOversLost, matchMaxOvers, target]);`;

const newCode = `        strikerStats, nonStrikerStats, bowlerStats, shotData, activeBadge, youtubeUrl, liveStreamOption, viewersCount, recentEvents, deliveries, umpireSignal, playerStats
      }, sportType);
    }
  }, [runs, wickets, overs, balls, thisOver, strikerStats, nonStrikerStats, bowlerStats, shotData, activeBadge, youtubeUrl, liveStreamOption, viewersCount, recentEvents, matchId, isOwner, scoreA, scoreB, setsA, setsB, period, deliveries, isExtraTime, isRainDelayed, preDelayTarget, dlsOversLost, matchMaxOvers, target, playerStats]);`;

code = code.replace(targetStr, newCode);
fs.writeFileSync('./src/components/LiveScoring.tsx', code);
