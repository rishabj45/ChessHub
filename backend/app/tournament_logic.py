### backend/app/tournament_logic.py
from typing import List, Tuple, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from .models import Tournament, Round, Match, Game, Team, Player
from . import schemas
from collections import Counter

def recalculate_tournament_stats(db: Session, tournament_id: int):
    """
    Comprehensive recalculation of all tournament statistics.
    This should be called whenever game results or player assignments change.
    Note: Rounds are no longer auto-completed - use manual_complete_round() instead.
    """
    tour = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tour:
        return

    # 1. Recalculate match scores and completion status
    for match in tour.matches:
        # Only recalculate if the match has games (don't override manually set results)
        if match.games:
            # Recalculate match scores from individual games
            match.white_score = sum(g.white_score for g in match.games)
            match.black_score = sum(g.black_score for g in match.games)
            
            # Recalculate match result and completion status
            # A match is only completed if all games are completed
            if all(g.is_completed for g in match.games):
                if match.white_score > match.black_score:
                    match.result = "white_win"
                elif match.black_score > match.white_score:
                    match.result = "black_win"
                else:
                    match.result = "draw"
                match.is_completed = True
            else:
                match.is_completed = False
                match.result = None
        # If match has no games, preserve existing completion status and results
        # This allows for manually set match results to be preserved

    # 2. DO NOT auto-complete rounds - this is now manual
    # Note: Round completion is now handled by manual_complete_round()
    
    # 3. Update tournament current round based on manually completed rounds
    completed_rounds = sum(1 for r in tour.rounds if r.is_completed)
    
    # Cap current_round at total_rounds when tournament is completed
    if tour.stage == "completed":
        tour.current_round = tour.total_rounds
    else:
        tour.current_round = completed_rounds + 1

    db.commit()
    print(f"🔄 Tournament {tournament_id} stats recalculated: {completed_rounds} rounds completed")


def manual_complete_round(db: Session, tournament_id: int, round_number: int) -> bool:
    """
    Manually complete a specific round in a tournament.
    This allows admins to control when rounds are considered complete,
    even if not all matches have results.
    Also automatically advances tournament stages when appropriate.
    """
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        return False
    
    # Find the specific round
    round_obj = db.query(Round).filter(
        Round.tournament_id == tournament_id,
        Round.round_number == round_number
    ).first()
    
    if not round_obj:
        return False
    
    # Mark the round as completed
    round_obj.is_completed = True
    
    # Update tournament current round
    completed_rounds = sum(1 for r in tournament.rounds if r.is_completed)
    
    # Cap current_round at total_rounds when tournament is completed
    if tournament.stage == "completed":
        tournament.current_round = tournament.total_rounds
    else:
        tournament.current_round = completed_rounds + 1
    
    db.commit()
    print(f"✅ Round {round_number} manually completed for tournament {tournament_id}")
    
    # Auto-advance tournament stages if applicable BEFORE recalculating stats
    # This ensures that advancement logic sees the correct match states
    if tournament and tournament.format == "group_knockout":
        print(f"🔍 Checking auto-advancement for tournament {tournament_id}, current stage: {tournament.stage}")
        if tournament.stage == "group" and can_advance_to_knockout(db, tournament_id):
            print(f"🚀 Auto-advancing tournament {tournament_id} to semifinal stage")
            advance_to_knockout_stage(db, tournament_id)
        elif tournament.stage == "semifinal" and can_advance_to_final(db, tournament_id):
            print(f"🚀 Auto-advancing tournament {tournament_id} to final stage")
            advance_to_final_stage(db, tournament_id)
        elif tournament.stage == "final" and can_complete_tournament(db, tournament_id):
            print(f"🏆 Auto-completing tournament {tournament_id}")
            complete_tournament(db, tournament_id)
        else:
            print(f"ℹ️ No advancement conditions met for tournament {tournament_id}")
    elif tournament and tournament.format == "round_robin":
        # Check if all rounds are completed for round robin
        completed_rounds = sum(1 for r in tournament.rounds if r.is_completed)
        if completed_rounds == tournament.total_rounds and tournament.stage != "completed":
            print(f"🏆 Auto-completing round robin tournament {tournament_id}")
            tournament.stage = "completed"
            tournament.current_round = tournament.total_rounds
            db.commit()
    else:
        print(f"ℹ️ Tournament {tournament_id} is not group_knockout format, skipping auto-advancement")
    
    # Recalculate tournament stats after potential stage advancement
    recalculate_tournament_stats(db, tournament_id)
    
    # Refresh tournament object to get latest state
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    
    return True


