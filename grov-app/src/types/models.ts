export interface User {
  id: number;
  name: string;
  email: string;
  role: 'volunteer' | 'coordinator' | 'admin';
  location?: string;
  bio?: string;
  avatar_path?: string;
  settings_json?: Record<string, any>;
  interests?: Interest[];
}

export interface Interest {
  id: number;
  name: string;
  slug: string;
}

export interface Species {
  id: number;
  common_name: string;
  scientific_name: string;
  local_name?: string;
  suitable_zones?: string;
  basic_description?: string;
  basic_guidance?: string;
  category: 'conifer' | 'deciduous' | 'mangrove' | 'shrub' | 'mixed';
  is_native: boolean;
  is_active: boolean;
  cover_image_path?: string;
}

export interface LocationModel {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  region?: string;
  accuracy_meters?: number;
}

export interface ActivityPhoto {
  id: number;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  caption?: string;
}

export interface Activity {
  id: number;
  user_id: number;
  location_id: number;
  activity_type: 'plantation' | 'seeding';
  status: 'reported' | 'verified' | 'rejected';
  date: string;
  field_notes?: string;
  points_awarded?: number;
  user?: User;
  location?: LocationModel;
  plantation?: {
    id: number;
    species_id: number;
    quantity_planted: number;
    planting_method: string;
    species?: Species;
  };
  seeding?: {
    id: number;
    species_id: number;
    seeds_dispersed: number;
    dispersal_method: string;
    coverage_area_sqm?: number;
    species?: Species;
  };
  photos?: ActivityPhoto[];
  monitoring_records?: MonitoringRecord[];
}

export interface MonitoringRecord {
  id: number;
  activity_id: number;
  user_id: number;
  observation_date: string;
  observed_count: number;
  established_count: number;
  surviving_count: number;
  dead_count: number;
  condition: 'Good' | 'Fair' | 'Poor' | 'Unknown';
  notes?: string;
  user?: User;
  activity?: Activity;
  photos?: ActivityPhoto[];
}

export interface CommunityTask {
  id: number;
  creator_id: number;
  location_id: number;
  title: string;
  activity_type: string;
  date: string;
  start_time: string;
  max_volunteers?: number;
  description: string;
  cover_image_path?: string;
  status: string;
  creator?: User;
  location?: LocationModel;
  active_participants?: User[];
  participants_count?: number;
}

export interface CommunityGoal {
  id: number;
  title: string;
  year: number;
  month: number;
  target_trees: number;
  target_seeds: number;
  target_monitoring: number;
  target_participants: number;
  status: string;
}

export interface NotificationModel {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  data_json?: any;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface ReportModel {
  id: number;
  reporter_id: number;
  activity_id?: number;
  location_name: string;
  category: string;
  severity: 'Low' | 'Medium' | 'High';
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  resolution_notes?: string;
  photos?: ActivityPhoto[];
  reporter?: User;
  resolver?: User;
}

export interface MapPin {
  id: number;
  title: string;
  activity_type: 'plantation' | 'seeding';
  status: 'reported' | 'verified' | 'rejected';
  count: number;
  species: string;
  latitude: number;
  longitude: number;
  date: string;
  user_id?: number;
  user_name: string;
}
