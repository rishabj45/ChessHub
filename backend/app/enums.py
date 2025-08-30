from enum import Enum as PyEnum
class TournamentStage(PyEnum):
    not_yet_started = "not_yet_started"
    group = "group"
    semi_final = "semi_final"
    final = "final"
    completed = "completed"

class TournamentFormat(PyEnum):
    round_robin = "round_robin"
    group_knockout = "group_knockout"
    swiss = "swiss"

class MatchResult(PyEnum):
    pending = "pending"
    white_win = "white_win"
    black_win = "black_win"
    draw = "draw"
    tiebreaker="tiebreaker"

class Tiebreaker(PyEnum):
    no_tiebreaker="no_tiebreaker"
    pending="pending"
    white_win = "white_win"
    black_win = "black_win"
class MatchLabel(PyEnum):
    group="group"
    SF1="SF1"
    SF2="SF2"
    Final="Final"
    Place3rd="3rd Place"
