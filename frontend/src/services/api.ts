// frontend/src/services/api.ts
/// <reference types="vite/client" />

import axios, { AxiosInstance } from 'axios';
import {
  Tournament, TournamentCreate, Team, Player, MatchResponse, StandingsResponse, BestPlayersResponse,
  LoginRequest, AuthResponse , PlayerCreate, PlayerUpdate , SwapPlayersRequest, AvailableSwapsResponse
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

  // -- Tournaments --
  async getCurrentTournament(): Promise<Tournament> {
    const res = await this.client.get('/tournaments/current');
    return res.data;
  }
  async getTournaments(): Promise<Tournament[]> {
    const res = await this.client.get('/tournaments/');
    return res.data;
  }
  async createTournament(data: TournamentCreate): Promise<Tournament> {
    const res = await this.client.post('/tournaments/', data);
    return res.data;
  }

  async setCurrentTournament(tournamentId: number): Promise<Tournament> {
    const res = await this.client.post(`/tournaments/${tournamentId}/set-current`);
    return res.data;
  }

  async deleteTournament(tournamentId: number): Promise<void> {
    await this.client.delete(`/tournaments/${tournamentId}`);
  }

  async startTournament(tournamentId: number): Promise<{ message: string }> {
    const res = await this.client.post(`/tournaments/${tournamentId}/start`);
    return res.data;
  }

  // -- Tournament Stage Management --
  async canCompleteTournament(tournamentId: number): Promise<{ can_complete: boolean }> {
    const res = await this.client.get(`/tournaments/${tournamentId}/can-complete`);
    return res.data;
  }
  
  async completeTournament(tournamentId: number): Promise<{ message: string }> {
    const res = await this.client.post(`/tournaments/${tournamentId}/complete`);
    return res.data;
  }

  async getFinalRankings(tournamentId: number): Promise<any> {
    const res = await this.client.get(`/tournaments/${tournamentId}/final-rankings`);
    return res.data;
  }

  // -- Round Management --
  async canCompleteRound(tournamentId: number, roundNumber: number): Promise<{
    can_complete: boolean;
    reason?: string;
    round_number?: number;
    total_matches?: number;
    completed_matches?: number;
    completion_percentage?: number;
    missing_matches?: number;
    message?: string;
  }> {
    const res = await this.client.get(`/tournaments/${tournamentId}/rounds/${roundNumber}/can-complete`);
    return res.data;
  }
  
  async completeRound(tournamentId: number, roundNumber: number): Promise<{
    message: string;
    round_info: any;
  }> {
    const res = await this.client.post(`/tournaments/${tournamentId}/rounds/${roundNumber}/complete`);
    return res.data;
  }

async rescheduleRound(roundNumber: number, datetime: string): Promise<void> {
  await this.client.post(`/matches/rounds/${roundNumber}/reschedule`, {
    scheduled_date: new Date(datetime).toISOString(),
  });
}


  // -- Teams --
  async getTeams(): Promise<Team[]> {
    const res = await this.client.get('/teams');
    return res.data;
  }
  async createTeam(team: Team): Promise<Team> {
    const res = await this.client.post('/teams', team);
    return res.data;
  }
  async updateTeam(teamId: number, team: Team): Promise<Team> {
    const res = await this.client.put(`/teams/${teamId}`, team);
    return res.data;
  }

  // -- Players (example) --
  async getPlayers(): Promise<Player[]> {
    const res = await this.client.get('/players');
    return res.data;
  }
  // api.ts
  async addPlayer(player: PlayerCreate): Promise<Player> {
    const res = await this.client.post('/players', player);
    return res.data;
  }

  async updatePlayer(playerId: number, player: PlayerUpdate): Promise<Player> {
    const res = await this.client.put(`/players/${playerId}`, player);
    return res.data;
  }

  async deletePlayer(playerId: number): Promise<void> {
    await this.client.delete(`/players/${playerId}`);
  }

  // -- Matches --
async getMatches(tournamentId: number, roundNumber: number): Promise<MatchResponse[]> {
  const res = await this.client.get(`/matches/${tournamentId}/${roundNumber}`);
  return res.data;
}

async submitBoardResult(
  matchId: number,
  boardNumber: number,
  resultPayload: { result: string }
): Promise<void> {
  await this.client.post(`/matches/${matchId}/board/${boardNumber}/result`, resultPayload);
}

  // -- Standings & Best Players --
  async getStandings(): Promise<StandingsResponse> {
    const tournament = await this.getCurrentTournament();
    const res = await this.client.get(`/tournaments/${tournament.id}/standings`);

    return res.data;
  }

  async getGroupStandings(): Promise<{ group_a: any[], group_b: any[] }> {
    const tournament = await this.getCurrentTournament();
    const res = await this.client.get(`/tournaments/${tournament.id}/group-standings`);
    return res.data;
  }
  async getBestPlayers(): Promise<BestPlayersResponse> {
    const tournament = await this.getCurrentTournament();
    const res = await this.client.get(`/tournaments/${tournament.id}/best-players`);
    return res.data;
  }

  async getAvailableSwaps(matchId: number): Promise<AvailableSwapsResponse> {
  const res = await this.client.get(`/matches/${matchId}/available-swaps`);
  return res.data;
}

// Swap players in a specific game
async swapGamePlayers(
  matchId: number, 
  gameId: number, 
  swapData: SwapPlayersRequest
): Promise<void> {
  await this.client.post(`/matches/${matchId}/games/${gameId}/swap-players`, swapData);
}

// Swap players at match level
async swapMatchPlayers(
  matchId: number, 
  swapData: any
): Promise<void> {
  await this.client.post(`/matches/${matchId}/swap-players`, swapData);
}

// Get swap history for a match (optional)
async getSwapHistory(matchId: number): Promise<any[]> {
  const res = await this.client.get(`/matches/${matchId}/swap-history`);
  return res.data;
}

// -- Announcements --
async getTournamentAnnouncement(tournamentId: number): Promise<{ announcement: string }> {
  try {
    const res = await this.client.get(`/tournaments/${tournamentId}/announcement`);
    return res.data;
  } catch (error) {
    // If endpoint doesn't exist yet, return empty announcement
    return { announcement: '' };
  }
}

async updateTournamentAnnouncement(tournamentId: number, announcement: string): Promise<void> {
  try {
    await this.client.post(`/tournaments/${tournamentId}/announcement`, { announcement });
  } catch (error) {
    // If endpoint doesn't exist yet, throw error for fallback to localStorage
    throw error;
  }
}

// -- Tiebreakers --
async getTiebreakersForRound(tournamentId: number, roundNumber: number): Promise<any[]> {
  const res = await this.client.get(`/tiebreakers/round/${tournamentId}/${roundNumber}`);
  return res.data;
}

async selectTiebreakerWinner(tiebreakerId: number, winnerTeamId: number): Promise<{ message: string }> {
  const res = await this.client.post(`/tiebreakers/${tiebreakerId}/select-winner`, {
    winner_team_id: winnerTeamId
  });
  return res.data;
}

async checkTiebreakersNeeded(tournamentId: number, roundNumber: number): Promise<{
  needs_tiebreakers: boolean;
  tiebreaker_matches: number[];
  all_tiebreakers_completed: boolean;
}> {
  const res = await this.client.get(`/tiebreakers/check/${tournamentId}/${roundNumber}`);
  return res.data;
}
}

export const apiService = new ApiService();
