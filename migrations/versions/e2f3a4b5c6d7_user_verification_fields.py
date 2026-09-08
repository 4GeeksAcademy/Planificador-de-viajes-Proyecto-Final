"""complete user verification fields used by the auth contract

Revision ID: e2f3a4b5c6d7
Revises: d1e2f3a4b5c6
Create Date: 2026-09-06 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "e2f3a4b5c6d7"
down_revision = "d1e2f3a4b5c6"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.false())
        )
        batch_op.add_column(sa.Column("verification_token", sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column("verified_at", sa.DateTime(), nullable=True))
        batch_op.add_column(
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now())
        )

    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.alter_column("is_verified", server_default=None)
        batch_op.alter_column("created_at", server_default=None)


def downgrade():
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.drop_column("created_at")
        batch_op.drop_column("verified_at")
        batch_op.drop_column("verification_token")
        batch_op.drop_column("is_verified")
