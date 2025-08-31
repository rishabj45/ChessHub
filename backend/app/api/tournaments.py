### backend/app/api/tournaments.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional,Dict,Any
from ..database import get_db
from ..utilities.auth import get_current_user
from ..schemas import TournamentResponse, TournamentCreate, TournamentUpdate, StandingsResponse, BestPlayersResponse,RoundRescheduleRequest
from .. import crud
from ..utilities import tournament 
from ..models import Match,Round,Team,Player
from ..enums import TournamentStage,TournamentFormat

router = APIRouter(prefix="/api/tournaments", tags=["tournaments"])

@router.get("/current", response_model=Optional[TournamentResponse])
def get_current_tournament(db: Session = Depends(get_db)):
    tour = crud.get_current_tournament(db)
    return tour

@router.get("/{tournament_id}", response_model=TournamentResponse)
def get_tournament(tournament_id: int, db: Session = Depends(get_db)):
    tour = crud.get_tournament(db, tournament_id)
    if not tour:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    return tour

@router.get("/", response_model=List[TournamentResponse])
def get_tournaments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_tournaments(db, skip=skip, limit=limit)

@router.post("/", response_model=TournamentResponse)
def create_tournament(tournament: TournamentCreate, db: Session = Depends(get_db),
                      _: dict = Depends(get_current_user)):
    new_tour = crud.create_tournament(db, tournament)
    return new_tour

@router.put("/{tournament_id}", response_model=TournamentResponse)
def update_tournament(tournament_id: int, tour_upd: TournamentUpdate, db: Session = Depends(get_db),
                      _: dict = Depends(get_current_user)):
    updated = crud.update_tournament(db, tournament_id, tour_upd)
    if not updated:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    return updated

@router.delete("/{tournament_id}")
def delete_tournament(tournament_id: int, db: Session = Depends(get_db),
                      _: dict = Depends(get_current_user)):
    success = crud.delete_tournament(db, tournament_id)
    if not success:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    return {"message": "Tournament deleted successfully"}

@router.post("/{tournament_id}/set-current", response_model=TournamentResponse)
def set_current_tournament(tournament_id: int, db: Session = Depends(get_db),
                           _: dict = Depends(get_current_user)):
    updated = crud.set_current_tournament(db, tournament_id)
    if not updated:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    return updated

@router.get("/{tournament_id}/standings", response_model=StandingsResponse)
def get_standings(tournament_id: int, db: Session = Depends(get_db)):
    tour = crud.get_tournament(db, tournament_id)
    if not tour:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    standings = crud.calculate_standings(db, tournament_id)
    return StandingsResponse(standings=standings)

@router.get("/{tournament_id}/best-players", response_model=BestPlayersResponse)
def get_best_players(tournament_id: int, db: Session = Depends(get_db)):
    tour = crud.get_tournament(db, tournament_id)
    if not tour:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    stats = crud.get_best_players(db, tournament_id)
    return BestPlayersResponse(players=stats)

@router.post("/{tournament_id}/start")
def start_tournament(tournament_id: int, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    success = tournament.start_tournament(db, tournament_id)
    if not success:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot start tournament")
    return {"message": "Tournament started successfully"}

@router.post("/{tournament_id}/round/{round_number}/reschedule")
def reschedule_round(
    tournament_id:int,
    round_number: int,
    req: RoundRescheduleRequest,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user)
):
    round=db.query(Round).filter(Round.tournament_id==tournament_id,Round.round_number==round_number).first()
    if round:
        round.start_date=req.start_date
        matches = db.query(Match).filter(Match.round_number == round_number).order_by(Match.id).all()
        for m in matches:
            m.start_date = req.start_date
        db.commit()
        return {"message": "Rescheduled"}
    else:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, 
            "Round not found"
        )

@router.post("/{tournament_id}/round/{round_number}/complete")
def complete_round(tournament_id: int, round_number: int, db: Session = Depends(get_db), 
                  _: dict = Depends(get_current_user)):
    success = tournament.complete_round(db, tournament_id, round_number)
    if not success["completed"]:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR, 
            success["reason"]
        )
    return {
        "message": f"Round {round_number} completed successfully",
    }

@router.get("/{tournament_id}/round/{round_number}")
def get_round_info(
    tournament_id: int, 
    round_number: int, 
    db: Session = Depends(get_db)
):
    """Get round information including completion status"""
    tour = crud.get_tournament(db, tournament_id)
    if not tour:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    
    round_obj = db.query(Round).filter(
        Round.tournament_id == tournament_id,
        Round.round_number == round_number
    ).first()
    
    if not round_obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Round not found")
    
    return {
        "round_number": round_obj.round_number,
        "tournament_id": round_obj.tournament_id,
        "stage": round_obj.stage.value,
        "start_date": round_obj.start_date.isoformat() if round_obj.start_date else None,
        "is_completed": round_obj.is_completed
    }

