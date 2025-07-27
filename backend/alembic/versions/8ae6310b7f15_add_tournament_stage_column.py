"""add_tournament_stage_column

Revision ID: 8ae6310b7f15
Revises: 73a6780df48b
Create Date: 2025-07-26 23:00:40.493220

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8ae6310b7f15'
down_revision = '73a6780df48b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add stage column to tournaments table
    op.add_column('tournaments', sa.Column('stage', sa.String(50), default='group'))
    
    # Update existing tournaments to have 'group' stage for group_knockout format
    # and 'completed' for round_robin format
    op.execute("UPDATE tournaments SET stage = 'group' WHERE format = 'group_knockout'")
    op.execute("UPDATE tournaments SET stage = 'completed' WHERE format = 'round_robin'")


def downgrade() -> None:
    # Remove stage column from tournaments table
    op.drop_column('tournaments', 'stage')