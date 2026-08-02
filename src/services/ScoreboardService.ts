import { dbService } from '../lib/database';

export type ScoreboardUpdate = {
  sportType?: string;
  scoreA?: number;
  scoreB?: number;
  setsA?: number;
  setsB?: number;
  period?: number;
  runs?: number;
  wickets?: number;
  overs?: number;
  balls?: number;
  striker?: string;
  nonStriker?: string;
  bowler?: string;
  teamA?: string;
  teamB?: string;
  status?: string;
  lastAction?: string;
  recentEvents?: any[];
  playerStats?: any;
  [key: string]: any;
};


export type SportConfig = {
  type: 'runs' | 'periods' | 'sets';
  scoreLabel: string;
  periodLabel?: string;
  setsLabel?: string;
  hasExtraTime?: boolean;
  isRallyScoring?: boolean;
  maxPoints?: number;
  winByTwo?: boolean;
  rules?: string[];
};

export const SPORT_CONFIGS: Record<string, SportConfig> = {
  'cricket': {
    type: 'runs',
    scoreLabel: 'Runs',
    rules: [
      'Each over consists of 6 legal deliveries. Bowlers switch ends after each over.',
      'A team bats until they lose 10 wickets or complete their allotted overs.',
      'Runs are scored by running between wickets or hitting boundaries (4 or 6).',
      'Extras (wides, no-balls) add 1 run to the total and must be re-bowled.'
    ]
  },
  'football': {
    type: 'periods',
    periodLabel: 'Half',
    scoreLabel: 'Goals',
    hasExtraTime: true,
    rules: [
      'Standard match has 2 halves of 45 minutes each.',
      '1 Goal = 1 Point on the scoreboard.',
      'Extra Time can be activated in the middle of the match for draw-breaker periods.',
      'Yellow card for caution, Red card for dismissal.'
    ]
  },
  'basketball': {
    type: 'periods',
    periodLabel: 'Quarter',
    scoreLabel: 'Points',
    hasExtraTime: true,
    rules: [
      'A standard match has 4 quarters (10 or 12 minutes each).',
      'Field goals are worth 2 or 3 points. Free throws are worth 1 point.',
      'Teams accumulate points. Rebounds, Steals, and Blocks are tracked for team performance.',
      'Players foul out after 5 or 6 personal fouls.'
    ]
  },
  'hockey': {
    type: 'periods',
    periodLabel: 'Period',
    scoreLabel: 'Goals',
    hasExtraTime: true,
    rules: [
      'A standard match consists of 3 periods of 20 minutes each.',
      '1 Goal = 1 Point.',
      'Overtime/Extra Time periods are played if the score is tied at the end of regulation.'
    ]
  },
  'tennis': {
    type: 'sets',
    setsLabel: 'Sets',
    scoreLabel: 'Games',
    winByTwo: true,
    rules: [
      'Matches are played as best of 3 or 5 sets.',
      'A set is won by reaching 6 games with a margin of at least 2 games.',
      'Game scoring progresses: Love (0), 15, 30, 40, Game.',
      'Deuce at 40-40 requires a player to score two consecutive points to win the game (Advantage).'
    ]
  },
  'volleyball': {
    type: 'sets',
    setsLabel: 'Sets',
    scoreLabel: 'Points',
    maxPoints: 25,
    winByTwo: true,
    rules: [
      'Matches are best of 5 sets. First 4 sets are played to 25 points, 5th set to 15.',
      'Teams must win a set by a margin of 2 points.',
      'Points are scored on every rally (rally scoring system).'
    ]
  },
  'badminton': {
    type: 'sets',
    setsLabel: 'Games',
    scoreLabel: 'Points',
    maxPoints: 21,
    winByTwo: true,
    rules: [
      'Matches are played as best of 3 games.',
      'Each game is played to 21 points.',
      'If the score becomes 20-all, the side which gains a 2-point lead first wins.',
      'If the score becomes 29-all, the side scoring the 30th point wins the game.'
    ]
  },
  'pickleball': {
    type: 'sets',
    setsLabel: 'Games',
    scoreLabel: 'Points',
    isRallyScoring: true,
    maxPoints: 11,
    winByTwo: true,
    rules: [
      'Standard match is played as best of 3 games.',
      'Rally Scoring: A point is scored on every single rally, regardless of which team is serving.',
      'Games are played to 11 points, and a team must win by 2 points.',
      'The serve must be hit underhand and below the waist.'
    ]
  },
  'table tennis': {
    type: 'sets',
    setsLabel: 'Games',
    scoreLabel: 'Points',
    maxPoints: 11,
    winByTwo: true,
    rules: [
      'Matches are best of 5 or 7 games.',
      'A game is won by the first player to reach 11 points.',
      'If both players reach 10 points, the game is won by the first player to get a 2-point lead.'
    ]
  }
};

