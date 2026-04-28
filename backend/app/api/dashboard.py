"""Dashboard routes."""

from collections import defaultdict
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.carbon_result import CarbonFootprintResult
from app.models.emission_source import EmissionSource
from app.models.entity import Entity
from app.models.user import User
from app.schemas.dashboard import DashboardSummary, KPICard

router = APIRouter()

SOURCE_COLORS = {
    "Combustion sur site": "#ef4444",
    "Carburants - Déplacements pro": "#f97316",
    "Émissions fugitives": "#eab308",
    "Électricité importée": "#f59e0b",
    "Transport domicile-campus": "#3b82f6",
}


@router.get("/summary", response_model=DashboardSummary)
def summary(year: int | None = Query(default=None), entity_id: int | None = Query(default=None), db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    latest = db.query(CarbonFootprintResult.period_start, CarbonFootprintResult.period_end, CarbonFootprintResult.calculation_date).filter(CarbonFootprintResult.source_id.is_(None)).order_by(CarbonFootprintResult.calculation_date.desc()).first()
    if latest is None:
        return DashboardSummary(kpi_cards=[KPICard(title="Total Émissions", value=0, unit="tCO2e"), KPICard(title="Émissions par Étudiant", value=0, unit="tCO2e"), KPICard(title="Émissions par Laboratoire", value=0, unit="tCO2e"), KPICard(title="Émissions par Surface", value=0, unit="tCO2e/m²")], emissions_timeline=[], emissions_by_source=[], top_entities=[])

    current = _get_period_totals(db, latest.period_start, latest.period_end, entity_id)
    previous = _get_previous_period_totals(db, latest.period_start, latest.period_end, entity_id)
    total = current["scope1"] + current["scope2"] + current["scope3"]
    previous_total = previous["scope1"] + previous["scope2"] + previous["scope3"]
    change = ((total - previous_total) / previous_total * 100.0) if previous_total else None
    trend = "stable" if change is None or abs(change) < 0.01 else ("up" if change > 0 else "down")

    students = 1270  # Real demographic data: 1270 étudiants (plus 150 enseignants, 65 administratifs)
    labs = db.query(Entity).filter(Entity.type == "LAB", Entity.is_active.is_(True)).all()
    campus = db.query(Entity).filter(Entity.type == "CAMPUS", Entity.is_active.is_(True)).first()
    lab_avg = _sum_entity_type(db, latest.period_start, latest.period_end, "LAB", entity_id)
    per_student = total / students if students else 0.0
    per_m2 = total / campus.surface_area_m2 if campus and campus.surface_area_m2 else 0.0
    avg_per_lab = (lab_avg / len(labs)) if labs else 0.0

    timeline = _build_timeline(db, entity_id)
    by_source = _build_source_breakdown(db, latest.period_start, latest.period_end, entity_id)
    top_entities = _build_top_entities(db, latest.period_start, latest.period_end, total, entity_id)

    return DashboardSummary(
        kpi_cards=[
            KPICard(title="Total Émissions", value=round(total, 2), unit="tCO2e", change_percentage=round(change, 1) if change is not None else None, trend=trend),
            KPICard(title="Émissions par Étudiant", value=round(per_student, 4), unit="tCO2e/étudiant", trend="stable"),
            KPICard(title="Émissions par Laboratoire", value=round(avg_per_lab, 4), unit="tCO2e/lab", trend="stable"),
            KPICard(title="Émissions par Surface", value=round(per_m2, 4), unit="tCO2e/m²", trend="stable"),
        ],
        emissions_timeline=timeline,
        emissions_by_source=by_source,
        top_entities=top_entities,
    )


def _get_period_totals(db: Session, period_start: date, period_end: date, entity_id: int | None) -> dict[str, float]:
    query = db.query(CarbonFootprintResult.scope, func.sum(CarbonFootprintResult.total_tco2e)).filter(CarbonFootprintResult.period_start == period_start, CarbonFootprintResult.period_end == period_end, CarbonFootprintResult.source_id.is_(None))
    if entity_id is not None:
        query = query.filter(CarbonFootprintResult.entity_id == entity_id)
    query = query.group_by(CarbonFootprintResult.scope).all()
    totals = {1: 0.0, 2: 0.0, 3: 0.0}
    for scope, value in query:
        totals[int(scope)] = float(value or 0.0)
    return {"scope1": totals[1], "scope2": totals[2], "scope3": totals[3]}


def _get_previous_period_totals(db: Session, period_start: date, period_end: date, entity_id: int | None) -> dict[str, float]:
    span = (period_end - period_start).days or 30
    previous_end = period_start - timedelta(days=1)
    previous_start = previous_end - timedelta(days=span)
    return _get_period_totals(db, previous_start, previous_end, entity_id)


def _sum_entity_type(db: Session, period_start: date, period_end: date, entity_type: str, entity_id: int | None) -> float:
    query = db.query(func.sum(CarbonFootprintResult.total_tco2e)).join(Entity, CarbonFootprintResult.entity_id == Entity.id).filter(CarbonFootprintResult.period_start == period_start, CarbonFootprintResult.period_end == period_end, CarbonFootprintResult.source_id.is_(None), Entity.type == entity_type)
    if entity_id is not None:
        query = query.filter(CarbonFootprintResult.entity_id == entity_id)
    return float(query.scalar() or 0.0)


def _build_timeline(db: Session, entity_id: int | None) -> list[dict]:
    query = db.query(CarbonFootprintResult.period_start, CarbonFootprintResult.scope, func.sum(CarbonFootprintResult.total_tco2e)).filter(CarbonFootprintResult.source_id.is_(None))
    if entity_id is not None:
        query = query.filter(CarbonFootprintResult.entity_id == entity_id)
    rows = query.group_by(CarbonFootprintResult.period_start, CarbonFootprintResult.scope).order_by(CarbonFootprintResult.period_start.asc()).all()
    grouped: dict[str, dict[str, float]] = defaultdict(lambda: {"month": "", "scope1": 0.0, "scope2": 0.0, "scope3": 0.0})
    for period_start, scope, total in rows:
        key = period_start.strftime("%Y-%m")
        grouped[key]["month"] = key
        grouped[key][f"scope{scope}"] = round(float(total or 0.0), 3)
    return [grouped[key] for key in sorted(grouped.keys())]


def _build_source_breakdown(db: Session, period_start: date, period_end: date, entity_id: int | None) -> list[dict]:
    query = db.query(EmissionSource.category, func.sum(CarbonFootprintResult.total_tco2e)).join(EmissionSource, CarbonFootprintResult.source_id == EmissionSource.id).filter(CarbonFootprintResult.period_start == period_start, CarbonFootprintResult.period_end == period_end, CarbonFootprintResult.source_id.is_not(None))
    if entity_id is not None:
        query = query.filter(CarbonFootprintResult.entity_id == entity_id)
    rows = query.group_by(EmissionSource.category).order_by(func.sum(CarbonFootprintResult.total_tco2e).desc()).all()
    return [{"name": category, "value": round(float(total or 0.0), 3), "color": SOURCE_COLORS.get(category, "#64748b")} for category, total in rows]


def _build_top_entities(db: Session, period_start: date, period_end: date, total: float, entity_id: int | None) -> list[dict]:
    query = db.query(CarbonFootprintResult.entity_id, func.sum(CarbonFootprintResult.total_tco2e)).filter(CarbonFootprintResult.period_start == period_start, CarbonFootprintResult.period_end == period_end, CarbonFootprintResult.source_id.is_(None))
    if entity_id is not None:
        query = query.filter(CarbonFootprintResult.entity_id == entity_id)
    rows = query.group_by(CarbonFootprintResult.entity_id).order_by(func.sum(CarbonFootprintResult.total_tco2e).desc()).limit(5).all()
    entities = {entity.id: entity for entity in db.query(Entity).all()}
    result = []
    for rank, (entity_key, entity_total) in enumerate(rows, start=1):
        entity = entities.get(entity_key)
        if entity is None:
            continue
        per_m2 = float(entity_total or 0.0) / entity.surface_area_m2 if entity.surface_area_m2 else None
        result.append({"rank": rank, "entity_id": entity.id, "entity_name": entity.name, "entity_type": entity.type, "total_tco2e": round(float(entity_total or 0.0), 3), "tco2e_per_m2": round(per_m2, 4) if per_m2 is not None else None, "percentage": round((float(entity_total or 0.0) / total * 100.0), 1) if total else 0.0})
    return result
