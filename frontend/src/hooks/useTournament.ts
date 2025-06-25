// frontend/src/hooks/useTournament.ts
import { useState, useEffect } from 'react';
import { Tournament } from '@/types';
import { apiService } from '@/services/api';

/**
 * useTournament: fetch current tournament.
 */
export function useTournament() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  useEffect(() => {
    apiService.getCurrentTournament().then(data => setTournament(data));
  }, []);
  return tournament;
}