def can_complete_round(db: Session, tournament_id: int, round_number: int) -> dict:
    """
    Check if a round can be manually completed and provide status information.
    Now requires ALL matches in the round to be completed.
    """
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        return {"can_complete": False, "reason": "Tournament not found"}
    
    # Find the specific round
    round_obj = db.query(Round).filter(
        Round.tournament_id == tournament_id,
        Round.round_number == round_number
    ).first()
    
    if not round_obj:
        return {"can_complete": False, "reason": "Round not found"}
    
    if round_obj.is_completed:
        # Get round matches and their status for display purposes
        round_matches = db.query(Match).filter(Match.round_id == round_obj.id).all()
        completed_matches = [m for m in round_matches if m.is_completed]
        total_matches = len(round_matches)
        completed_count = len(completed_matches)
        
        return {
            "can_complete": False, 
            "reason": "Round is already completed",
            "round_number": round_number,
            "total_matches": total_matches,
            "completed_matches": completed_count,
            "completion_percentage": 100.0
        }
    
    # Check if this round is the current round or a future round
    if round_number > tournament.current_round:
        return {"can_complete": False, "reason": "Cannot complete future rounds"}
    
    # Get round matches and their status
    round_matches = db.query(Match).filter(Match.round_id == round_obj.id).all()
    completed_matches = [m for m in round_matches if m.is_completed]
    total_matches = len(round_matches)
    completed_count = len(completed_matches)
    
    # Check for matches without games (placeholder matches)
    matches_without_games = [m for m in round_matches if not m.games]
    if matches_without_games:
        placeholder_teams = []
        for match in matches_without_games:
            if match.white_team_id < 0 or match.black_team_id < 0:
                white_name = get_placeholder_name(match.white_team_id) if match.white_team_id < 0 else f"Team {match.white_team_id}"
                black_name = get_placeholder_name(match.black_team_id) if match.black_team_id < 0 else f"Team {match.black_team_id}"
                placeholder_teams.append(f"{white_name} vs {black_name}")
        
        if placeholder_teams:
            return {
                "can_complete": False,
                "reason": f"Cannot complete round with placeholder matches: {', '.join(placeholder_teams)}. Tournament stage needs to advance first.",
                "round_number": round_number,
                "total_matches": total_matches,
                "completed_matches": completed_count,
                "completion_percentage": (completed_count / total_matches * 100) if total_matches > 0 else 0,
                "missing_matches": total_matches - completed_count,
                "placeholder_matches": len(matches_without_games)
            }
    
    # Require ALL matches to be completed
    if completed_count < total_matches:
        return {
            "can_complete": False,
            "reason": f"All matches must be completed. Currently {completed_count}/{total_matches} matches finished.",
            "round_number": round_number,
            "total_matches": total_matches,
            "completed_matches": completed_count,
            "completion_percentage": (completed_count / total_matches * 100) if total_matches > 0 else 0,
            "missing_matches": total_matches - completed_count
        }
    
    return {
        "can_complete": True,
        "round_number": round_number,
        "total_matches": total_matches,
        "completed_matches": completed_count,
        "completion_percentage": 100.0,
        "message": "All matches in this round are completed"
    }

def start_tournament(db: Session, tournament_id: int) -> bool:
    """
    Start a tournament by changing stage from 'not_yet_started' to 'group' 
    and setting current_round to 1.
    """
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        return False
    
    if tournament.stage != "not_yet_started":
        return False  # Tournament already started
    
    # Check if tournament has teams
    teams_count = db.query(Team).filter(Team.tournament_id == tournament_id).count()
    if teams_count < 2:
        return False  # Need at least 2 teams to start
    
    # Start the tournament
    tournament.stage = "group"
    tournament.current_round = 1
    
    db.commit()
    print(f"🚀 Tournament {tournament_id} started - moved to group stage, current round set to 1")
    return True

def create_tournament_structure(db: Session,data: schemas.TournamentCreate):
    """
    Create tournament, teams, players, rounds, matches, and games.
    """
    # Step 1: Create the tournament
    tour = Tournament(
        name=data.name,
        description=data.description,
        venue=data.venue,
        start_date=data.start_date or datetime.utcnow(),
        end_date=data.end_date,
        format=data.format,
        stage="not_yet_started"
    )
    db.add(tour)
    db.flush()  # To get tour.id

    # Step 2: Create teams and players
    teams = []
    for name, num_players in zip(data.team_names, data.players_per_team):
        team = Team(name=name, tournament_id=tour.id)
        db.add(team)
        db.flush()
        teams.append(team)

        for i in range(num_players):
            player = Player(
                name=f"Player {i + 1} of {name}",
                team_id=team.id
            )
            db.add(player)

    db.flush()

    # Step 3: Generate all rounds based on tournament format
    team_ids = [team.id for team in teams]
    
    if data.format == "round_robin":
        all_rounds = generate_all_round_robin_rounds(team_ids)
    elif data.format == "group_knockout":
        all_rounds = generate_group_knockout_rounds(team_ids)
    else:
        raise ValueError(f"Unsupported tournament format: {data.format}")
    
    tour.total_rounds = len(all_rounds)
    db.commit()

    # Step 4: Create rounds, matches, and games
    for round_num, pairings in enumerate(all_rounds, start=1):
        rnd = Round(tournament_id=tour.id, round_number=round_num)
        db.add(rnd)
        db.flush()

        for white_id, black_id in pairings:
            match = Match(
                tournament_id=tour.id,
                round_id=rnd.id,
                round_number=round_num,
                white_team_id=white_id,
                black_team_id=black_id
            )
            db.add(match)
            db.flush()

            # Only create games for actual teams, not placeholders (negative IDs)
            if white_id > 0 and black_id > 0:
                white_players = db.query(Player).filter_by(team_id=white_id).order_by(Player.id).all()
                black_players = db.query(Player).filter_by(team_id=black_id).order_by(Player.id).all()

                for board_num, (wp, bp) in enumerate(zip(white_players, black_players), start=1):
                    game = Game(
                        match_id=match.id,
                        board_number=board_num,
                        white_player_id=wp.id,
                        black_player_id=bp.id
                    )
                    db.add(game)

    db.commit()
    return tour

