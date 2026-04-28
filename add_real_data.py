import sys
import os

# Ensure backend can be imported
sys.path.append(r"c:\Users\LENOVO\smart-green-ensit\backend")

from app.db.session import SessionLocal
from app.models import ActivityData, Entity, EmissionSource
from datetime import date
import requests

def run():
    db = SessionLocal()
    try:
        # Get Campus
        campus = db.query(Entity).filter(Entity.type == "CAMPUS").first()
        if not campus:
            print("Erreur: Entité CAMPUS introuvable.")
            return

        # Get Electricity Source
        elec_source = db.query(EmissionSource).filter(EmissionSource.name.ilike("%Purchased Electricity%")).first()
        
        # Get Commute Source
        car_source = db.query(EmissionSource).filter(EmissionSource.name.ilike("%Commute - Car%")).first()

        # Data from STEG bills
        bills = [
            (date(2025, 1, 1), date(2025, 1, 31), 17414, "Facture STEG 01/2025 (17414 kWh)"),
            (date(2025, 2, 1), date(2025, 2, 28), 19206, "Facture STEG 02/2025 (19206 kWh)"),
            (date(2025, 3, 1), date(2025, 3, 31), 15362, "Facture STEG 03/2025 (15362 kWh)"),
            (date(2025, 4, 1), date(2025, 4, 30), 15513, "Facture STEG 04/2025 (15513 kWh)"),
        ]

        # Calculate mobility for 1485 people (150 ens + 1270 etu + 65 admin)
        # Assuming avg 10km round-trip, 5 days/week, 4 weeks = 200km/month per person
        total_km_per_month = 1485 * 200

        print("Ajout des factures STEG et des estimations de mobilité...")
        for start, end, qty, note in bills:
            # Add Electricity
            act_elec = ActivityData(
                source_id=elec_source.id,
                entity_id=campus.id,
                period_start=start,
                period_end=end,
                quantity=qty,
                data_quality="MEASURED",
                notes=note
            )
            db.add(act_elec)

            # Add Mobility
            act_mob = ActivityData(
                source_id=car_source.id,
                entity_id=campus.id,
                period_start=start,
                period_end=end,
                quantity=total_km_per_month,
                data_quality="ESTIMATED",
                notes=f"Mobilité estimée pour {start.strftime('%m/%Y')} (1485 personnes)"
            )
            db.add(act_mob)

        db.commit()
        print("✅ Données ajoutées avec succès.")

    except Exception as e:
        print(f"Erreur: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run()
