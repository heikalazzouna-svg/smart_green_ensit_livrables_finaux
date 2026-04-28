"""Database seeding."""

from __future__ import annotations

import calendar
import logging
from datetime import date

from app.core.emission_factors import DEFAULT_EMISSION_FACTORS
from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.activity_data import ActivityData
from app.models.emission_source import EmissionSource
from app.models.entity import Entity
from app.models.user import User

logger = logging.getLogger(__name__)


def seed_database() -> None:
    db = SessionLocal()
    try:
        if db.query(EmissionSource).count() == 0:
            db.add_all(EmissionSource(**item) for item in DEFAULT_EMISSION_FACTORS)
            logger.info("✅ Seeded %d emission sources.", len(DEFAULT_EMISSION_FACTORS))

        if db.query(Entity).count() == 0:
            db.add_all(
                [
                    Entity(name="Bâtiment Principal (A)", type="BUILDING", surface_area_m2=5000.0, description="Salles de cours et amphithéâtres"),
                    Entity(name="Bâtiment Laboratoires (B)", type="LAB", surface_area_m2=3000.0, description="Laboratoires d'enseignement et de recherche"),
                    Entity(name="Bâtiment Administratif (C)", type="ADMIN", surface_area_m2=1500.0, description="Bureaux administratifs"),
                    Entity(name="Campus Complet", type="CAMPUS", surface_area_m2=9500.0, description="Périmètre total du campus ENSIT"),
                ]
            )
            logger.info("✅ Seeded 4 default entities.")

        db.commit()

        if db.query(User).count() == 0:
            campus = db.query(Entity).filter(Entity.type == "CAMPUS").first()
            db.add_all(
                [
                    User(email="admin@ensit.tn", full_name="Administrateur ENSIT", role="admin", hashed_password=get_password_hash("Admin@2026"), entity_id=campus.id if campus else None, is_active=True),
                    User(email="user@ensit.tn", full_name="Utilisateur Démo", role="user", hashed_password=get_password_hash("User@2026"), entity_id=campus.id if campus else None, is_active=True),
                ]
            )
            db.commit()
            logger.info("✅ Seeded admin and demo users.")

        if db.query(ActivityData).count() == 0:
            _seed_demo_activity(db)
    except Exception as e:
        db.rollback()
        logger.error("❌ Seeding error: %s", e)
    finally:
        db.close()


def _seed_demo_activity(db) -> None:
    electricity = db.query(EmissionSource).filter(EmissionSource.name == "Purchased Electricity (Tunisia Grid)").first()
    gas = db.query(EmissionSource).filter(EmissionSource.name == "Natural Gas Combustion").first()
    car = db.query(EmissionSource).filter(EmissionSource.name == "Student Commute - Car").first()
    bus = db.query(EmissionSource).filter(EmissionSource.name == "Student Commute - Bus").first()
    admin_user = db.query(User).filter(User.email == "admin@ensit.tn").first()
    campus = db.query(Entity).filter(Entity.type == "CAMPUS").first()
    building_a = db.query(Entity).filter(Entity.name.like("%Principal%")).first()
    building_b = db.query(Entity).filter(Entity.name.like("%Laboratoires%")).first()
    building_c = db.query(Entity).filter(Entity.name.like("%Administratif%")).first()
    if not all([electricity, gas, car, bus, admin_user, campus, building_a, building_b, building_c]):
        logger.warning("Skipping demo data: missing sources or entities")
        return

    activities: list[ActivityData] = []
    monthly = [
        (2023, 1, 18500, 12000, 4500), (2023, 2, 17200, 11500, 4200), (2023, 3, 15800, 10800, 3900),
        (2023, 4, 14200, 9800, 3600), (2023, 5, 16500, 11200, 4100), (2023, 6, 22000, 15500, 5800),
        (2023, 7, 25500, 18000, 6700), (2023, 8, 24800, 17500, 6500), (2023, 9, 20000, 14000, 5200),
        (2023, 10, 16800, 11500, 4300), (2023, 11, 17500, 12000, 4500), (2023, 12, 19000, 13500, 5000),
        (2024, 1, 17800, 11800, 4400), (2024, 2, 16500, 11000, 4100), (2024, 3, 15200, 10500, 3800),
        (2024, 4, 13800, 9500, 3500), (2024, 5, 15900, 10900, 4000), (2024, 6, 21500, 15000, 5600),
        (2024, 7, 24800, 17500, 6500), (2024, 8, 24000, 17000, 6300), (2024, 9, 19500, 13700, 5100),
        (2024, 10, 16200, 11200, 4200), (2024, 11, 16900, 11700, 4400), (2024, 12, 18200, 13000, 4800),
    ]
    for year, month, a_kwh, b_kwh, c_kwh in monthly:
        last_day = calendar.monthrange(year, month)[1]
        start = date(year, month, 1)
        end = date(year, month, last_day)
        for entity, quantity in ((building_a, a_kwh), (building_b, b_kwh), (building_c, c_kwh)):
            activities.append(ActivityData(source_id=electricity.id, entity_id=entity.id, period_start=start, period_end=end, quantity=float(quantity), unit="kWh", data_quality="MEASURED", notes="Facture STEG", uploaded_by=admin_user.id))
    for year in (2023, 2024):
        for month in (1, 2, 3, 11, 12):
            last_day = calendar.monthrange(year, month)[1]
            activities.append(ActivityData(source_id=gas.id, entity_id=building_a.id, period_start=date(year, month, 1), period_end=date(year, month, last_day), quantity=2500.0, unit="kWh", data_quality="MEASURED", notes="Facture gaz", uploaded_by=admin_user.id))
    for year in (2023, 2024):
        for month in range(1, 13):
            last_day = calendar.monthrange(year, month)[1]
            start = date(year, month, 1)
            end = date(year, month, last_day)
            activities.append(ActivityData(source_id=car.id, entity_id=campus.id, period_start=start, period_end=end, quantity=85000.0, unit="km", data_quality="SURVEY", notes="Enquête mobilité estimée", uploaded_by=admin_user.id))
            activities.append(ActivityData(source_id=bus.id, entity_id=campus.id, period_start=start, period_end=end, quantity=45000.0, unit="km", data_quality="SURVEY", notes="Enquête mobilité estimée", uploaded_by=admin_user.id))
    db.add_all(activities)
    db.commit()
    logger.info("✅ Seeded %d demo activity records.", len(activities))

    # Auto-run carbon footprint calculation so dashboard has data immediately
    _run_initial_calculations(db)


def _run_initial_calculations(db) -> None:
    """Run carbon footprint calculations for 2023 and 2024 so dashboard is populated on first load."""
    try:
        from app.api.calculations import _calculate_summary

        _calculate_summary(db, date(2024, 1, 1), date(2024, 12, 31))
        _calculate_summary(db, date(2023, 1, 1), date(2023, 12, 31))
        logger.info("✅ Initial carbon footprint calculations completed.")
    except Exception as e:
        logger.error("❌ Initial calculation error: %s", e)
