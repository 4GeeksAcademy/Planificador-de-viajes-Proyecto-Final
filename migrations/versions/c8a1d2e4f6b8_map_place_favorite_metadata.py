"""store map place metadata for user favorites

Revision ID: c8a1d2e4f6b8
Revises: 9f2c4a7b1d90
Create Date: 2026-09-04 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "c8a1d2e4f6b8"
down_revision = "9f2c4a7b1d90"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("place", schema=None) as batch_op:
        batch_op.add_column(sa.Column("place_ref", sa.String(length=160), nullable=True))
        batch_op.add_column(sa.Column("place_category", sa.String(length=80), nullable=True))
        batch_op.add_column(sa.Column("place_address", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("place_source", sa.String(length=80), nullable=True))


def downgrade():
    with op.batch_alter_table("place", schema=None) as batch_op:
        batch_op.drop_column("place_source")
        batch_op.drop_column("place_address")
        batch_op.drop_column("place_category")
        batch_op.drop_column("place_ref")
