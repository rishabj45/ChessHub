"""Add tiebreaker table

Revision ID: add_tiebreaker_table
Revises: c8705689c601
Create Date: 2025-01-30 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_tiebreaker_table'
down_revision = 'c8705689c601'
branch_labels = None
depends_on = None

def upgrade():
    # Create tiebreaker table
    op.create_table('tiebreakers',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('match_id', sa.Integer(), sa.ForeignKey('matches.id'), nullable=False),
        sa.Column('white_team_id', sa.Integer(), sa.ForeignKey('teams.id'), nullable=False),
        sa.Column('black_team_id', sa.Integer(), sa.ForeignKey('teams.id'), nullable=False),
        sa.Column('winner_team_id', sa.Integer(), sa.ForeignKey('teams.id'), nullable=True),
        sa.Column('is_completed', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now())
    )

def downgrade():
    op.drop_table('tiebreakers')
