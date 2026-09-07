from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, ForeignKey, Date, Time, Text, DateTime, Float, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date as dt_date, time as dt_time, datetime
from typing import List

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "user"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(
        String(32), nullable=False, unique=True)
    first_name: Mapped[str] = mapped_column(String(120))
    last_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(
        String(120), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True)
    is_admin: Mapped[bool] = mapped_column(default=False)
    is_verified: Mapped[bool] = mapped_column(default=False)
    verification_token: Mapped[str] = mapped_column(String(500), nullable=True)
    verified_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    trips: Mapped[List["Trip"]] = relationship(
        back_populates="user", cascade="all, delete-orphan")
    favorites: Mapped[List["Favorite"]] = relationship(
        back_populates="user", cascade="all, delete-orphan")

    def serialize(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "is_active": self.is_active,
            "is_admin": self.is_admin,
            "is_verififed": self.is_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "verified_at": self.verified_at.isoformat() if self.verified_at else None
            }


class Trip(db.Model):
    __tablename__ = "trip"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    start_date: Mapped[dt_date] = mapped_column(Date)
    end_date: Mapped[dt_date] = mapped_column(Date)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE")
    )
    user: Mapped["User"] = relationship(back_populates="trips")
    destinations: Mapped[List["Destination"]] = relationship(
        back_populates="trip", cascade="all, delete-orphan"
    )

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None
        }


class Destination(db.Model):
    __tablename__ = "destination"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    country: Mapped[str] = mapped_column(String(120), nullable=False)
    trip_id: Mapped[int] = mapped_column(
        ForeignKey("trip.id", ondelete="CASCADE")
    )
    trip: Mapped["Trip"] = relationship(back_populates="destinations")
    activities: Mapped[List["Activity"]] = relationship(
        back_populates="destination", cascade="all, delete-orphan"
    )

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "country": self.country
        }


class Activity(db.Model):
    __tablename__ = "activity"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    time: Mapped[dt_time] = mapped_column(Time)
    date: Mapped[dt_date] = mapped_column(Date)
    notes: Mapped[str] = mapped_column(Text)
    # Snapshot of the provider place selected from the map.
    place_ref: Mapped[str] = mapped_column(String(160), nullable=True)
    place_category: Mapped[str] = mapped_column(String(80), nullable=True)
    place_address: Mapped[str] = mapped_column(String(255), nullable=True)
    place_city: Mapped[str] = mapped_column(String(120), nullable=True)
    place_source: Mapped[str] = mapped_column(String(80), nullable=True)
    place_latitude: Mapped[float] = mapped_column(Float, nullable=True)
    place_longitude: Mapped[float] = mapped_column(Float, nullable=True)
    destination_id: Mapped[int] = mapped_column(
        ForeignKey("destination.id", ondelete="CASCADE")
    )
    destination: Mapped["Destination"] = relationship(
        back_populates="activities")

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "time": self.time.isoformat() if self.time else None,
            "date": self.date.isoformat() if self.date else None,
            "notes": self.notes,
            "place_id": self.place_ref,
            "place_category": self.place_category,
            "place_address": self.place_address,
            "place_city": self.place_city,
            "place_source": self.place_source,
            "place_latitude": self.place_latitude,
            "place_longitude": self.place_longitude
        }


class Place(db.Model):
    __tablename__ = "place"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    country: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    region: Mapped[str] = mapped_column(String(120))
    image: Mapped[str] = mapped_column(String(255))
    latitude: Mapped[float] = mapped_column(nullable=True)
    longitude: Mapped[float] = mapped_column(nullable=True)
    best_for: Mapped[str] = mapped_column(String(255))
    
    favorites: Mapped[List["Favorite"]] = relationship(
        back_populates="place", cascade="all, delete-orphan"
    )

    def serialize(self):
        return {
            "id": self.id,
            "slug": self.slug,
            "city": self.city,
            "country": self.country,
            "region": self.region,
            "image": self.image,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "description": self.description,
            "bestFor": self.best_for  # Nota: bestFor en frontend, best_for en backend
        }

class Favorite(db.Model):
    __tablename__ = "favorite"
    __table_args__ = (
        UniqueConstraint("user_id", "place_id", name="uq_favorite_user_place"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE")
    )
    place_id: Mapped[int] = mapped_column(
        ForeignKey("place.id", ondelete="CASCADE")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now())
    user: Mapped["User"] = relationship(back_populates="favorites")
    place: Mapped["Place"] = relationship(back_populates="favorites")

    def serialize(self):
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "place": self.place.serialize() if self.place else None
        }
