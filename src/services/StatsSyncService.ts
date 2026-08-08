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

        // Dynamically build payload fields for this sport
        const getAggregatedStats = (existing: any) => {
          const stats: any = { ...existing };
          stats.matches = (stats.matches || 0) + 1;
          
          if (sportType === 'Cricket') {
            stats.runs = (stats.runs || 0) + (pStat.runs || 0);
            stats.wickets = (stats.wickets || 0) + (pStat.wickets || 0);
            stats.balls = (stats.balls || 0) + (pStat.balls || 0);
            stats.fours = (stats.fours || 0) + (pStat.fours || 0);
            stats.sixes = (stats.sixes || 0) + (pStat.sixes || 0);
            if ((pStat.runs || 0) > (stats.highest_score || 0)) {
              stats.highest_score = pStat.runs;
            }
          } else if (['Tennis', 'Volleyball', 'Badminton', 'Pickleball', 'Table Tennis'].includes(sportType)) {
            stats.setsWon = (stats.setsWon || 0) + (pStat.setsWon || 0);
            stats.setsLost = (stats.setsLost || 0) + (pStat.setsLost || 0);
          } else if (sportType === 'Football' || sportType === 'Hockey') {
            stats.goals = (stats.goals || 0) + (pStat.goals || 0);
            stats.assists = (stats.assists || 0) + (pStat.assists || 0);
          } else if (sportType === 'Basketball') {
            stats.points = (stats.points || 0) + (pStat.points || 0);
            stats.assists = (stats.assists || 0) + (pStat.assists || 0);
            stats.rebounds = (stats.rebounds || 0) + (pStat.rebounds || 0);
          }
          
          // Also dynamically copy any other numbers just in case
          for (const key of Object.keys(pStat)) {
             if (typeof pStat[key] === 'number' && key !== 'matches') {
                 if (['runs', 'wickets', 'balls', 'fours', 'sixes', 'setsWon', 'setsLost', 'goals', 'assists', 'points', 'rebounds'].includes(key)) continue;
                 stats[key] = (stats[key] || 0) + pStat[key];
             }
          }

          return stats;
        };

        // 1. Update Profile (if they have an app account)
        const profile = allProfiles.find((p: any) => 
          (p.full_name && p.full_name.trim().toLowerCase() === cleanName) ||
          (p.username && p.username.trim().toLowerCase() === cleanName) ||
          (p.displayName && p.displayName.trim().toLowerCase() === cleanName)
        );

        if (profile?.id) {
          const oldPStats: any = await dbService.get('performance_stats', profile.id) || {};
          const updatedStats = getAggregatedStats(oldPStats);
          
          const payload = { id: profile.id, name: playerName, player_name: playerName, ...updatedStats };
          await dbService.set('performance_stats', profile.id, payload).catch(() => {});
          await dbService.set('player_stats', profile.id, payload).catch(() => {});
        }

        // 2. Update players collection and player_stats for non-app users
        const playerDb = allPlayersDb.find((p: any) => p.name && p.name.trim().toLowerCase() === cleanName) as any;
        const slugId = playerDb?.id || ('player_' + playerName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase());

        const existingStat: any = await dbService.get('player_stats', slugId).catch(() => null) || {};
        const updatedStats = getAggregatedStats(existingStat);
        const payload = {
            id: slugId,
            name: playerName,
            player_name: playerName,
            ...updatedStats
        };

        if (playerDb?.id) {
          await dbService.update('players', playerDb.id, payload).catch(() => {});
        }
        
        await dbService.set('player_stats', slugId, payload).catch(() => {});
      }

      return true;
    } catch (e) {
      console.warn('Error in StatsSyncService:', e);
      return false;
    }
  }
}

