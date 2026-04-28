"""Carbon footprint calculations."""

from collections import defaultdict
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.activity_data import ActivityData
from app.models.carbon_result import CarbonFootprintResult
from app.models.emission_source import EmissionSource
from app.models.entity import Entity
from app.models.user import User
from app.schemas.calculations import CalculationRequest, CalculationResult, CalculationSummary

router = APIRouter()


def _calculate_summary(db: Session, period_start: date, period_end: date, entity_ids: list[int] | None = None) -> CalculationSummary:
    filters = [CarbonFootprintResult.period_start == period_start, CarbonFootprintResult.period_end == period_end]
    if entity_ids:
        filters.append(CarbonFootprintResult.entity_id.in_(entity_ids))
    db.query(CarbonFootprintResult).filter(*filters).delete(synchronize_session=False)

    activities = db.query(ActivityData).join(EmissionSource).join(Entity).filter(
        ActivityData.period_start >= period_start,
        ActivityData.period_end <= period_end,
        Entity.is_active.is_(True),
    )
    if entity_ids:
        activities = activities.filter(ActivityData.entity_id.in_(entity_ids))
    activities = activities.all()

    total_students = db.query(User).filter(User.role.in_(["student", "user"])).count() or 1

    scopes_by_entity: dict[int, dict[int, float]] = defaultdict(lambda: defaultdict(float))
    sources_by_entity: dict[int, dict[int, float]] = defaultdict(lambda: defaultdict(float))

    for activity in activities:
        source = activity.emission_source
        emission_tco2e = (activity.quantity * source.factor_kgco2e) / 1000.0
        scopes_by_entity[activity.entity_id][source.scope] += emission_tco2e
        sources_by_entity[activity.entity_id][source.id] += emission_tco2e

    entities = db.query(Entity).filter(Entity.is_active.is_(True))
    if entity_ids:
        entities = entities.filter(Entity.id.in_(entity_ids))
    entities = entities.all()

    total_scope1 = total_scope2 = total_scope3 = 0.0
    results_by_entity: list[CalculationResult] = []

    for entity in entities:
        entity_scopes = scopes_by_entity.get(entity.id, defaultdict(float))
        s1 = float(entity_scopes.get(1, 0.0))
        s2 = float(entity_scopes.get(2, 0.0))
        s3 = float(entity_scopes.get(3, 0.0))
        total = s1 + s2 + s3
        per_student = total / total_students if total_students else None
        per_m2 = total / entity.surface_area_m2 if entity.surface_area_m2 else None

        results_by_entity.append(
            CalculationResult(
                entity_id=entity.id,
                entity_name=entity.name,
                entity_type=entity.type,
                scope1_tco2e=round(s1, 4),
                scope2_tco2e=round(s2, 4),
                scope3_tco2e=round(s3, 4),
                total_tco2e=round(total, 4),
                tco2e_per_student=round(per_student, 4) if per_student is not None else None,
                tco2e_per_m2=round(per_m2, 4) if per_m2 is not None else None,
                surface_area_m2=entity.surface_area_m2,
            )
        )

        total_scope1 += s1
        total_scope2 += s2
        total_scope3 += s3

        for scope, total_scope in ((1, s1), (2, s2), (3, s3)):
            db.add(
                CarbonFootprintResult(
                    period_start=period_start,
                    period_end=period_end,
                    entity_id=entity.id,
                    scope=scope,
                    source_id=None,
                    total_tco2e=total_scope,
                    total_students=total_students,
                    tco2e_per_student=total_scope / total_students if total_students else None,
                    tco2e_per_m2=(total_scope / entity.surface_area_m2 if entity.surface_area_m2 else None),
                )
            )

        for source_id, source_total in sources_by_entity.get(entity.id, {}).items():
            source_scope = db.query(EmissionSource.scope).filter(EmissionSource.id == source_id).scalar() or 1
            db.add(
                CarbonFootprintResult(
                    period_start=period_start,
                    period_end=period_end,
                    entity_id=entity.id,
                    scope=source_scope,
                    source_id=source_id,
                    total_tco2e=source_total,
                    total_students=total_students,
                    tco2e_per_student=source_total / total_students if total_students else None,
                    tco2e_per_m2=(source_total / entity.surface_area_m2 if entity.surface_area_m2 else None),
                )
            )

    db.commit()

    return CalculationSummary(
        period=f"{period_start} → {period_end}",
        period_start=period_start,
        period_end=period_end,
        total_tco2e=round(total_scope1 + total_scope2 + total_scope3, 4),
        scope1_tco2e=round(total_scope1, 4),
        scope2_tco2e=round(total_scope2, 4),
        scope3_tco2e=round(total_scope3, 4),
        total_students=total_students,
        results_by_entity=sorted(results_by_entity, key=lambda item: item.total_tco2e, reverse=True),
        calculation_date=datetime.now().isoformat(),
    )


