export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface AuthResponseData {
  token: string;
  user: import('./models').User;
}

export interface UserProfileResponseData {
  user: import('./models').User;
  stats: {
    total_planted: number;
    total_activities: number;
    rank: string;
  };
}

export interface ExploreStatsData {
  total_planted: number;
  total_seeded?: number;
  daily_recorded?: number;
  co2_offset_kg?: number;
  co2_weekly_kg?: number;
  active_sites: number;
  regional_survival_rate: string;
}

export interface MonthlyGoalData {
  title: string;
  period: string;
  completion_percentage: number;
  trees_planted: number;
  target_trees: number;
  target_seeds?: number;
  target_participants?: number;
  sub_goals: Array<{
    name: string;
    current: number;
    target: number;
    percentage: number;
  }>;
}

export interface LeaderboardRanking {
  rank: number;
  id: number;
  name: string;
  role: string;
  avatar_path?: string;
  trees_planted: number;
  seeds_dispersed: number;
  activities_count: number;
  points: number;
  score: number;
}

export interface LeaderboardData {
  tab: string;
  period: string;
  rankings: LeaderboardRanking[];
}

export interface MyRankingData {
  rank: string;
  user: {
    name: string;
    role: string;
    avatar_path?: string;
  };
  monthly_points: number;
  metrics: {
    trees_planted: number;
    seeds_dispersed: number;
    monitoring_records: number;
    total_activities: number;
    verified_activities: string;
  };
  status_message: string;
}

export interface NotificationTimelineData {
  unread_count: number;
  timeline: {
    today: import('./models').NotificationModel[];
    yesterday: import('./models').NotificationModel[];
    this_week: import('./models').NotificationModel[];
  };
}

export interface AdminDashboardData {
  total_users: number;
  total_activities: number;
  trees_planted: number;
  pending_review: number;
  metrics_change: Record<string, string>;
}
