### backend/app/tournament_logic.py
from typing import List
from datetime import datetime
from sqlalchemy import desc
from sqlalchemy.orm import Session
from ..models import Tournament, Round, Match, Game, Team, Player
from .. import schemas,crud
from ..enums import TournamentFormat, TournamentStage ,MatchLabel ,MatchResult, MatchLabel,Tiebreaker

def create_tournament_structure(db: Session,data: schemas.TournamentCreate):
    tour = Tournament(
        name=data.name,
        description=data.description,
        venue=data.venue,
        start_date=data.start_date or datetime.now(),
        end_date=data.end_date,
        format=data.format,
        stage=TournamentStage.not_yet_started
    )
    db.add(tour)
    db.flush()  

    teams = []
    x=1
    for j,name in enumerate(data.team_names):
        if data.format == TournamentFormat.group_knockout:
            tour.total_rounds=2
            group_number = 1 if j < len(data.team_names) // 2 else 2
        else:
            tour.total_rounds=0
            group_number = 1
        team = Team(name=name, tournament_id=tour.id,group=group_number,manual_tb4=j+1)
        db.add(team)
        db.flush()
        teams.append(team)

        for i in range(4):
            player = Player(
                name=f"Player {i + 1} of {name}",
                team_id=team.id,
                manual_tb3=x
            )
            x+=1
            db.add(player)

    db.flush()

    group_1_ids = [team.id for team in teams if team.group == 1]
    group_2_ids = [team.id for team in teams if team.group == 2]
    if len(group_1_ids) % 2 != 0:
        group_1_ids.append(None)
    if len(group_2_ids) % 2 != 0:
        group_2_ids.append(None)
    group_1_rounds = len(group_1_ids) -1
    group_2_rounds = len(group_2_ids) -1
    tour.total_group_stage_rounds = max(group_1_rounds, group_2_rounds)
    tour.total_rounds+=tour.total_group_stage_rounds
    
    for round_num in range(1, tour.total_group_stage_rounds + 1):
        rnd = Round(tournament_id=tour.id, round_number=round_num,stage=TournamentStage.group)
        db.add(rnd)
        db.flush()
        if round_num <= group_1_rounds:
            create_round_robin_matches_for_group(db, tour, rnd, group_1_ids,1)
        if round_num <= group_2_rounds:
            create_round_robin_matches_for_group(db, tour, rnd, group_2_ids,2)
    
    if tour.format==TournamentFormat.group_knockout:
          create_knockout_stage_rounds(db, tour)

    db.commit()
    return tour

def create_round_robin_matches_for_group(db: Session, tournament: Tournament, rnd: Round, teams: List[int], group_number: int):
    half = len(teams) // 2
    round_num=rnd.round_number
    arr = teams[:]
    for _ in range(round_num - 1):
        arr = [arr[0]] + [arr[-1]] + arr[1:-1]
    
    for i in range(half):
        white_team_id, black_team_id = arr[i], arr[-i - 1]
        if white_team_id is None or black_team_id is None:
            continue
            
        match = Match(
            tournament_id=tournament.id,
            round_id=rnd.id,
            label=MatchLabel.group,
            round_number=round_num,
            white_team_id=white_team_id,
            black_team_id=black_team_id,
            group=group_number
        )
        db.add(match)
        db.flush()
        
        create_games_for_match(db, match)

def create_knockout_stage_rounds(db: Session, tournament: Tournament):

    semi_rnd_num=tournament.total_group_stage_rounds+1
    semi_rnd = Round(tournament_id=tournament.id, round_number=semi_rnd_num,stage=TournamentStage.semi_final)
    db.add(semi_rnd)
    db.flush()

    for i in range(2):
        match = Match(
            tournament_id=tournament.id,
            round_id=semi_rnd.id,
            round_number=semi_rnd_num,
            label=MatchLabel.SF1 if i==0 else MatchLabel.SF2,
            white_team_id=None,
            black_team_id=None,
            group=0
        )
        db.add(match)
    final_rnd_num=tournament.total_group_stage_rounds+2
    final_rnd = Round(tournament_id=tournament.id, round_number=final_rnd_num,stage=TournamentStage.final)
    db.add(final_rnd)
    db.flush()
    
    for i in range(2):
        match = Match(
            tournament_id=tournament.id,
            round_id=final_rnd.id,
            round_number=final_rnd_num,
            label=MatchLabel.Final if i==1 else MatchLabel.Place3rd,
            white_team_id=None,
            black_team_id=None,
            group=0
        )
        db.add(match)

