"""Rename gumroad_permalink to stripe_price_id in coin_packs

Revision ID: a1b2c3d4e5f6
Revises: 86a01d1806fb
Create Date: 2026-01-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '86a01d1806fb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename column gumroad_permalink to stripe_price_id
    op.alter_column(
        'coin_packs',
        'gumroad_permalink',
        new_column_name='stripe_price_id'
    )


def downgrade() -> None:
    # Rename column stripe_price_id back to gumroad_permalink
    op.alter_column(
        'coin_packs',
        'stripe_price_id',
        new_column_name='gumroad_permalink'
    )