@router.get("/{tournament_id}/standings/check-tie")
def check_standings_tie(
    tournament_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    tour=crud.get_tournament(db,tournament_id)
    if not tour:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    ties = tournament.check_standings_tie(db, tournament_id)
    return {
        "tournament_id": tournament_id,
        "has_ties": bool(ties),
        "ties": ties or {}
    }


@router.get("/{tournament_id}/best-players/check-tie")
def check_best_players_tie(
    tournament_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    tour=crud.get_tournament(db,tournament_id)
    if not tour:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    ties = tournament.check_best_players_tie(db, tournament_id)
    return {
            "tournament_id": tournament_id,
        "has_ties": bool(ties),
        "ties": ties or {}
    }
    
@router.post("/{tournament_id}/standings/tiebreaker")
def standings_tiebreaker(
    tournament_id: int,
    request: Dict[str, Any],
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user)
):
    tour = crud.get_tournament(db, tournament_id)
    if not tour:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    round= db.query(Round).filter(Round.tournament_id==tournament_id,Round.round_number==tour.total_group_stage_rounds).first()
    if not round.is_completed:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Group stage is not completed")
    
    ties = tournament.check_standings_tie(db, tournament_id)
    if not ties:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No standings ties found")
    
    first_id = request.get("first_team_id")
    second_id = request.get("second_team_id")
    group = request.get("group") 
    
    if not first_id or not second_id or not group:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Missing required fields")
    
    # Convert to proper types for comparison
    group_key = str(group) if isinstance(group, int) else group
    first_team_id = int(first_id)
    second_team_id = int(second_id)
    
    # Check if the teams are actually tied
    group_ties = ties.get(int(group_key), {})
    if not group_ties:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, 
            f"No ties found for group {group_key}"
        )
    
    # Check if first_team is tied with second_team
    tied_teams = group_ties.get(first_team_id, [])
    if second_team_id not in tied_teams:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, 
            f"Teams {first_team_id} and {second_team_id} are not tied in standings"
        )
    
    # Perform the tiebreaker swap
    team1 = db.query(Team).filter(Team.id == first_team_id).first()
    team2 = db.query(Team).filter(Team.id == second_team_id).first()
    
    if not team1 or not team2:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "One or both teams not found")
    
    # Swap the manual tiebreaker values
    team1.manual_tb4, team2.manual_tb4 = team2.manual_tb4, team1.manual_tb4
    db.commit()
    return True

@router.post("/{tournament_id}/best-player/tiebreaker")
def best_players_tiebreaker(
    tournament_id: int,
    request: Dict[str, Any],
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user)
):
    tour = crud.get_tournament(db, tournament_id)
    if not tour:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    round= db.query(Round).filter(Round.tournament_id==tournament_id,Round.round_number==tour.total_rounds).first()
    if not round.is_completed:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tournament is not completed")
    ties = tournament.check_best_players_tie(db, tournament_id)
    if not ties:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No best players ties found")
    
    first_player_id = request.get("first_player_id")
    second_player_id = request.get("second_player_id")
    
    if not first_player_id or not second_player_id :
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Missing required fields")

    if first_player_id in ties and second_player_id in ties[first_player_id]:
        player1 = db.query(Player).filter(Player.id == first_player_id).first()
        player2 = db.query(Player).filter(Player.id == second_player_id).first()
        player1.manual_tb3, player2.manual_tb3 = player2.manual_tb3, player1.manual_tb3
        db.commit()
        
    
    else:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, 
            "The specified players are not tied in best players ranking"
        )
    return True

@router.post("/{tournament_id}/standings/validate")
def validate_standings(
    tournament_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user)
):
    tour = crud.get_tournament(db, tournament_id)
    if not tour:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    round=db.query(Round).filter(Round.tournament_id==tournament_id,Round.round_number==tour.total_group_stage_rounds).first()
    if round and round.is_completed:
        tour.group_standings_validated=True
        if tour.format==TournamentFormat.group_knockout:
            tour.stage=TournamentStage.semi_final
            tournament.populate_knockout_matches(db,tournament_id)
            tour.current_round+=1
        tournament.complete_tournament(db,tournament_id)

@router.post("/{tournament_id}/best-players/validate")
def validate_best_players(
    tournament_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user)
):
    tour = crud.get_tournament(db, tournament_id)
    if not tour:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    round=db.query(Round).filter(Round.tournament_id==tournament_id,Round.round_number==tour.total_rounds).first()
    if round and round.is_completed:
        tour.best_players_validated=True 
    tournament.complete_tournament(db,tournament_id)       
