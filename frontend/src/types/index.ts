// frontend/src/types/index.ts
export type TabType = 'home' | 'teams' | 'schedule' | 'standings' | 'bestPlayers' | 'tournaments';

export interface LayoutProps {
  children: React.ReactNode;
  currentTab: TabType;
  onTabSelect: (tab: TabType) => void;
  tournament?: Tournament | null;
  isAdmin: boolean;
  onAdminToggle: () => void;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onLogout: () => void;
}

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (creds: {username:string,password:string}) => Promise<boolean>;
}

// Enums matching backend
export type TournamentStage = 'not_yet_started' | 'group' | 'semi_final' | 'final' | 'completed';
export type TournamentFormat = 'round_robin' | 'group_knockout' | 'swiss';
export type MatchResult = 'pending' | 'white_win' | 'black_win' | 'draw' | 'tiebreaker';
export type Tiebreaker = 'no_tiebreaker' | 'pending' | 'white_win' | 'black_win';
export type MatchLabel = 'group' | 'SF1' | 'SF2' | 'Final' | '3rd Place';

// Tournament Types - Matching TournamentResponse schema
export interface Tournament {
  id: number;
  name: string;
  description?: string;
  venue?: string;
  start_date: string;
  end_date: string;
  format: TournamentFormat;
  current_round: number;
  total_group_stage_rounds: number;
  total_rounds: number;
  stage: TournamentStage;
  announcements?: Announcement[];
  group_standings_validated: boolean;
  best_players_validated: boolean;
}

// Matching TournamentCreate schema  
export interface TournamentCreate {
  name: string;
  description?: string;
  venue?: string;
  start_date?: string;
  end_date?: string;
  format: TournamentFormat;
  team_names: string[];
}

// Matching TournamentUpdate schema
export interface TournamentUpdate {
  name?: string;
  description?: string;
  venue?: string;
  start_date?: string;
  end_date?: string;
  announcement?: string;
}

// Team Types - Matching TeamResponse schema
export interface Team {
  id: number;
  name: string;
  tournament_id: number;
  group: number;
}

// Matching TeamUpdate schema
export interface TeamUpdate {
  name?: string;
}

// Player Types - Matching PlayerResponse schema
export interface Player {
  id: number;
  name: string;
  team_id: number;
  rating: number;
}
// Matching PlayerCreate schema
export interface PlayerCreate {
  name: string;
  team_id: number;
  rating?: number; // Optional float in backend
}

// Matching PlayerUpdate schema
export interface PlayerUpdate {
  name?: string;
  rating?: number; // Optional float in backend
}

// Game Types - Matching GameResponse schema
export interface GameResponse {
  id: number;
  board_number: number;
  white_player_id: number;
  black_player_id: number;
  result: MatchResult;
  white_score: number;
  black_score: number;
  is_completed: boolean;
}

// Round Types
export interface RoundResponse {
  id: number;
  round_number: number;
  is_completed: boolean;
  games: GameResponse[];
}

// Match Types - Matching MatchResponse schema
export interface MatchResponse {
  id: number;
  round_number: number;
  white_team_id: number;
  black_team_id: number;
  white_score: number;
  black_score: number;
  result: MatchResult;
  label: MatchLabel;
  start_date?: string;
  is_completed: boolean;
  games: GameResponse[];
  tiebreaker: Tiebreaker;
}

// Standings Types - Matching StandingsEntry schema from CRUD
export interface StandingsEntry {
  team_id: number;
  team_name: string; 
  group: number;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  match_points: number;
  game_points: number;
  sonneborn_berger: number;
  manual_tb4: number;
}

// Matching StandingsResponse schema
export interface StandingsResponse {
  standings: StandingsEntry[];
}

// Best Players Types - Matching BestPlayerEntry schema from CRUD
export interface BestPlayerEntry {
  player_id: number;
  player_name: string;
  games_played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  tb3: number;
}

// Matching BestPlayersResponse schema
export interface BestPlayersResponse {
  players: BestPlayerEntry[];
}

// Authentication Types
export interface LoginRequest {
  username: string;
  password: string;
}

// Matching LoginResponse schema from auth.py
export interface AuthResponse {
  token: string;
}

// Auth verify response
export interface AuthVerifyResponse {
  user: string;
  status: string;
}

export interface UseApiOptions {
  onSuccess?: () => void;
}

// Request types matching backend schemas
export interface ResultUpdate {
  result: MatchResult;
}

export interface RoundRescheduleRequest {
  start_date: string; // Will be converted to datetime in backend
}

export interface SwapPlayersRequest {
  player1_id: number;
  player2_id: number;
}

// Available swaps response from matches endpoint
export interface AvailableSwapsResponse {
  white_team_players: Array<{ id: number; name: string }>;
  black_team_players: Array<{ id: number; name: string }>;
  current_assignments: Array<{
    game_id: number;
    board_number: number;
    white_player_id: number;
    black_player_id: number;
  }>;
}

// Tiebreaker request types for tournament endpoints
export interface StandingsTiebreakerRequest {
  first_team_id: number;
  second_team_id: number;
  group: string;
}

export interface BestPlayersTiebreakerRequest {
  first_player_id: number;
  second_player_id: number;
}

// Tie check response types from tournament endpoints
export interface TieCheckResponse {
  tournament_id: number;
  has_ties: boolean;
  ties: any; // Complex nested object structure
}

// Announcement Types
export interface Announcement {
  id: number;
  tournament_id: number;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementCreate {
  title: string;
  content: string;
  is_pinned?: boolean;
  tournament_id: number;
}

export interface AnnouncementUpdate {
  title?: string;
  content?: string;
  is_pinned?: boolean;
}