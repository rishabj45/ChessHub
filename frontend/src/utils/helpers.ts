// frontend/src/utils/helpers.ts
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US');
}

export function compareDesc(a: any, b: any): number {
  if (a < b) return 1;
  if (a > b) return -1;
  return 0;
}

export function getStageDisplayText(tournament: any): string {
  if (!tournament) return '';
  
  if (tournament.stage === 'not_yet_started') {
    return 'Yet to start';
  }
  
  if (tournament.stage === 'completed') {
    return 'Completed';
  }
  
  // For group+knockout format
  if (tournament.format === 'group_knockout') {
    if (tournament.stage === 'group') {
      // Calculate group stage rounds (total rounds - 2 for semifinals and finals)
      const totalRounds = tournament.total_rounds || 0;
      const groupRounds = totalRounds >= 2 ? totalRounds - 2 : totalRounds;
      return `Group Stage - Round ${tournament.current_round} of ${groupRounds}`;
    } else if (tournament.stage === 'semifinal' || tournament.stage === 'semi_final') {
      return 'Semifinals';
    } else if (tournament.stage === 'final') {
      return 'Finals';
    }
  } else {
    // For round robin format
    if (tournament.stage === 'group') {
      return `Round ${tournament.current_round} of ${tournament.total_rounds}`;
    }
  }
  
  // Fallback
  return tournament.stage.charAt(0).toUpperCase() + tournament.stage.slice(1);
}

export function getFormatDisplayText(tournament: any): string {
  if (!tournament || !tournament.format) return '';
  
  switch (tournament.format) {
    case 'round_robin':
      return 'Round Robin';
    case 'group_knockout':
      return 'Group + Knockout';
    default:
      return tournament.format.charAt(0).toUpperCase() + tournament.format.slice(1);
  }
}