def calculate_standings(db: Session, tournament_id: int) -> List[schemas.StandingsEntry]:
    tour = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tour:
        return []

    # Get the number of group stage rounds
    group_stage_rounds = get_group_stage_rounds_count(db, tournament_id)

    team_dict = {team.id: team for team in tour.teams}
    for team in team_dict.values():
        team.match_points = 0.0
        team.game_points = 0.0
        team.sonneborn_berger = 0.0
        team.wins = 0
        team.draws = 0
        team.losses = 0
    db.commit()

    # First pass: calculate match_points and game_points (only from group stage rounds)
    match_results = []
    for m in tour.matches:
        if not m.is_completed:
            continue
        
        # Only include matches from group stage rounds
        if m.round_number > group_stage_rounds:
            continue

        white_team = team_dict.get(m.white_team_id)
        black_team = team_dict.get(m.black_team_id)
        if not white_team or not black_team:
            continue

        white_team.game_points += m.white_score
        black_team.game_points += m.black_score

        if m.result == "white_win":
            white_team.match_points += 2.0  # Win = 2 points
            result = "white_win"
            white_team.wins += 1
            black_team.losses += 1
        elif m.result == "black_win":
            black_team.match_points += 2.0  # Win = 2 points
            result = "black_win"
            black_team.wins += 1
            white_team.losses += 1
        elif m.result == "draw":
            white_team.match_points += 1.0  # Draw = 1 point each
            black_team.match_points += 1.0
            result = "draw"
            white_team.draws += 1
            black_team.draws += 1
        else:
            continue

        match_results.append((white_team.id, black_team.id, result))
    for team in team_dict.values():
        team.matches_played = team.wins + team.draws + team.losses

    # Second pass: calculate Sonneborn-Berger
    for white_id, black_id, result in match_results:
        white = team_dict[white_id]
        black = team_dict[black_id]

        if result == "white_win":
            white.sonneborn_berger += black.match_points
        elif result == "black_win":
            black.sonneborn_berger += white.match_points
        elif result == "draw":
            white.sonneborn_berger += black.match_points / 2
            black.sonneborn_berger += white.match_points / 2

    db.commit()

    return [
        schemas.StandingsEntry(
            team_id=team.id,
            team_name=team.name,
            matches_played=team.matches_played,
            wins=team.wins,
            draws=team.draws,
            losses=team.losses,
            match_points=team.match_points,
            game_points=team.game_points,
            sonneborn_berger=round(team.sonneborn_berger, 2),
        )
        for team in sorted(team_dict.values(), key=lambda t: (-t.match_points, -t.game_points, -t.sonneborn_berger))
    ]


def calculate_group_standings(db: Session, tournament_id: int):
    """
    Calculate standings for group + knockout format tournaments.
    Returns separate standings for Group A and Group B.
    """
    tour = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tour or tour.format != "group_knockout":
        return {"group_a": [], "group_b": []}
    
    # Get all teams
    teams = db.query(Team).filter(Team.tournament_id == tournament_id).all()
    if not teams:
        return {"group_a": [], "group_b": []}
    
    # Split teams into groups (same logic as tournament creation)
    teams_sorted = sorted(teams, key=lambda t: t.id)  # Ensure consistent ordering
    mid = len(teams_sorted) // 2
    group_a_teams = teams_sorted[:mid]
    group_b_teams = teams_sorted[mid:]
    
    def calculate_group_stats(group_teams):
        team_dict = {}
        for team in group_teams:
            team_dict[team.id] = {
                'id': team.id,
                'name': team.name,
                'match_points': 0.0,
                'game_points': 0.0,
                'sonneborn_berger': 0.0,
                'matches_played': 0,
                'wins': 0,
                'draws': 0,
                'losses': 0,
                'group': 'A' if team in group_a_teams else 'B'
            }
        
        # Get all matches for this tournament (only from group stage rounds)
        group_stage_rounds = get_group_stage_rounds_count(db, tournament_id)
        matches = db.query(Match).filter(
            Match.tournament_id == tournament_id,
            Match.is_completed == True,
            Match.round_number <= group_stage_rounds
        ).all()
        
        # Filter matches to only include those within this group
        group_team_ids = {team.id for team in group_teams}
        for match in matches:
            if match.white_team_id in group_team_ids and match.black_team_id in group_team_ids:
                # This is a group stage match
                white_stats = team_dict[match.white_team_id]
                black_stats = team_dict[match.black_team_id]
                
                # Get all games for this match
                games = db.query(Game).filter(Game.match_id == match.id).all()
                
                white_score = sum(1 for g in games if g.result == "white_win") + sum(0.5 for g in games if g.result == "draw")
                black_score = sum(1 for g in games if g.result == "black_win") + sum(0.5 for g in games if g.result == "draw")
                
                white_stats['game_points'] += white_score
                black_stats['game_points'] += black_score
                white_stats['matches_played'] += 1
                black_stats['matches_played'] += 1
                
                # Determine match result using 2-point system
                if white_score > black_score:
                    white_stats['match_points'] += 2.0  # Win = 2 points
                    white_stats['wins'] += 1
                    black_stats['losses'] += 1
                elif black_score > white_score:
                    black_stats['match_points'] += 2.0  # Win = 2 points
                    black_stats['wins'] += 1
                    white_stats['losses'] += 1
                else:
                    white_stats['match_points'] += 1.0  # Draw = 1 point each
                    black_stats['match_points'] += 1.0
                    white_stats['draws'] += 1
                    black_stats['draws'] += 1
        
        # Calculate Sonneborn-Berger scores
        for team_id, stats in team_dict.items():
            sonneborn_berger = 0.0
            for match in matches:
                if match.white_team_id == team_id or match.black_team_id == team_id:
                    opponent_id = match.black_team_id if match.white_team_id == team_id else match.white_team_id
                    if opponent_id in team_dict:
                        games = db.query(Game).filter(Game.match_id == match.id).all()
                        if match.white_team_id == team_id:
                            score = sum(1 for g in games if g.result == "white_win") + sum(0.5 for g in games if g.result == "draw")
                        else:
                            score = sum(1 for g in games if g.result == "black_win") + sum(0.5 for g in games if g.result == "draw")
                        sonneborn_berger += score * team_dict[opponent_id]['game_points']
            stats['sonneborn_berger'] = sonneborn_berger
        
        # Sort by match points, then game points, then Sonneborn-Berger
        return sorted(team_dict.values(), key=lambda t: (-t['match_points'], -t['game_points'], -t['sonneborn_berger']))
    
    return {
        "group_a": calculate_group_stats(group_a_teams),
        "group_b": calculate_group_stats(group_b_teams)
    }