@router.post("/run", response_model=CalculationSummary)
def run_calculation(payload: CalculationRequest, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return _calculate_summary(db, payload.period_start, payload.period_end, payload.entity_ids)


@router.get("/latest", response_model=CalculationSummary)
def latest_calculation(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    latest = db.query(CarbonFootprintResult.period_start, CarbonFootprintResult.period_end).filter(CarbonFootprintResult.source_id.is_(None)).order_by(CarbonFootprintResult.calculation_date.desc()).first()
    if latest is None:
        raise HTTPException(status_code=404, detail="Aucun calcul disponible")
    return _build_summary_from_results(db, latest.period_start, latest.period_end)


@router.get("/history")
def history(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = (
        db.query(
            CarbonFootprintResult.period_start,
            CarbonFootprintResult.period_end,
            func.max(CarbonFootprintResult.calculation_date).label("calculation_date"),
            func.sum(CarbonFootprintResult.total_tco2e).label("total_tco2e"),
        )
        .filter(CarbonFootprintResult.source_id.is_(None))
        .group_by(CarbonFootprintResult.period_start, CarbonFootprintResult.period_end)
        .order_by(func.max(CarbonFootprintResult.calculation_date).desc())
        .all()
    )
    return [
        {"period_start": row.period_start.isoformat(), "period_end": row.period_end.isoformat(), "calculation_date": row.calculation_date.isoformat() if row.calculation_date else None, "total_tco2e": round(float(row.total_tco2e or 0.0), 4)}
        for row in rows
    ]


def _build_summary_from_results(db: Session, period_start: date, period_end: date) -> CalculationSummary:
    entity_rows = (
        db.query(CarbonFootprintResult.entity_id, CarbonFootprintResult.scope, func.sum(CarbonFootprintResult.total_tco2e).label("total"))
        .filter(CarbonFootprintResult.period_start == period_start, CarbonFootprintResult.period_end == period_end, CarbonFootprintResult.source_id.is_(None))
        .group_by(CarbonFootprintResult.entity_id, CarbonFootprintResult.scope)
        .all()
    )
    entities = {entity.id: entity for entity in db.query(Entity).all()}
    grouped: dict[int, dict[int, float]] = defaultdict(lambda: defaultdict(float))
    for row in entity_rows:
        grouped[row.entity_id][row.scope] = float(row.total or 0.0)
    total_students = db.query(User).filter(User.role.in_(["student", "user"])).count() or 1
    results: list[CalculationResult] = []
    scope1 = scope2 = scope3 = 0.0
    for entity_id, scopes in grouped.items():
        entity = entities.get(entity_id)
        if entity is None:
            continue
        s1 = float(scopes.get(1, 0.0))
        s2 = float(scopes.get(2, 0.0))
        s3 = float(scopes.get(3, 0.0))
        total = s1 + s2 + s3
        scope1 += s1
        scope2 += s2
        scope3 += s3
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
    results.sort(key=lambda item: item.total_tco2e, reverse=True)
    return CalculationSummary(
        period=f"{period_start} → {period_end}",
        period_start=period_start,
        period_end=period_end,
        total_tco2e=round(scope1 + scope2 + scope3, 4),
        scope1_tco2e=round(scope1, 4),
        scope2_tco2e=round(scope2, 4),
        scope3_tco2e=round(scope3, 4),
        total_students=total_students,
        results_by_entity=results,
        calculation_date=datetime.now().isoformat(),
    )
