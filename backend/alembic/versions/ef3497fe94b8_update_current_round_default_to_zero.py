"""update_current_round_default_to_zero

Revision ID: ef3497fe94b8
Revises: c8705689c601
Create Date: 2025-07-27 11:39:14.799058

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ef3497fe94b8'
down_revision = 'c8705689c601'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Update existing tournaments that are not yet started to have current_round = 0
    op.execute("""
        UPDATE tournaments 
        SET current_round = 0 
        WHERE stage = 'not_yet_started'
    """)


def downgrade() -> None:
    # Revert current_round back to 1 for tournaments that are not yet started
    op.execute("""
        UPDATE tournaments 
        SET current_round = 1 
        WHERE stage = 'not_yet_started'
    """)