def get_knockout_qualifiers(db: Session, tournament_id: int):
    """
    Get the top 2 teams from each group for knockout stage.
    Returns: (a1, a2, b1, b2) team IDs
    """
    standings = calculate_group_standings(db, tournament_id)
    
    group_a = standings["group_a"]
    group_b = standings["group_b"]
    
    if len(group_a) < 2 or len(group_b) < 2:
        return None, None, None, None
    
    a1 = group_a[0]["id"]  # Group A winner
    a2 = group_a[1]["id"]  # Group A runner-up
    b1 = group_b[0]["id"]  # Group B winner  
    b2 = group_b[1]["id"]  # Group B runner-up
    
    return a1, a2, b1, b2


def get_group_stage_rounds_count(db: Session, tournament_id: int) -> int:
    """
    Get the number of rounds that belong to the group stage.
    For group+knockout format, this excludes semifinal and final rounds.
    For round_robin format, all rounds are group stage rounds.
    """
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        return 0
    
    if tournament.format == "round_robin":
        # All rounds are group stage for round-robin
        return tournament.total_rounds or 0
    elif tournament.format == "group_knockout":
        # Total rounds minus semifinal round minus final round = group stage rounds
        total_rounds = tournament.total_rounds or 0
        if total_rounds >= 2:
            return total_rounds - 2  # Subtract semifinal and final rounds
        return 0
    
    return 0


def generate_group_knockout_rounds(team_ids: List[int]) -> List[List[Tuple[int, int]]]:
    """
    Generate rounds for group + knockout format.
    Split teams into 2 groups, run round-robin in each group,
    then knockout with top 2 from each group.
    """
    teams = team_ids[:]
    n = len(teams)
    
    if n < 4 or n % 2 != 0:
        raise ValueError("Group + knockout format requires even number of teams (minimum 4)")
    
    # Split teams into 2 groups
    mid = n // 2
    group_a = teams[:mid]
    group_b = teams[mid:]
    
    rounds = []
    
    # Generate group stage rounds
    group_a_rounds = generate_all_round_robin_rounds(group_a)
    group_b_rounds = generate_all_round_robin_rounds(group_b)
    
    # Combine group rounds (both groups play simultaneously)
    max_group_rounds = max(len(group_a_rounds), len(group_b_rounds))
    for i in range(max_group_rounds):
        round_pairings = []
        if i < len(group_a_rounds):
            round_pairings.extend(group_a_rounds[i])
        if i < len(group_b_rounds):
            round_pairings.extend(group_b_rounds[i])
        rounds.append(round_pairings)
    
    # Placeholder for knockout rounds (will be determined after group stage)
    # We'll use negative IDs as placeholders for knockout positions
    # -1: A1 (Group A 1st), -2: A2 (Group A 2nd), -3: B1 (Group B 1st), -4: B2 (Group B 2nd)
    # -5: SF1 Winner, -6: SF2 Winner, -7: SF1 Loser, -8: SF2 Loser
    
    # Semi-finals round
    semi_round = [
        (-1, -4),  # A1 vs B2
        (-2, -3)   # A2 vs B1
    ]
    rounds.append(semi_round)
    
    # Final round
    # Final round - contains both final and 3rd place matches
    final_round = [
        (-5, -6),  # Winner SF1 vs Winner SF2 (Final)
        (-7, -8)   # Loser SF1 vs Loser SF2 (3rd place)
    ]
    rounds.append(final_round)
    
    return rounds


def get_placeholder_name(placeholder_id: int) -> str:
    """Convert placeholder ID to display name"""
    placeholder_map = {
        -1: "A1",  # Group A 1st
        -2: "A2",  # Group A 2nd
        -3: "B1",  # Group B 1st
        -4: "B2",  # Group B 2nd
        -5: "Winner SF1",  # Semi-final 1 winner
        -6: "Winner SF2",  # Semi-final 2 winner
        -7: "Loser SF1",   # Semi-final 1 loser
        -8: "Loser SF2"    # Semi-final 2 loser
    }
    return placeholder_map.get(placeholder_id, f"Placeholder {placeholder_id}")


def can_advance_to_knockout(db: Session, tournament_id: int) -> bool:
    """Check if tournament can advance from group stage to semifinal stage"""
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament or tournament.format != "group_knockout" or tournament.stage != "group":
        return False
    
    # Check if all group stage rounds are completed
    team_count = len(tournament.teams)
    teams_per_group = team_count // 2
    group_rounds = teams_per_group - 1 if teams_per_group % 2 == 0 else teams_per_group
    
    # Get all group stage rounds and check completion
    group_stage_rounds = db.query(Round).filter(
        Round.tournament_id == tournament_id,
        Round.round_number <= group_rounds
    ).all()
    
    return all(round_obj.is_completed for round_obj in group_stage_rounds)


