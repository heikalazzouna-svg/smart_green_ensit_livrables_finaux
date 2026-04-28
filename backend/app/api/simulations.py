"""Simulation and prediction routes."""

from collections import defaultdict

import numpy as np
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.activity_data import ActivityData
from app.models.carbon_result import CarbonFootprintResult
from app.models.emission_source import EmissionSource
from app.models.entity import Entity
from app.models.simulation_scenario import SimulationScenario
from app.models.user import User
from app.schemas.calculations import CalculationResult
from app.schemas.simulations import PredictionResult, SimulationRequest, SimulationResult

router = APIRouter()


@router.post("/scenario", response_model=SimulationResult)
def scenario(payload: SimulationRequest, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    latest = db.query(CarbonFootprintResult.period_start, CarbonFootprintResult.period_end).filter(CarbonFootprintResult.source_id.is_(None)).order_by(CarbonFootprintResult.calculation_date.desc()).first()
    if latest is None:
        raise HTTPException(status_code=404, detail="Aucune base de calcul disponible")

    baseline_rows = db.query(CarbonFootprintResult).filter(CarbonFootprintResult.period_start == latest.period_start, CarbonFootprintResult.period_end == latest.period_end, CarbonFootprintResult.source_id.is_(None)).all()
    source_rows = db.query(CarbonFootprintResult).filter(CarbonFootprintResult.period_start == latest.period_start, CarbonFootprintResult.period_end == latest.period_end, CarbonFootprintResult.source_id.is_not(None)).all()

    baseline_by_entity_scope: dict[tuple[int, int], float] = defaultdict(float)
    for row in baseline_rows:
        baseline_by_entity_scope[(row.entity_id, row.scope)] += float(row.total_tco2e)

    source_map: dict[tuple[int, int], float] = defaultdict(float)
    for row in source_rows:
        source_map[(row.entity_id, row.source_id or 0)] += float(row.total_tco2e)

    source_scope = {row.id: row.scope for row in db.query(EmissionSource).all()}
    modified = dict(source_map)
    for mod in payload.modifications:
        key = (mod.entity_id, mod.source_id)
        if key in modified:
            modified[key] = max(0.0, modified[key] * (1.0 + mod.percentage_change / 100.0))

    entity_lookup = {entity.id: entity for entity in db.query(Entity).filter(Entity.is_active.is_(True)).all()}
    scenario_scopes: dict[int, dict[int, float]] = defaultdict(lambda: defaultdict(float))
    for (entity_id, source_id), value in modified.items():
        scope = source_scope.get(source_id, 1)
        scenario_scopes[entity_id][scope] += value

    total_students = db.query(User).filter(User.role.in_(["student", "user"])).count() or 1
    results: list[CalculationResult] = []
    scenario_scope1 = scenario_scope2 = scenario_scope3 = 0.0
    for entity in entity_lookup.values():
        s1 = float(scenario_scopes[entity.id].get(1, 0.0))
        s2 = float(scenario_scopes[entity.id].get(2, 0.0))
        s3 = float(scenario_scopes[entity.id].get(3, 0.0))
        total = s1 + s2 + s3
        scenario_scope1 += s1
        scenario_scope2 += s2
        scenario_scope3 += s3
        results.append(CalculationResult(
            entity_id=entity.id,
            entity_name=entity.name,
            entity_type=entity.type,
            scope1_tco2e=round(s1, 4),
            scope2_tco2e=round(s2, 4),
            scope3_tco2e=round(s3, 4),
            total_tco2e=round(total, 4),
            tco2e_per_student=round(total / total_students, 4) if total_students else None,
            tco2e_per_m2=round(total / entity.surface_area_m2, 4) if entity.surface_area_m2 else None,
            surface_area_m2=entity.surface_area_m2,
        ))

    baseline_scope1 = sum(value for (_, scope), value in baseline_by_entity_scope.items() if scope == 1)
    baseline_scope2 = sum(value for (_, scope), value in baseline_by_entity_scope.items() if scope == 2)
    baseline_scope3 = sum(value for (_, scope), value in baseline_by_entity_scope.items() if scope == 3)
    baseline_total = baseline_scope1 + baseline_scope2 + baseline_scope3
    scenario_total = scenario_scope1 + scenario_scope2 + scenario_scope3
    delta = scenario_total - baseline_total
    delta_percentage = (delta / baseline_total * 100.0) if baseline_total else 0.0

    db.add(SimulationScenario(name=payload.name, description=payload.description, baseline_total_tco2e=baseline_total, scenario_total_tco2e=scenario_total))
    db.commit()

    results.sort(key=lambda item: item.total_tco2e, reverse=True)
    return SimulationResult(
        scenario_name=payload.name,
        scenario_description=payload.description,
        baseline_total_tco2e=round(baseline_total, 4),
        scenario_total_tco2e=round(scenario_total, 4),
        delta_tco2e=round(delta, 4),
        delta_percentage=round(delta_percentage, 2),
        baseline_scope1=round(baseline_scope1, 4),
        baseline_scope2=round(baseline_scope2, 4),
        baseline_scope3=round(baseline_scope3, 4),
        scenario_scope1=round(scenario_scope1, 4),
        scenario_scope2=round(scenario_scope2, 4),
        scenario_scope3=round(scenario_scope3, 4),
        results_by_entity=results,
    )


@router.get("/predictions/energy", response_model=list[PredictionResult])
def predict_energy(months_ahead: int = Query(default=12, ge=1, le=36), db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    electricity = db.query(EmissionSource).filter(EmissionSource.name == "Purchased Electricity (Tunisia Grid)").first()
    if electricity is None:
        raise HTTPException(status_code=404, detail="Source d'électricité non trouvée")

    rows = db.query(ActivityData).filter(ActivityData.source_id == electricity.id).order_by(ActivityData.period_start.asc()).all()
    if not rows:
        raise HTTPException(status_code=400, detail="Plus de données historiques sont nécessaires pour la prédiction")

    monthly: dict[str, float] = defaultdict(float)
    for row in rows:
        monthly[row.period_start.strftime("%Y-%m")] += float(row.quantity)

    keys = sorted(monthly.keys())
    historical = [
        PredictionResult(
            month=month,
            predicted_kwh=round(monthly[month], 2),
            predicted_tco2e=round(monthly[month] * electricity.factor_kgco2e / 1000.0, 4),
            confidence_interval_lower=round(monthly[month] * electricity.factor_kgco2e / 1000.0 * 0.9, 4),
            confidence_interval_upper=round(monthly[month] * electricity.factor_kgco2e / 1000.0 * 1.1, 4),
            is_historical=True,
        )
        for month in keys
    ]

    if len(keys) < 12:
        raise HTTPException(status_code=400, detail="Plus de 12 mois de données sont nécessaires pour une prédiction robuste")

    try:
        from sklearn.ensemble import GradientBoostingRegressor

        feature_rows = []
        targets = []
        for month in keys:
            year, month_num = month.split("-")
            feature_rows.append([int(year), int(month_num), len(feature_rows)])
            targets.append(monthly[month])
        model = GradientBoostingRegressor(random_state=42)
        model.fit(np.array(feature_rows), np.array(targets))

        last_year, last_month = map(int, keys[-1].split("-"))
        predictions = []
        rolling = float(np.mean(targets[-3:]))
        for index in range(1, months_ahead + 1):
            month_index = last_month + index
            year = last_year + (month_index - 1) // 12
            month = ((month_index - 1) % 12) + 1
            predicted_kwh = max(0.0, float(model.predict(np.array([[year, month, len(feature_rows) + index]]) )[0]))
            rolling = 0.6 * rolling + 0.4 * predicted_kwh
            predicted_kwh = 0.5 * predicted_kwh + 0.5 * rolling
            predicted_tco2e = predicted_kwh * electricity.factor_kgco2e / 1000.0
            label = f"{year:04d}-{month:02d}"
            predictions.append(PredictionResult(month=label, predicted_kwh=round(predicted_kwh, 2), predicted_tco2e=round(predicted_tco2e, 4), confidence_interval_lower=round(predicted_tco2e * 0.9, 4), confidence_interval_upper=round(predicted_tco2e * 1.1, 4), is_historical=False))
        return historical + predictions
    except Exception:
        last_value = float(np.mean(targets[-3:]))
        last_year, last_month = map(int, keys[-1].split("-"))
        predictions = []
        for index in range(1, months_ahead + 1):
            last_value = 0.65 * last_value + 0.35 * float(targets[-1])
            month_index = last_month + index
            year = last_year + (month_index - 1) // 12
            month = ((month_index - 1) % 12) + 1
            predicted_tco2e = last_value * electricity.factor_kgco2e / 1000.0
            predictions.append(PredictionResult(month=f"{year:04d}-{month:02d}", predicted_kwh=round(last_value, 2), predicted_tco2e=round(predicted_tco2e, 4), confidence_interval_lower=round(predicted_tco2e * 0.9, 4), confidence_interval_upper=round(predicted_tco2e * 1.1, 4), is_historical=False))
        return historical + predictions
