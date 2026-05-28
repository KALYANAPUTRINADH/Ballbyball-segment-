export interface VisualMarker {
  time: number;
  label: string;
  type: "bowler_release" | "batsman_hit" | "boundary" | "replay_start" | "wicket" | "info";
}

export interface Delivery {
  over: number;
  ball: number;
  startTime: number;
  endTime: number;
  bowlerReleaseTime: number;
  batsmanHitTime?: number;
  ballOutcome: string;
  runs: number;
  wicket: boolean;
  extra: boolean;
  speed?: number; // Delivery speed in KPH
  bowler?: string;
  batsman?: string;
  description: string;
  cameraAngles?: string[];
  hasReplay?: boolean;
  replayStart?: number;
  replayEnd?: number;
  visualMarkers?: VisualMarker[];
  innings?: 1 | 2;
  isWide?: boolean;
  isNoBall?: boolean;
  isPractice?: boolean;
}

export interface MatchFeed {
  id: string;
  title: string;
  venue: string;
  description: string;
  videoUrl: string;
  duration: number;
  quality: string;
  deliveries: Delivery[];
}

export interface ApiStatus {
  hasApiKey: boolean;
  currentTime: string;
}