def advance_to_knockout_stage(db: Session, tournament_id: int) -> bool:
    """Advance tournament from group stage to knockout stage"""
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament or not can_advance_to_knockout(db, tournament_id):
        return False
    
    # Calculate group standings and determine qualifiers
    group_standings = calculate_group_standings(db, tournament_id)
    
    if "group_a" not in group_standings or "group_b" not in group_standings:
        return False
    
    group_a_standings = group_standings["group_a"][:2]  # Top 2 from Group A
    group_b_standings = group_standings["group_b"][:2]  # Top 2 from Group B
    
    if len(group_a_standings) < 2 or len(group_b_standings) < 2:
        return False
    
    # Map placeholders to actual teams
    placeholder_to_team = {
        -1: group_a_standings[0]["id"],  # A1
        -2: group_a_standings[1]["id"],  # A2
        -3: group_b_standings[0]["id"],  # B1
        -4: group_b_standings[1]["id"]   # B2
    }
    
    # Update knockout stage matches with actual teams
    team_count = len(tournament.teams)
    teams_per_group = team_count // 2
    group_rounds = teams_per_group - 1 if teams_per_group % 2 == 0 else teams_per_group
    knockout_start_round = group_rounds + 1
    
    # Update semi-final matches
    semi_final_round = db.query(Round).filter(
        Round.tournament_id == tournament_id,
        Round.round_number == knockout_start_round
    ).first()
    
    if semi_final_round:
        semi_matches = db.query(Match).filter(Match.round_id == semi_final_round.id).all()
        if len(semi_matches) >= 2:
            # Match 1: A1 vs B2
            semi_matches[0].white_team_id = placeholder_to_team[-1]  # A1
            semi_matches[0].black_team_id = placeholder_to_team[-4]  # B2
            
            # Match 2: A2 vs B1  
            semi_matches[1].white_team_id = placeholder_to_team[-2]  # A2
            semi_matches[1].black_team_id = placeholder_to_team[-3]  # B1
            
            # Create games for both semi-final matches
            for match in semi_matches[:2]:
                # Remove any existing games (shouldn't be any, but just in case)
                db.query(Game).filter(Game.match_id == match.id).delete()
                
                # Create new games with actual players
                white_players = db.query(Player).filter_by(team_id=match.white_team_id).order_by(Player.id).all()
                black_players = db.query(Player).filter_by(team_id=match.black_team_id).order_by(Player.id).all()
                
                for board_num, (wp, bp) in enumerate(zip(white_players, black_players), start=1):
                    game = Game(
                        match_id=match.id,
                        board_number=board_num,
                        white_player_id=wp.id,
                        black_player_id=bp.id
                    )
                    db.add(game)
    
    # Update tournament stage to semifinal
    tournament.stage = "semifinal"
    db.commit()
    
    return True


def can_advance_to_final(db: Session, tournament_id: int) -> bool:
    """Check if tournament can advance from semifinal stage to final stage"""
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament or tournament.format != "group_knockout" or tournament.stage != "semifinal":
        print(f"❌ Cannot advance to final: tournament={tournament is not None}, format={tournament.format if tournament else 'None'}, stage={tournament.stage if tournament else 'None'}")
        return False
    
    # Calculate which rounds are semi-finals
    team_count = len(tournament.teams)
    teams_per_group = team_count // 2
    group_rounds = teams_per_group - 1 if teams_per_group % 2 == 0 else teams_per_group
    semi_final_round_number = group_rounds + 1
    
    # Check if semi-final round is completed
    semi_final_round = db.query(Round).filter(
        Round.tournament_id == tournament_id,
        Round.round_number == semi_final_round_number
    ).first()
    
    if not semi_final_round or not semi_final_round.is_completed:
        print(f"❌ Semifinal round {semi_final_round_number} not completed: round_exists={semi_final_round is not None}, is_completed={semi_final_round.is_completed if semi_final_round else False}")
        return False
    
    # Check if all semi-final matches are completed
    semi_matches = db.query(Match).filter(
        Match.round_id == semi_final_round.id,
        Match.is_completed == True
    ).all()
    
    print(f"🔍 Semifinal matches: found {len(semi_matches)} completed matches")
    
    # Should have exactly 2 completed semi-final matches
    result = len(semi_matches) == 2
    print(f"✅ Can advance to final: {result}")
    return result