def create_games_for_match(db: Session, match: Match):
    if match.white_team_id and match.black_team_id :
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

def start_tournament(db: Session, tournament_id: int) -> bool:
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        return False
    if tournament.stage != TournamentStage.not_yet_started:
        return False
    tournament.stage =TournamentStage.group
    tournament.current_round = 1
    db.commit()
    return True


def recalculate_round_stats(db: Session, tournament_id: int, round_number: int):

    round= db.query(Round).filter(Round.tournament_id == tournament_id,Round.round_number==round_number).first()
    if not round:
        return

    for match in round.matches:
        if match.games:
            match.white_score = sum(g.white_score for g in match.games)
            match.black_score = sum(g.black_score for g in match.games)
            
            if match.white_score+match.black_score==4:
                match.is_completed = True
                if match.white_score > match.black_score:
                    match.result = MatchResult.white_win
                    match.tiebreaker=Tiebreaker.no_tiebreaker
                elif match.black_score > match.white_score:
                    match.result = MatchResult.black_win
                    match.tiebreaker=Tiebreaker.no_tiebreaker
                else:
                    if match.label!= MatchLabel.group:
                        match.result=MatchResult.tiebreaker
                        if match.tiebreaker==Tiebreaker.no_tiebreaker or match.tiebreaker==Tiebreaker.pending:
                            match.tiebreaker=Tiebreaker.pending
                            match.is_completed=False    
                    else:
                        match.result = MatchResult.draw
            else:
                match.is_completed = False
                match.result = MatchResult.pending

    db.commit()

    tournament_teams = db.query(Team).filter(Team.tournament_id == tournament_id).all()
    for team in tournament_teams:

        team.match_points = 0
        team.game_points = 0
        team.wins = 0
        team.draws = 0
        team.losses = 0
        
        white_matches = db.query(Match).filter(
            Match.tournament_id == tournament_id,
            Match.white_team_id == team.id,
            Match.is_completed == True,
            Match.label == MatchLabel.group
        ).all()
        
        black_matches = db.query(Match).filter(
            Match.tournament_id == tournament_id,
            Match.black_team_id == team.id,
            Match.is_completed == True,
            Match.label == MatchLabel.group
        ).all()
        team.matches_played = len(white_matches) + len(black_matches)

        for match in white_matches:
            team.game_points += match.white_score
            if match.result == MatchResult.white_win or (match.result == MatchResult.tiebreaker and match.tiebreaker == Tiebreaker.white_win):
                team.match_points += 2
                team.wins += 1
            elif match.result == MatchResult.draw:
                team.match_points += 1
                team.draws += 1
            else:
                team.losses += 1
        
        for match in black_matches:
            team.game_points += match.black_score
            if match.result == MatchResult.black_win or (match.result == MatchResult.tiebreaker and match.tiebreaker == Tiebreaker.black_win):
                team.match_points += 2
                team.wins += 1
            elif match.result == MatchResult.draw:
                team.match_points += 1
                team.draws += 1
            else:
                team.losses += 1

    for team in tournament_teams:
        team.sonneborn_berger = 0
        
        white_matches = db.query(Match).filter(
            Match.tournament_id == tournament_id,
            Match.white_team_id == team.id,
            Match.is_completed == True,
            Match.label == MatchLabel.group
        ).all()
        black_matches = db.query(Match).filter(
            Match.tournament_id == tournament_id,
            Match.black_team_id == team.id,
            Match.is_completed == True,
            Match.label == MatchLabel.group
        ).all()

        for match in white_matches:
            opponent_team = db.query(Team).filter(Team.id == match.black_team_id).first()
            team.sonneborn_berger += match.white_score * opponent_team.match_points

        for match in black_matches:
            opponent_team = db.query(Team).filter(Team.id == match.white_team_id).first()
            team.sonneborn_berger += match.white_score * opponent_team.match_points

    tournament_players = db.query(Player).join(Team, Player.team_id == Team.id).filter(Team.tournament_id == tournament_id).all()
    for player in tournament_players:
        player.points = 0
        player.wins = 0
        player.draws = 0
        player.losses = 0
        
        white_games = db.query(Game).join(Match).filter(
            Match.tournament_id == tournament_id,
            Game.white_player_id == player.id,
            Game.result.isnot(None)
        ).all()
        
        black_games = db.query(Game).join(Match).filter(
            Match.tournament_id == tournament_id,
            Game.black_player_id == player.id,
            Game.result.isnot(None)
        ).all()
        
        for game in white_games:
            player.points += game.white_score
            if game.white_score == 1:
                player.wins += 1
            elif game.white_score == 0.5:
                player.draws += 1
            else:
                player.losses += 1
        
        for game in black_games:
            player.points += game.black_score
            if game.black_score == 1:
                player.wins += 1
            elif game.black_score == 0.5:
                player.draws += 1
            else:
                player.losses += 1
        player.games_played = len(white_games) + len(black_games)

    db.commit()

