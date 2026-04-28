"""Carbon footprint result ORM model."""

from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class CarbonFootprintResult(Base):
    __tablename__ = "carbon_footprint_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    calculation_date: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("entities.id"), nullable=False)
    scope: Mapped[int] = mapped_column(Integer, nullable=False)
    source_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("emission_sources.id"), nullable=True)
    total_tco2e: Mapped[float] = mapped_column(Float, nullable=False)
    total_students: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tco2e_per_student: Mapped[float | None] = mapped_column(Float, nullable=True)
    tco2e_per_m2: Mapped[float | None] = mapped_column(Float, nullable=True)

    entity: Mapped["Entity"] = relationship("Entity", back_populates="carbon_results")
    emission_source: Mapped["EmissionSource"] = relationship("EmissionSource", back_populates="carbon_results")