def advance_to_final_stage(db: Session, tournament_id: int) -> bool:
    """Advance tournament from semi-finals to final stage (club final and 3rd place together)"""
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament or not can_advance_to_final(db, tournament_id):
        return False
    
    # Calculate round numbers
    team_count = len(tournament.teams)
    teams_per_group = team_count // 2
    group_rounds = teams_per_group - 1 if teams_per_group % 2 == 0 else teams_per_group
    semi_final_round_number = group_rounds + 1
    final_phase_round_number = group_rounds + 2  # Both final and 3rd place in same round
    
    # Get semi-final results
    semi_final_round = db.query(Round).filter(
        Round.tournament_id == tournament_id,
        Round.round_number == semi_final_round_number
    ).first()
    
    if not semi_final_round:
        return False
    
    semi_matches = db.query(Match).filter(
        Match.round_id == semi_final_round.id,
        Match.is_completed == True
    ).all()
    
    if len(semi_matches) != 2:
        return False
    
    # Determine winners and losers from semi-finals
    sf1_match = semi_matches[0]  # A1 vs B2
    sf2_match = semi_matches[1]  # A2 vs B1
    
    # Determine SF1 winner and loser
    if sf1_match.white_score > sf1_match.black_score:
        sf1_winner = sf1_match.white_team_id
        sf1_loser = sf1_match.black_team_id
    else:
        sf1_winner = sf1_match.black_team_id
        sf1_loser = sf1_match.white_team_id
    
    # Determine SF2 winner and loser
    if sf2_match.white_score > sf2_match.black_score:
        sf2_winner = sf2_match.white_team_id
        sf2_loser = sf2_match.black_team_id
    else:
        sf2_winner = sf2_match.black_team_id
        sf2_loser = sf2_match.white_team_id
    
    print(f"🏆 Semifinal results: SF1 winner={sf1_winner}, SF1 loser={sf1_loser}, SF2 winner={sf2_winner}, SF2 loser={sf2_loser}")
    
    # Find the final phase round (contains both final and 3rd place)
    final_phase_round = db.query(Round).filter(
        Round.tournament_id == tournament_id,
        Round.round_number == final_phase_round_number
    ).first()
    
    if not final_phase_round:
        print(f"❌ No final phase round found for tournament {tournament_id}")
        return False
    
    # Update existing placeholder matches instead of creating new ones
    all_final_matches = db.query(Match).filter(Match.round_id == final_phase_round.id).all()
    
    # Find final match (placeholder with -5 vs -6) and 3rd place match (placeholder with -7 vs -8)
    final_match = None
    third_place_match = None
    
    for match in all_final_matches:
        if match.white_team_id == -5 and match.black_team_id == -6:  # Winner SF1 vs Winner SF2
            final_match = match
        elif match.white_team_id == -7 and match.black_team_id == -8:  # Loser SF1 vs Loser SF2
            third_place_match = match
    
    if not final_match or not third_place_match:
        print(f"❌ Could not find placeholder matches for final stage in tournament {tournament_id}")
        print(f"   Available matches: {[(m.white_team_id, m.black_team_id) for m in all_final_matches]}")
        return False
    
    print(f"🎯 Found placeholder matches - Final: {final_match.white_team_id} vs {final_match.black_team_id}, 3rd place: {third_place_match.white_team_id} vs {third_place_match.black_team_id}")
    
    # Update final match with actual teams
    final_match.white_team_id = sf1_winner
    final_match.black_team_id = sf2_winner
    
    # Update 3rd place match with actual teams
    third_place_match.white_team_id = sf1_loser
    third_place_match.black_team_id = sf2_loser
    
    print(f"✅ Updated matches - Final: {final_match.white_team_id} vs {final_match.black_team_id}, 3rd place: {third_place_match.white_team_id} vs {third_place_match.black_team_id}")
    
    # Create games for final match (remove any existing placeholder games first)
    db.query(Game).filter(Game.match_id == final_match.id).delete()
    
    white_players = db.query(Player).filter_by(team_id=sf1_winner).order_by(Player.id).all()
    black_players = db.query(Player).filter_by(team_id=sf2_winner).order_by(Player.id).all()
    
    for board_num, (wp, bp) in enumerate(zip(white_players, black_players), start=1):
        game = Game(
            match_id=final_match.id,
            board_number=board_num,
            white_player_id=wp.id,
            black_player_id=bp.id
        )
        db.add(game)
    
    # Create games for 3rd place match (remove any existing placeholder games first)
    db.query(Game).filter(Game.match_id == third_place_match.id).delete()
    
    white_players = db.query(Player).filter_by(team_id=sf1_loser).order_by(Player.id).all()
    black_players = db.query(Player).filter_by(team_id=sf2_loser).order_by(Player.id).all()
    
    for board_num, (wp, bp) in enumerate(zip(white_players, black_players), start=1):
        game = Game(
            match_id=third_place_match.id,
            board_number=board_num,
            white_player_id=wp.id,
            black_player_id=bp.id
        )
        db.add(game)
    
    print(f"🎮 Created {len(white_players)} games for final match")
    print(f"🎮 Created {len(black_players)} games for 3rd place match")
    
    # Update tournament stage to final
    tournament.stage = "final"
    
    # Flush changes to ensure they're written to the database session
    db.flush()
    
    # Verify the match team IDs are correctly set before commit
    final_match_after = db.query(Match).filter(Match.id == final_match.id).first()
    third_place_match_after = db.query(Match).filter(Match.id == third_place_match.id).first()
    print(f"🔍 Final verification - Final match: {final_match_after.white_team_id} vs {final_match_after.black_team_id}")
    print(f"🔍 Final verification - 3rd place: {third_place_match_after.white_team_id} vs {third_place_match_after.black_team_id}")
    
    # Ensure all changes are committed to database
    db.commit()
    
    print(f"✅ Tournament {tournament_id} successfully advanced to final stage")
    return True


def can_complete_tournament(db: Session, tournament_id: int) -> bool:
    """Check if tournament can be completed (final and 3rd place matches are done)"""
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament or tournament.format != "group_knockout" or tournament.stage != "final":
        return False
    
    # Calculate round numbers
    team_count = len(tournament.teams)
    teams_per_group = team_count // 2
    group_rounds = teams_per_group - 1 if teams_per_group % 2 == 0 else teams_per_group
    final_phase_round_number = group_rounds + 2  # Both final and 3rd place in same round
    
    # Get the final phase round
    final_phase_round = db.query(Round).filter(
        Round.tournament_id == tournament_id,
        Round.round_number == final_phase_round_number
    ).first()
    
    if not final_phase_round or not final_phase_round.is_completed:
        return False
    
    # Get all completed matches in the final phase round
    final_phase_matches = db.query(Match).filter(
        Match.round_id == final_phase_round.id,
        Match.is_completed == True
    ).all()
    
    # We need at least 2 completed matches (final and 3rd place)
    return len(final_phase_matches) >= 2


def complete_tournament(db: Session, tournament_id: int) -> bool:
    """Complete the tournament and set stage to 'completed'"""
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        return False
    
    # For group_knockout tournaments, check if they can be completed
    if tournament.format == "group_knockout":
        if not can_complete_tournament(db, tournament_id):
            return False
    
    tournament.stage = "completed"
    # Set current_round to total_rounds when completed
    tournament.current_round = tournament.total_rounds
    db.commit()
    
    print(f"🏆 Tournament {tournament_id} completed successfully")
    return True