def complete_round(db: Session, tournament_id: int, round_number: int) -> bool:

    can_complete = can_complete_round(db, tournament_id, round_number)

    if not can_complete["can_complete"]:
        return {
            "completed":False,
            "reason":can_complete["reason"]
                }
    
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    round_obj = db.query(Round).filter(
        Round.tournament_id == tournament_id,
        Round.round_number == round_number
    ).first()

    round_obj.is_completed = True

    if round_number==tournament.total_group_stage_rounds:
        if not check_standings_tie(db,tournament_id):
            tournament.group_standings_validated=True
        if tournament.format==TournamentFormat.round_robin:
            if not check_best_players_tie(db,tournament_id):
                tournament.best_players_validated=True
        elif tournament.format==TournamentFormat.group_knockout:
            if tournament.group_standings_validated:
                tournament.stage=TournamentStage.semi_final
                populate_knockout_matches(db,tournament_id)
                tournament.current_round+=1

    elif round_number==tournament.total_group_stage_rounds+1:
        tournament.stage=TournamentStage.final
        populate_knockout_matches(db,tournament_id)
        tournament.current_round+=1

    elif round_number==tournament.total_group_stage_rounds+2:
        if not check_best_players_tie(db,tournament_id):
                tournament.best_players_validated=True

    else:
        tournament.current_round +=1
    complete_tournament(db,tournament_id)
    
    db.commit()
    db.flush()
        
    return {"completed":True}

def can_complete_round(db: Session, tournament_id: int, round_number: int) -> dict:
    can_complete=True
    reason=""
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        can_complete=False
        reason="Tournament not found"
    else:
        round_obj = db.query(Round).filter(
            Round.tournament_id == tournament_id,
            Round.round_number == round_number
        ).first()
        
        if not round_obj:
            can_complete= False
            reason= "Round not found."
        elif tournament.stage==TournamentStage.not_yet_started:
            can_complete=False
            reason="Tournament not started."
        elif round_number!=tournament.current_round:
            can_complete= False
            reason= "Cannot complete not current round."
        else:
            round_matches = db.query(Match).filter(Match.round_id == round_obj.id).order_by(Match.id).all()
            completed_matches = [m for m in round_matches if m.is_completed]

            if len(completed_matches) < len(round_matches):
                    can_complete = False
                    reason= "All matches must be completed."
    return {
        "can_complete": can_complete,
        "reason": reason,
    }

def complete_tournament(db: Session, tournament_id: int) -> bool:
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if tournament.best_players_validated and tournament.group_standings_validated:
        tournament.stage = TournamentStage.completed
    db.commit()

