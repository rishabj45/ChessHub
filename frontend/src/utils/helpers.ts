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

export function getProgressDisplay(tournament: any): string {
  if (!tournament) return '';
  
  if (tournament.stage === 'completed') {
    return `All ${tournament.total_rounds} rounds completed`;
  }
  
  if (tournament.stage === 'not_yet_started') {
    return 'Not started';
  }
  
  // For group+knockout format, handle different stages
  if (tournament.format === 'group_knockout') {
    if (tournament.stage === 'semifinal' || tournament.stage === 'semi_final' || tournament.stage === 'final') {
      // Don't show round numbers for semifinals and finals
      return tournament.stage === 'semifinal' || tournament.stage === 'semi_final' 
        ? 'Semi-finals in progress' 
        : 'Finals in progress';
    } else if (tournament.stage === 'group') {
      // For group stage, show current round / total group rounds
      const totalRounds = tournament.total_rounds || 0;
      const groupRounds = totalRounds >= 2 ? totalRounds - 2 : totalRounds; // Subtract semifinal and final rounds
      return `Round ${tournament.current_round} of ${groupRounds} (Group Stage)`;
    }
  }
  
  // Default display for round robin or other formats
  return `Round ${tournament.current_round} of ${tournament.total_rounds}`;
}

export function getStageDescription(stage: string, format?: string): string {
  if (format === 'group_knockout') {
    switch (stage) {
      case 'not_yet_started':
        return 'Waiting for admin to start the tournament';
      case 'group':
        return 'Teams compete within their groups';
      case 'knockout':
        return 'Semi-finals in progress';
      case 'semifinal':
        return 'Semi-finals in progress';
      case 'final':
        return 'Final and 3rd place matches';
      case 'completed':
        return 'Final results available';
      default:
        return 'Tournament in progress';
    }
  } else {
    switch (stage) {
      case 'not_yet_started':
        return 'Waiting for admin to start the tournament';
      case 'group':
        return 'All teams play each other';
      case 'completed':
        return 'Final results available';
      default:
        return 'Tournament in progress';
    }
  }
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
