// frontend/src/services/api.ts
/// <reference types="vite/client" />

import axios, { AxiosInstance } from 'axios';
import {
  Tournament, TournamentCreate, TournamentUpdate, Team, TeamUpdate, Player, PlayerCreate, PlayerUpdate, 
  MatchResponse, StandingsResponse, BestPlayersResponse, LoginRequest, AuthResponse, AuthVerifyResponse,
  SwapPlayersRequest, AvailableSwapsResponse, ResultUpdate, RoundRescheduleRequest,
  StandingsTiebreakerRequest, BestPlayersTiebreakerRequest, TieCheckResponse,
  Announcement, AnnouncementCreate, AnnouncementUpdate
} from '@/types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});


    // Attach interceptor once here
    this.client.interceptors.request.use(
      config => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );
  }
  
  // -- Authentication --
  async login(data: LoginRequest): Promise<AuthResponse> {
    const res = await this.client.post('/auth/login', data);
    return res.data;
  }

  async verifyToken(): Promise<AuthVerifyResponse> {
    const res = await this.client.post('/auth/verify');
    return res.data;
  }

  // -- Tournaments --
  async getCurrentTournament(): Promise<Tournament> {
    const res = await this.client.get('/tournaments/current');
    return res.data;
  }

  async getTournament(tournamentId: number): Promise<Tournament> {
    const res = await this.client.get(`/tournaments/${tournamentId}`);
    return res.data;
  }

  async getTournaments(skip: number = 0, limit: number = 100): Promise<Tournament[]> {
    const res = await this.client.get('/tournaments/', { params: { skip, limit } });
    return res.data;
  }

  async createTournament(data: TournamentCreate): Promise<Tournament> {
    const res = await this.client.post('/tournaments/', data);
    return res.data;
  }

  async updateTournament(tournamentId: number, data: TournamentUpdate): Promise<Tournament> {
    const res = await this.client.put(`/tournaments/${tournamentId}`, data);
    return res.data;
  }

  async deleteTournament(tournamentId: number): Promise<{ message: string }> {
    const res = await this.client.delete(`/tournaments/${tournamentId}`);
    return res.data;
  }

  async setCurrentTournament(tournamentId: number): Promise<Tournament> {
    const res = await this.client.post(`/tournaments/${tournamentId}/set-current`);
    return res.data;
  }

  async startTournament(tournamentId: number): Promise<{ message: string }> {
    const res = await this.client.post(`/tournaments/${tournamentId}/start`);
    return res.data;
  }

  async getStandings(tournamentId: number): Promise<StandingsResponse> {
    const res = await this.client.get(`/tournaments/${tournamentId}/standings`);
    return res.data;
  }

  async getBestPlayers(tournamentId: number): Promise<BestPlayersResponse> {
    const res = await this.client.get(`/tournaments/${tournamentId}/best-players`);
    return res.data;
  }

  async rescheduleRound(tournamentId: number, roundNumber: number, data: RoundRescheduleRequest): Promise<{ message: string }> {
    const res = await this.client.post(`/tournaments/${tournamentId}/round/${roundNumber}/reschedule`, data);
    return res.data;
  }

  async completeRound(tournamentId: number, roundNumber: number): Promise<{ message: string }> {
    const res = await this.client.post(`/tournaments/${tournamentId}/round/${roundNumber}/complete`);
    return res.data;
  }

  async getRoundInfo(tournamentId: number, roundNumber: number): Promise<{
    round_number: number;
    tournament_id: number;
    stage: string;
    start_date: string | null;
    is_completed: boolean;
  }> {
    const res = await this.client.get(`/tournaments/${tournamentId}/round/${roundNumber}`);
    return res.data;
  }

  async checkStandingsTie(tournamentId: number): Promise<TieCheckResponse> {
    const res = await this.client.get(`/tournaments/${tournamentId}/standings/check-tie`);
    return res.data;
  }

  async checkBestPlayersTie(tournamentId: number): Promise<TieCheckResponse> {
    const res = await this.client.get(`/tournaments/${tournamentId}/best-players/check-tie`);
    return res.data;
  }

  async standingsTiebreaker(tournamentId: number, data: StandingsTiebreakerRequest): Promise<boolean> {
    const res = await this.client.post(`/tournaments/${tournamentId}/standings/tiebreaker`, data);
    return res.data;
  }

  async bestPlayersTiebreaker(tournamentId: number, data: BestPlayersTiebreakerRequest): Promise<boolean> {
    const res = await this.client.post(`/tournaments/${tournamentId}/best-player/tiebreaker`, data);
    return res.data;
  }

  async validateStandings(tournamentId: number): Promise<void> {
    await this.client.post(`/tournaments/${tournamentId}/standings/validate`);
  }

  // -- Teams --
  async getTeams(tournamentId: number): Promise<Team[]> {
    const res = await this.client.get('/teams', { params: { tournament_id: tournamentId } });
    return res.data;
  }

  async getTeam(teamId: number): Promise<Team> {
    const res = await this.client.get(`/teams/${teamId}`);
    return res.data;
  }

  async updateTeam(teamId: number, team: TeamUpdate): Promise<Team> {
    const res = await this.client.put(`/teams/${teamId}`, team);
    return res.data;
  }

  // -- Players --
  async getPlayers(teamId?: number, tournamentId?: number): Promise<Player[]> {
    const params: any = {};
    if (teamId) params.team_id = teamId;
    if (tournamentId) params.tournament_id = tournamentId;
    const res = await this.client.get('/players', { params });
    return res.data;
  }

  async getPlayer(playerId: number): Promise<Player> {
    const res = await this.client.get(`/players/${playerId}`);
    return res.data;
  }

  async createPlayer(player: PlayerCreate): Promise<Player> {
    const res = await this.client.post('/players', player);
    return res.data;
  }

  async updatePlayer(playerId: number, player: PlayerUpdate): Promise<Player> {
    const res = await this.client.put(`/players/${playerId}`, player);
    return res.data;
  }

  async deletePlayer(playerId: number): Promise<{ message: string }> {
    const res = await this.client.delete(`/players/${playerId}`);
    return res.data;
  }

  // -- Matches --
  async getMatches(tournamentId: number, roundNumber: number): Promise<MatchResponse[]> {
    const res = await this.client.get(`/matches/${tournamentId}/${roundNumber}`);
    return res.data;
  }

  async submitBoardResult(
    matchId: number,
    boardNumber: number,
    result: ResultUpdate
  ): Promise<{ message: string }> {
    const res = await this.client.post(`/matches/${matchId}/result?board_number=${boardNumber}`, result);
    return res.data;
  }

  async submitTiebreakerResult(
    matchId: number,
    result: ResultUpdate
  ): Promise<{ message: string; match_id: number; tiebreaker_result: string }> {
    const res = await this.client.post(`/matches/${matchId}/tiebreaker`, result);
    return res.data;
  }

  async getAvailableSwaps(matchId: number): Promise<{
    white_team_players: Array<{ id: number; name: string }>;
    black_team_players: Array<{ id: number; name: string }>;
    current_assignments: Array<{
      game_id: number;
      board_number: number;
      white_player_id: number;
      black_player_id: number;
    }>;
  }> {
    const res = await this.client.get(`/matches/${matchId}/available-swaps`);
    return res.data;
  }

  async swapPlayers(
    matchId: number, 
    data: SwapPlayersRequest
  ): Promise<void> {
    await this.client.post(`/matches/${matchId}/swap-players`, data);
  }

  async swapMatchColors(matchId: number): Promise<{ message: string; match_id: number }> {
    const res = await this.client.post(`/matches/${matchId}/swap-colors`);
    return res.data;
  }

  // -- Announcements --
  async getTournamentAnnouncements(tournamentId: number): Promise<{ announcements: Announcement[] }> {
    const res = await this.client.get(`/tournaments/${tournamentId}/announcements`);
    return res.data;
  }

  async createAnnouncement(announcement: AnnouncementCreate): Promise<Announcement> {
    const res = await this.client.post(`/tournaments/${announcement.tournament_id}/announcements`, announcement);
    return res.data;
  }

  async updateAnnouncement(announcementId: number, update: AnnouncementUpdate): Promise<Announcement> {
    const res = await this.client.put(`/announcements/${announcementId}`, update);
    return res.data;
  }

  async deleteAnnouncement(announcementId: number): Promise<{ message: string }> {
    const res = await this.client.delete(`/announcements/${announcementId}`);
    return res.data;
  }
}

export const apiService = new ApiService();
