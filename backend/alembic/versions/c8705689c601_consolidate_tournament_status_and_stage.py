"""consolidate_tournament_status_and_stage

Revision ID: c8705689c601
Revises: 8ae6310b7f15
Create Date: 2025-07-27 11:32:44.217492

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c8705689c601'
down_revision = '8ae6310b7f15'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Update existing tournaments to map status/stage combinations to new stage values
    # First, update stage column to consolidate status and stage
    op.execute("""
        UPDATE tournaments 
        SET stage = CASE 
            WHEN status = 'pending' OR status = 'not_started' THEN 'not_yet_started'
            WHEN status = 'active' AND stage = 'group' THEN 'group'
            WHEN status = 'active' AND stage = 'knockout' THEN 'semi_final'
            WHEN status = 'completed' THEN 'completed'
            ELSE stage
        END
    """)
    
    # Drop the status column as it's now consolidated into stage
    op.drop_column('tournaments', 'status')


def downgrade() -> None:
    # Add back the status column
    op.add_column('tournaments', sa.Column('status', sa.String(50), nullable=True))
    
    # Populate status based on stage values
    op.execute("""
        UPDATE tournaments 
        SET status = CASE 
            WHEN stage = 'not_yet_started' THEN 'pending'
            WHEN stage IN ('group', 'semi_final', 'final') THEN 'active'
            WHEN stage = 'completed' THEN 'completed'
            ELSE 'active'
        END
    """)
    
    # Set default value and make it non-nullable
    op.alter_column('tournaments', 'status', nullable=False, server_default='active')