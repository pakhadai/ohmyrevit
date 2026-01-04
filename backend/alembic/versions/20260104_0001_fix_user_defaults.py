"""fix user defaults for is_admin, balance, bonus_streak, is_creator

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2026-01-04 19:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6g7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    # Оновлюємо NULL значення на дефолтні
    op.execute("""
        UPDATE users
        SET is_admin = FALSE
        WHERE is_admin IS NULL
    """)

    op.execute("""
        UPDATE users
        SET balance = 0
        WHERE balance IS NULL
    """)

    op.execute("""
        UPDATE users
        SET bonus_streak = 0
        WHERE bonus_streak IS NULL
    """)

    op.execute("""
        UPDATE users
        SET is_creator = FALSE
        WHERE is_creator IS NULL
    """)

    op.execute("""
        UPDATE users
        SET creator_balance = 0
        WHERE creator_balance IS NULL
    """)

    # Додаємо NOT NULL constraint після оновлення даних
    op.alter_column('users', 'is_admin',
                    existing_type=sa.Boolean(),
                    nullable=False,
                    server_default='false')

    op.alter_column('users', 'balance',
                    existing_type=sa.Integer(),
                    nullable=False,
                    server_default='0')

    op.alter_column('users', 'bonus_streak',
                    existing_type=sa.Integer(),
                    nullable=False,
                    server_default='0')

    op.alter_column('users', 'is_creator',
                    existing_type=sa.Boolean(),
                    nullable=False,
                    server_default='false')

    op.alter_column('users', 'creator_balance',
                    existing_type=sa.Integer(),
                    nullable=False,
                    server_default='0')


def downgrade():
    # Видаляємо NOT NULL constraint
    op.alter_column('users', 'is_admin',
                    existing_type=sa.Boolean(),
                    nullable=True)

    op.alter_column('users', 'balance',
                    existing_type=sa.Integer(),
                    nullable=True)

    op.alter_column('users', 'bonus_streak',
                    existing_type=sa.Integer(),
                    nullable=True)

    op.alter_column('users', 'is_creator',
                    existing_type=sa.Boolean(),
                    nullable=True)

    op.alter_column('users', 'creator_balance',
                    existing_type=sa.Integer(),
                    nullable=True)