def _get_round_robin_final_rankings(db: Session, tournament) -> Dict[str, Any]:
    """Get final rankings for round robin tournament based on standings"""
    from collections import defaultdict
    
    # Calculate team statistics
    team_stats = defaultdict(lambda: {'wins': 0, 'draws': 0, 'losses': 0, 'points': 0, 'game_points': 0, 'matches_played': 0})
    
    # Get all completed matches
    rounds = db.query(Round).filter(Round.tournament_id == tournament.id).all()
    
    for round_obj in rounds:
        matches = db.query(Match).filter(
            Match.round_id == round_obj.id,
            Match.is_completed == True
        ).all()
        
        for match in matches:
            white_team_id = match.white_team_id
            black_team_id = match.black_team_id
            
            team_stats[white_team_id]['matches_played'] += 1
            team_stats[black_team_id]['matches_played'] += 1
            
            # Add game points (total game scores)
            team_stats[white_team_id]['game_points'] += match.white_score
            team_stats[black_team_id]['game_points'] += match.black_score
            
            if match.white_score > match.black_score:
                # White team wins
                team_stats[white_team_id]['wins'] += 1
                team_stats[white_team_id]['points'] += 2
                team_stats[black_team_id]['losses'] += 1
            elif match.black_score > match.white_score:
                # Black team wins
                team_stats[black_team_id]['wins'] += 1
                team_stats[black_team_id]['points'] += 2
                team_stats[white_team_id]['losses'] += 1
            else:
                # Draw
                team_stats[white_team_id]['draws'] += 1
                team_stats[white_team_id]['points'] += 1
                team_stats[black_team_id]['draws'] += 1
                team_stats[black_team_id]['points'] += 1
    
    # Sort teams by points (descending), then by game_points (descending), then by wins (descending)
    sorted_teams = sorted(
        team_stats.items(),
        key=lambda x: (x[1]['points'], x[1]['game_points'], x[1]['wins']),
        reverse=True
    )
    
    # Get team names and create rankings
    rankings = []
    for i, (team_id, stats) in enumerate(sorted_teams[:3]):  # Top 3 only
        team = db.query(Team).filter(Team.id == team_id).first()
        title = "Champion" if i == 0 else "Runner-up" if i == 1 else "Third Place"
        
        rankings.append({
            "position": i + 1,
            "team_id": team_id,
            "team_name": team.name if team else "Unknown",
            "title": title
        })
    
    # For round robin, create a summary of best performances instead of specific matches
    if len(rankings) >= 2:
        champion_stats = sorted_teams[0][1]
        runner_up_stats = sorted_teams[1][1]
        
        result = {
            "rankings": rankings,
            "final_match": {
                "winner": rankings[0]["team_name"],
                "loser": rankings[1]["team_name"],
                "score": f"{champion_stats['points']}-{runner_up_stats['points']} pts"
            },
            "third_place_match": {
                "winner": rankings[2]["team_name"] if len(rankings) > 2 else "N/A",
                "loser": "N/A",
                "score": f"{sorted_teams[2][1]['points']} pts" if len(sorted_teams) > 2 else "N/A"
            }
        }
        
        return result
    
    return {"rankings": rankings}


def _get_semifinal_based_rankings(db: Session, tournament, semi_final_round) -> Dict[str, Any]:
    """Get final rankings based on semi-final results when no final round exists"""
    
    # Get semi-final matches
    semi_matches = db.query(Match).filter(
        Match.round_id == semi_final_round.id,
        Match.is_completed == True
    ).all()
    
    if len(semi_matches) != 2:
        return {}
    
    # Determine winners and losers from semi-finals
    semi_results = []
    for match in semi_matches:
        if match.white_score > match.black_score:
            winner_id = match.white_team_id
            loser_id = match.black_team_id
            score = f"{match.white_score}-{match.black_score}"
        else:
            winner_id = match.black_team_id
            loser_id = match.white_team_id
            score = f"{match.black_score}-{match.white_score}"
        
        semi_results.append({
            'match_id': match.id,
            'winner_id': winner_id,
            'loser_id': loser_id,
            'score': score
        })
    
    # Get team details
    all_team_ids = [semi_results[0]['winner_id'], semi_results[1]['winner_id'], 
                    semi_results[0]['loser_id'], semi_results[1]['loser_id']]
    teams = {team.id: team for team in db.query(Team).filter(Team.id.in_(all_team_ids)).all()}
    
    # Create rankings - determine 1st and 2nd place based on group stage performance
    # Since we don't have an actual final, use group standings to break ties
    winner1_id = semi_results[0]['winner_id']
    winner2_id = semi_results[1]['winner_id']
    
    # Get group standings to determine who had better group performance
    group_standings = calculate_group_standings(db, tournament.id)
    all_standings = group_standings.get("group_a", []) + group_standings.get("group_b", [])
    
    # Find the positions of the two winners in group standings
    winner1_group_pos = next((i for i, team in enumerate(all_standings) if team["id"] == winner1_id), 999)
    winner2_group_pos = next((i for i, team in enumerate(all_standings) if team["id"] == winner2_id), 999)
    
    # The team with better group performance (lower position number) becomes champion
    if winner1_group_pos < winner2_group_pos:
        first_place = teams.get(winner1_id)
        second_place = teams.get(winner2_id)
        final_match_info = semi_results[0]
    else:
        first_place = teams.get(winner2_id)
        second_place = teams.get(winner1_id)
        final_match_info = semi_results[1]
    
    # Initialize rankings list
    rankings = []
    
    rankings.append({
        "position": 1,
        "team_id": first_place.id if first_place else None,
        "team_name": first_place.name if first_place else "Unknown",
        "title": "Champion"
    })
    
    rankings.append({
        "position": 2,
        "team_id": second_place.id if second_place else None,
        "team_name": second_place.name if second_place else "Unknown", 
        "title": "Runner-up"
    })
    
    # Add one of the losers as 3rd place
    loser1 = teams.get(semi_results[0]['loser_id'])
    rankings.append({
        "position": 3,
        "team_id": loser1.id if loser1 else None,
        "team_name": loser1.name if loser1 else "Unknown",
        "title": "Third Place"
    })
    
    return {
        "rankings": rankings,
        "final_match": {
            "winner": first_place.name if first_place else "Unknown",
            "loser": second_place.name if second_place else "Unknown",
            "score": final_match_info['score']
        },
        "third_place_match": {
            "winner": loser1.name if loser1 else "Unknown",
            "loser": teams.get(semi_results[1]['loser_id']).name if teams.get(semi_results[1]['loser_id']) else "Unknown",
            "score": "Semi-final result"
        }
    }


