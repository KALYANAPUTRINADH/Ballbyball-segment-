import { dbService } from '../lib/database';

export class StatsSyncService {
  static async syncMatchStatsToCareer(sportType: string, finalPlayerStats: Record<string, any>) {
    try {
      const allProfiles = await dbService.getAll('profiles') || [];
      const allPlayersDb = await dbService.getAll('players') || [];

      for (const playerName of Object.keys(finalPlayerStats)) {
        if (!playerName) continue;
        const pStat = finalPlayerStats[playerName][sportType] || finalPlayerStats[playerName][sportType.toLowerCase()] || finalPlayerStats[playerName];
        if (!pStat) continue;

        const cleanName = playerName.trim().toLowerCase();

        // 1. Update Profile (if they have an app account)
        const profile = allProfiles.find((p: any) => 
          (p.full_name && p.full_name.trim().toLowerCase() === cleanName) ||
          (p.username && p.username.trim().toLowerCase() === cleanName) ||
          (p.displayName && p.displayName.trim().toLowerCase() === cleanName)
        );

        if (profile?.id) {
          const oldPStats: any = await dbService.get('performance_stats', profile.id) || {};
          oldPStats.matches = (oldPStats.matches || 0) + 1;
          
          if (sportType === 'Cricket') {
            oldPStats.runs = (oldPStats.runs || 0) + (pStat.runs || 0);
            oldPStats.wickets = (oldPStats.wickets || 0) + (pStat.wickets || 0);
            oldPStats.balls = (oldPStats.balls || 0) + (pStat.balls || 0);
            oldPStats.fours = (oldPStats.fours || 0) + (pStat.fours || 0);
            oldPStats.sixes = (oldPStats.sixes || 0) + (pStat.sixes || 0);
            if ((pStat.runs || 0) > (oldPStats.highest_score || 0)) {
              oldPStats.highest_score = pStat.runs;
            }
          } else if (['Tennis', 'Volleyball', 'Badminton', 'Pickleball', 'Table Tennis'].includes(sportType)) {
            oldPStats.setsWon = (oldPStats.setsWon || 0) + (pStat.setsWon || 0);
            oldPStats.setsLost = (oldPStats.setsLost || 0) + (pStat.setsLost || 0);
          } else if (sportType === 'Football' || sportType === 'Hockey') {
            oldPStats.goals = (oldPStats.goals || 0) + (pStat.goals || 0);
            oldPStats.assists = (oldPStats.assists || 0) + (pStat.assists || 0);
          } else if (sportType === 'Basketball') {
            oldPStats.points = (oldPStats.points || 0) + (pStat.points || 0);
            oldPStats.assists = (oldPStats.assists || 0) + (pStat.assists || 0);
            oldPStats.rebounds = (oldPStats.rebounds || 0) + (pStat.rebounds || 0);
          }

          const payload = { id: profile.id, name: playerName, player_name: playerName, ...oldPStats };
          await dbService.set('performance_stats', profile.id, payload).catch(() => {});
          await dbService.set('player_stats', profile.id, payload).catch(() => {});
        }

        // 2. Update players collection
        const playerDb = allPlayersDb.find((p: any) => p.name && p.name.trim().toLowerCase() === cleanName) as any;
        if (playerDb?.id) {
          const newMatches = (playerDb.matches || 0) + 1;
          let newRuns = playerDb.runs;
          let newWickets = playerDb.wickets;
          
          if (sportType === 'Cricket') {
            newRuns = (playerDb.runs || 0) + (pStat.runs || 0);
            newWickets = (playerDb.wickets || 0) + (pStat.wickets || 0);
          }
          
          await dbService.update('players', playerDb.id, {
            matches: newMatches,
            runs: newRuns,
            wickets: newWickets
          }).catch(() => {});

          await dbService.set('player_stats', playerDb.id, {
            id: playerDb.id,
            name: playerName,
            player_name: playerName,
            matches: newMatches,
            runs: newRuns,
            wickets: newWickets
          }).catch(() => {});
        } else {
          // Create / update player_stats entry using name slug
          const slugId = 'player_' + playerName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
          const existingStat: any = await dbService.get('player_stats', slugId).catch(() => null) || {};
          const updatedMatches = (existingStat.matches || 0) + 1;
          const updatedRuns = (existingStat.runs || 0) + (pStat.runs || 0);
          const updatedWickets = (existingStat.wickets || 0) + (pStat.wickets || 0);

          await dbService.set('player_stats', slugId, {
            id: slugId,
            name: playerName,
            player_name: playerName,
            matches: updatedMatches,
            runs: updatedRuns,
            wickets: updatedWickets
          }).catch(() => {});
        }
      }
      return true;
    } catch (e) {
      console.warn('Error in StatsSyncService:', e);
      return false;
    }
  }
}
