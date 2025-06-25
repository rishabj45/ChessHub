// frontend/src/services/api.ts
import axios from 'axios';
class ApiService {
    client;
    constructor() {
        this.client = axios.create({ baseURL: '/api' });
        // Attach interceptor once here
        this.client.interceptors.request.use(config => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        }, error => Promise.reject(error));
    }
    // -- Authentication --
    async login(data) {
        const res = await this.client.post('/auth/login', data);
        return res.data;
    }
    // -- Tournaments --
    async getCurrentTournament() {
        const res = await this.client.get('/tournaments/current');
        return res.data;
    }
    async getTournaments() {
        const res = await this.client.get('/tournaments');
        return res.data;
    }
    async createTournament(data) {
        const res = await this.client.post('/tournaments', data);
        return res.data;
    }
    async rescheduleRound(roundNumber, datetime) {
        await this.client.post(`/matches/rounds/${roundNumber}/reschedule`, {
            scheduled_date: new Date(datetime).toISOString(),
        });
    }
    // -- Teams --
    async getTeams() {
        const res = await this.client.get('/teams');
        return res.data;
    }
    async createTeam(team) {
        const res = await this.client.post('/teams', team);
        return res.data;
    }
    async updateTeam(teamId, team) {
        const res = await this.client.put(`/teams/${teamId}`, team);
        return res.data;
    }
    // -- Players (example) --
    async getPlayers() {
        const res = await this.client.get('/players');
        return res.data;
    }
    // api.ts
    async addPlayer(player) {
        const res = await this.client.post('/players/', player);
        return res.data;
    }
    async updatePlayer(playerId, player) {
        const res = await this.client.put(`/players/${playerId}`, player);
        return res.data;
    }
    async deletePlayer(playerId) {
        await this.client.delete(`/players/${playerId}`);
    }
    // -- Matches --
    async getMatches(roundId) {
        const res = await this.client.get(`/matches/${roundId}`);
        return res.data;
    }
    async submitBoardResult(matchId, boardNumber, resultPayload) {
        await this.client.post(`/matches/${matchId}/board/${boardNumber}/result`, resultPayload);
    }
    // -- Standings & Best Players --
    async getStandings() {
        const tournament = await this.getCurrentTournament();
        const res = await this.client.get(`/tournaments/${tournament.id}/standings`);
        return res.data;
    }
    async getBestPlayers() {
        const tournament = await this.getCurrentTournament();
        const res = await this.client.get(`/tournaments/${tournament.id}/best-players`);
        return res.data;
    }
    async getAvailableSwaps(matchId) {
        const res = await this.client.get(`/matches/${matchId}/available-swaps`);
        return res.data;
    }
    // Swap players in a specific game
    async swapGamePlayers(matchId, gameId, swapData) {
        await this.client.post(`/matches/${matchId}/games/${gameId}/swap-players`, swapData);
    }
    // Get swap history for a match (optional)
    async getSwapHistory(matchId) {
        const res = await this.client.get(`/matches/${matchId}/swap-history`);
        return res.data;
    }
}
export const apiService = new ApiService();
