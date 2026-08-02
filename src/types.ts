export interface VisualMarker {
  time: number;
  label: string;
  type: "bowler_release" | "batsman_hit" | "boundary" | "replay_start" | "wicket" | "info";
}

export interface ExtractedClip {
  id: string;
  name: string;
  url: string;
  downloadUrl?: string;
  startTime: number;
  endTime: number;
  over?: number;
  ball?: number;
  innings?: number;
  runs?: number;
  wicket?: boolean;
  videoUrl: string;
  timestamp?: string;
  trackingInfo?: any;
  customLabel?: string;
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
  innings?: 1 | 2 | 3 | 4 | number;
  isWide?: boolean;
  isNoBall?: boolean;
  isPractice?: boolean;
  customLabel?: string;
}

export interface MatchFeed {
  id: string;
  title: string;
  venue: string;
  description: string;
  videoUrl: string;
  videoFile?: File; // Keep reference to file if uploaded
  duration: number;
  quality: string;
  deliveries: Delivery[];
}

export interface ApiStatus {
  hasApiKey: boolean;
  currentTime: string;
}