def populate_knockout_matches(db: Session, tournament_id: int):

    tour = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tour or tour.format != TournamentFormat.group_knockout:
        return

    if tour.stage == TournamentStage.semi_final:
        existing_sf = db.query(Match).filter(
            Match.tournament_id == tournament_id,
            Match.label.in_([MatchLabel.SF1, MatchLabel.SF2])
        ).all()
        if not existing_sf:
            return  
        if all(m.white_team_id is not None and m.black_team_id is not None for m in existing_sf):
            return 

        standings=crud.calculate_standings(db,tournament_id)
        group2_start_index = None
        for idx, team in enumerate(standings):
            if team["group"]==2:
                group2_start_index = idx
                break
        
        if group2_start_index is None or group2_start_index + 1 >= len(standings):
            return  # Not enough teams in group 2

        g1_first, g1_second = standings[0],standings[1]
        g2_first, g2_second = standings[group2_start_index],standings[group2_start_index+1]

        sf1 = existing_sf[0]
        sf2 = existing_sf[1]
        if sf1.label==MatchLabel.SF2:
            sf1,sf2=sf2,sf1
        sf1.white_team_id = g1_first["team_id"]
        sf1.black_team_id = g2_second["team_id"]
        if not sf1.games:
            create_games_for_match(db, sf1)
        sf2.white_team_id = g2_first["team_id"]
        sf2.black_team_id = g1_second["team_id"]
        if not sf2.games:
            create_games_for_match(db, sf2)

    elif tour.stage == TournamentStage.final:
        sf_matches = db.query(Match).filter(
            Match.tournament_id == tournament_id,
            Match.label.in_([MatchLabel.SF1, MatchLabel.SF2])
        ).all()
        sf1=sf_matches[0]
        sf2=sf_matches[1]
        if sf1.label==MatchLabel.SF2:
            sf1,sf2=sf2,sf1

        final_matches = db.query(Match).filter(
            Match.tournament_id == tournament_id,
            Match.label.in_([MatchLabel.Final, MatchLabel.Place3rd])
        ).all()
        if not final_matches:
            return  
        if all(m.white_team_id is not None and m.black_team_id is not None for m in final_matches):
            return 

        def winner_loser(match: Match):
            if match.result == MatchResult.white_win:
                return match.white_team_id, match.black_team_id
            if match.result == MatchResult.black_win:
                return match.black_team_id, match.white_team_id
            if match.result == MatchResult.tiebreaker:
                if match.tiebreaker == Tiebreaker.white_win:
                    return match.white_team_id, match.black_team_id
                if match.tiebreaker == Tiebreaker.black_win:
                    return match.black_team_id, match.white_team_id

        place3rd_match = final_matches[0]
        final_match = final_matches[1]
        if final_match.label!=MatchLabel.Final:
            final_match,place3rd_match=place3rd_match,final_match
        w1, l1 = winner_loser(sf1)
        w2, l2 = winner_loser(sf2)

        final_match.white_team_id = w1
        final_match.black_team_id = w2
        if not final_match.games:
            create_games_for_match(db, final_match)

        place3rd_match.white_team_id = l1
        place3rd_match.black_team_id = l2
        if not place3rd_match.games:
            create_games_for_match(db, place3rd_match)

    db.flush()



def check_standings_tie(db: Session, tournament_id: int) -> dict:

    tournament = db.query(Tournament).filter(Tournament.id==tournament_id).first()
    teams = db.query(Team).filter(Team.tournament_id == tournament_id).order_by(
        desc(Team.match_points),
        desc(Team.game_points), 
        desc(Team.sonneborn_berger)
    ).all()

    groups = {}
    for team in teams:
        group = team.group
        if group not in groups:
            groups[group] = []
        groups[group].append(team)
    ties_found = {}
    teams_to_check = 2 if tournament.format == TournamentFormat.group_knockout else 3
    
    for group_name, group_teams in groups.items():
        tied_teams = {}
        for i in range(min(len(group_teams),teams_to_check)):
            tied_with=[]
            for j in range(len(group_teams)):
                if i==j:
                    continue
                team1 = group_teams[i]
                team2 = group_teams[j]
                
                if (team1.match_points == team2.match_points and
                    team1.game_points == team2.game_points and
                    team1.sonneborn_berger == team2.sonneborn_berger):
                    tied_with.append(team2.id)
            if tied_with:
                tied_teams[team1.id] = tied_with
        
        if tied_teams:
            ties_found[group_name] = tied_teams

    return ties_found

def check_best_players_tie(db: Session, tournament_id: int) -> dict:
    
    tournament_players = db.query(Player).filter(
        Player.team_id.in_(
            db.query(Team.id).filter(Team.tournament_id == tournament_id)
        )
    ).order_by(
        desc(Player.points),
        desc(Player.wins)
    ).all()
    
    top_player = tournament_players[0]
    tied_players = []

    for player in tournament_players[1:]:
        if (player.points == top_player.points and
            player.wins == top_player.wins):
            tied_players.append(player.id)
        else:
            break  
    if tied_players:
        return {top_player.id:tied_players}
    else:
        return {}