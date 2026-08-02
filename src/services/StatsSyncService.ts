import { dbService } from '../lib/database';

export class StatsSyncService {
  static async syncMatchStatsToCareer(sportType: string, finalPlayerStats: Record<string, any>) {
    try {
      const allProfiles = await dbService.getAll('profiles');
      const allPlayersDb = await dbService.getAll('players');

      for (const playerName of Object.keys(finalPlayerStats)) {
        const pStat = finalPlayerStats[playerName][sportType];
        if (!pStat) continue;

        // 1. Update Profile (if they have an app account)
        const profile = allProfiles.find((p: any) => p.full_name === playerName || p.username === playerName);
        if (profile) {
          const oldPStats: any = await dbService.get('performance_stats', profile.id) || {};
          oldPStats.matches = (oldPStats.matches || 0) + 1;
          
          if (sportType === 'Cricket') {
            oldPStats.runs = (oldPStats.runs || 0) + (pStat.runs || 0);
            oldPStats.wickets = (oldPStats.wickets || 0) + (pStat.wickets || 0);
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
          await dbService.create('performance_stats', { id: profile.id, ...oldPStats });
        }

        // 2. Update players collection
        const playerDb = allPlayersDb.find((p: any) => p.name === playerName) as any;
        if (playerDb) {
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
          });
        }
      }
      return true;
    } catch (e) {
      console.warn('Error in StatsSyncService:', e);
      return false;
    }
  }
}