def get_final_rankings(db: Session, tournament_id: int) -> Dict[str, Any]:
    """Get the final top 3 rankings for a completed tournament"""
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament or tournament.stage != "completed":
        return {}
    
    # Get best players data
    from . import crud
    best_players = crud.get_best_players(db, tournament_id)
    
    # Handle round robin tournaments
    if tournament.format == "round_robin":
        result = _get_round_robin_final_rankings(db, tournament)
        # Add best player to round robin results
        if best_players:
            result["best_player"] = {
                "name": best_players[0].player_name
            }
        return result
    
    # Handle group knockout tournaments - simplified logic
    # Calculate round numbers
    team_count = len(tournament.teams)
    teams_per_group = team_count // 2
    group_rounds = teams_per_group - 1 if teams_per_group % 2 == 0 else teams_per_group
    final_phase_round_number = group_rounds + 2  # Both final and 3rd place in same round
    
    # Get the final phase round
    final_phase_round = db.query(Round).filter(
        Round.tournament_id == tournament_id,
        Round.round_number == final_phase_round_number
    ).first()
    
    if not final_phase_round:
        return {}
    
    # Get all completed matches in the final phase round
    final_phase_matches = db.query(Match).filter(
        Match.round_id == final_phase_round.id,
        Match.is_completed == True
    ).all()
    
    if len(final_phase_matches) < 2:
        return {}
    
    # Sort matches by ID to get consistent ordering
    # The 2nd last match (lower ID) is the final, the last match (higher ID) is 3rd place
    sorted_matches = sorted(final_phase_matches, key=lambda m: m.id)
    
    if len(sorted_matches) < 2:
        return {}
    
    final_match = sorted_matches[0]  # 2nd last match (final)
    third_place_match = sorted_matches[1]  # Last match (3rd place)
    
    # Determine rankings based on match results
    # Champion (1st): Winner of final match
    # Runner-up (2nd): Loser of final match  
    # Third Place (3rd): Winner of 3rd place match
    
    if final_match.white_score > final_match.black_score:
        champion_team_id = final_match.white_team_id
        runner_up_team_id = final_match.black_team_id
    else:
        champion_team_id = final_match.black_team_id
        runner_up_team_id = final_match.white_team_id
    
    if third_place_match.white_score > third_place_match.black_score:
        third_place_team_id = third_place_match.white_team_id
    else:
        third_place_team_id = third_place_match.black_team_id
    
    # Get team details
    champion_team = db.query(Team).filter(Team.id == champion_team_id).first()
    runner_up_team = db.query(Team).filter(Team.id == runner_up_team_id).first()
    third_place_team = db.query(Team).filter(Team.id == third_place_team_id).first()
    
    result = {
        "rankings": [
            {
                "position": 1,
                "team_id": champion_team_id,
                "team_name": champion_team.name if champion_team else "Unknown",
                "title": "Champion"
            },
            {
                "position": 2,
                "team_id": runner_up_team_id,
                "team_name": runner_up_team.name if runner_up_team else "Unknown",
                "title": "Runner-up"
            },
            {
                "position": 3,
                "team_id": third_place_team_id,
                "team_name": third_place_team.name if third_place_team else "Unknown",
                "title": "Third Place"
            }
        ],
        "final_match": {
            "winner": champion_team.name if champion_team else "Unknown",
            "loser": runner_up_team.name if runner_up_team else "Unknown",
            "score": f"{final_match.white_score}-{final_match.black_score}"
        },
        "third_place_match": {
            "winner": third_place_team.name if third_place_team else "Unknown",
            "loser": "N/A",  # We don't track the loser of 3rd place match in this simplified version
            "score": f"{third_place_match.white_score}-{third_place_match.black_score}"
        }
    }
    
    # Add best player information for group knockout tournaments
    if best_players:
        result["best_player"] = {
            "name": best_players[0].player_name
        }
    
    return result


def generate_all_round_robin_rounds(team_ids: List[int]) -> List[List[Tuple[int, int]]]:
    """
    Generate all rounds using the circle method for round‑robin scheduling,
    and assign home/away in one pass so that max_away − min_away ≤ 1.
    """
    # Copy & possibly add dummy for odd‑team byes
    teams = team_ids[:]
    if len(teams) % 2 != 0:
        teams.append(None)

    total_rounds = len(teams) - 1
    half = len(teams) // 2
    rounds: List[List[Tuple[int, int]]] = []

    # Track how many away-games each real team has so far
    away_count = Counter({tid: 0 for tid in team_ids})

    for round_num in range(1, total_rounds + 1):
        # 1) rotate into arr
        arr = teams[:]
        for _ in range(round_num - 1):
            arr = [arr[0]] + [arr[-1]] + arr[1:-1]

        # 2) build this round’s pairings with on‑the‑fly home/away
        pairings: List[Tuple[int, int]] = []
        for i in range(half):
            t1, t2 = arr[i], arr[-i - 1]
            if t1 is None or t2 is None:
                continue

            a1, a2 = away_count[t1], away_count[t2]

            # Greedy: send whichever team has fewer aways to the away slot.
            # If tied, break ties by (round_num + i) parity.
            if a1 < a2:
                home, away = t2, t1
            elif a2 < a1:
                home, away = t1, t2
            else:
                if (round_num + i) % 2 == 0:
                    home, away = t1, t2
                else:
                    home, away = t2, t1

            pairings.append((home, away))
            away_count[away] += 1

        rounds.append(pairings)

    return rounds