export function getSportConfig(sportType?: string): SportConfig {
  if (!sportType) return SPORT_CONFIGS['football'];
  const key = sportType.toLowerCase();
  return SPORT_CONFIGS[key] || SPORT_CONFIGS['football'];
}

class ScoreboardService {
  /**
   * Switches schema mappings dynamically based on the selected sport.
   */
  getSchemaForSport(sportType: string): string[] {
    switch(sportType?.toLowerCase()) {
      case 'cricket':
        return ['runs', 'wickets', 'overs', 'balls', 'striker', 'nonStriker', 'bowler', 'target', 'innings', 'thisOver', 'strikerStats', 'nonStrikerStats', 'bowlerStats', 'deliveries', 'matchFormat', 'inningsScores'];
      case 'football':
      case 'basketball':
      case 'hockey':
        return ['scoreA', 'scoreB', 'period', 'isExtraTime'];
      case 'tennis':
      case 'volleyball':
      case 'badminton':
      case 'pickleball':
      case 'table tennis':
        return ['scoreA', 'scoreB', 'setsA', 'setsB', 'gamePointsA', 'gamePointsB', 'isRallyScoring'];
      default:
        return ['scoreA', 'scoreB'];
    }
  }

  /**
   * Filters the update payload based on the selected sport's schema mapping.
   */
  filterUpdateForSport(sportType: string, updates: Partial<ScoreboardUpdate>): Partial<ScoreboardUpdate> {
    if (!sportType) return updates;
    const allowedFields = this.getSchemaForSport(sportType);
    const filtered: Partial<ScoreboardUpdate> = {};
    
    // Always allow base fields
    const baseFields = ['sportType', 'playerStats', 'teamA', 'teamB', 'status', 'youtubeUrl', 'liveStreamOption', 'viewersCount', 'ownerId', 'is_live', 'isLive', 'webrtc_peer_id', 'lastAction', 'recentEvents', 'history', 'shotData', 'clips', 'activeBadge', 'lastAutoSave', 'umpireSignal', 'showStreamScoreboard', 'streamSyncDelaySeconds'];
    
    for (const key of Object.keys(updates)) {
      if (allowedFields.includes(key) || baseFields.includes(key)) {
        filtered[key] = updates[key];
      }
    }
    
    return filtered;
  }

  /**
   * Updates the match in the database.
   * Since we use Firestore real-time, updating the document automatically pushes changes
   * to all connected clients (MatchStreamer, LiveScoring, etc.).
   */
  async updateScore(matchId: string, updates: Partial<ScoreboardUpdate>, sportType?: string) {
    try {
      const payload = sportType ? this.filterUpdateForSport(sportType, updates) : updates;
      
      const data = await dbService.update('matches', matchId, payload);
      return data;
    } catch (err) {
      console.warn('ScoreboardService error:', err);
      return false;
    }
  }

  /**
   * Subscribes to match updates via Firestore for the given match ID.
   */
  subscribeToMatch(matchId: string, callback: (payload: any) => void) {
    return dbService.subscribeDoc('matches', matchId, (data) => {
      if (data) {
        callback(data);
      }
    });
  }
}

export const scoreboardService = new ScoreboardService();
