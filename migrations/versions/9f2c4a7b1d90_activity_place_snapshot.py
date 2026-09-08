"""store selected map place data on itinerary activities

Revision ID: 9f2c4a7b1d90
Revises: fd4c3bddc685
Create Date: 2026-09-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "9f2c4a7b1d90"
down_revision = "fd4c3bddc685"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("activity", schema=None) as batch_op:
        batch_op.add_column(sa.Column("place_ref", sa.String(length=160), nullable=True))
        batch_op.add_column(sa.Column("place_category", sa.String(length=80), nullable=True))
        batch_op.add_column(sa.Column("place_address", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("place_city", sa.String(length=120), nullable=True))
        batch_op.add_column(sa.Column("place_source", sa.String(length=80), nullable=True))
        batch_op.add_column(sa.Column("place_latitude", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("place_longitude", sa.Float(), nullable=True))


def downgrade():
    with op.batch_alter_table("activity", schema=None) as batch_op:
        batch_op.drop_column("place_longitude")
        batch_op.drop_column("place_latitude")
        batch_op.drop_column("place_source")
        batch_op.drop_column("place_city")
        batch_op.drop_column("place_address")
        batch_op.drop_column("place_category")
        batch_op.drop_column("place_ref")
