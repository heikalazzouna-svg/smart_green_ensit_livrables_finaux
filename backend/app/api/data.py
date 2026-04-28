"""Data entry routes."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.activity_data import ActivityData
from app.models.emission_source import EmissionSource
from app.models.entity import Entity
from app.models.mobility_survey import MobilitySurvey
from app.models.user import User
from app.schemas.data import ActivityDataCreate, ActivityDataResponse, EmissionSourceResponse, EntityResponse, MobilitySurveyCreate, MobilitySurveyResponse

router = APIRouter()

TRANSPORT_SOURCE_MAP = {
    "car": "Student Commute - Car",
    "bus": "Student Commute - Bus",
    "train_metro": "Student Commute - Train/Metro",
    "carpool": "Student Commute - Car",
    "bicycle": "Student Commute - Walking/Bicycle",
    "walking": "Student Commute - Walking/Bicycle",
}


@router.post("/activity", response_model=ActivityDataResponse, status_code=status.HTTP_201_CREATED)
def create_activity(payload: ActivityDataCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    source = db.query(EmissionSource).filter(EmissionSource.id == payload.source_id, EmissionSource.is_active.is_(True)).first()
    entity = db.query(Entity).filter(Entity.id == payload.entity_id, Entity.is_active.is_(True)).first()
    if source is None:
        raise HTTPException(status_code=404, detail="Source d'émission non trouvée")
    if entity is None:
        raise HTTPException(status_code=404, detail="Entité non trouvée")
    activity = ActivityData(**payload.model_dump(), uploaded_by=current_user.id)
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


@router.get("/activity", response_model=list[ActivityDataResponse])
def list_activity(
    entity_id: int | None = Query(default=None),
    scope: int | None = Query(default=None),
    period_start: str | None = Query(default=None),
    period_end: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(ActivityData).join(EmissionSource).join(Entity)
    if entity_id is not None:
        query = query.filter(ActivityData.entity_id == entity_id)
    if scope is not None:
        query = query.filter(EmissionSource.scope == scope)
    if period_start is not None:
        query = query.filter(ActivityData.period_start >= period_start)
    if period_end is not None:
        query = query.filter(ActivityData.period_end <= period_end)
    return query.order_by(ActivityData.created_at.desc()).offset(offset).limit(limit).all()


@router.post("/mobility-survey", response_model=MobilitySurveyResponse, status_code=status.HTTP_201_CREATED)
def create_mobility_survey(payload: MobilitySurveyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    survey = MobilitySurvey(**payload.model_dump())
    db.add(survey)

    source_name = TRANSPORT_SOURCE_MAP.get(payload.transport_mode, "Student Commute - Car")
    source = db.query(EmissionSource).filter(EmissionSource.name == source_name, EmissionSource.is_active.is_(True)).first()
    campus = db.query(Entity).filter(Entity.type == "CAMPUS", Entity.is_active.is_(True)).first() or db.query(Entity).filter(Entity.is_active.is_(True)).first()
    if source and campus:
        weekly_round_trip = payload.distance_km * 2 * payload.trips_per_week
        activity = ActivityData(
            source_id=source.id,
            entity_id=campus.id,
            period_start=payload.period_start,
            period_end=payload.period_end,
            quantity=weekly_round_trip,
            unit="km",
            data_quality="SURVEY",
            notes=f"Enquête mobilité - {payload.transport_mode}",
            uploaded_by=current_user.id,
        )
        db.add(activity)

    db.commit()
    db.refresh(survey)
    return survey


@router.get("/mobility-survey", response_model=list[MobilitySurveyResponse])
def list_mobility_surveys(user_id: int | None = Query(default=None), limit: int = Query(default=50, ge=1, le=500), db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    query = db.query(MobilitySurvey)
    if user_id is not None:
        query = query.filter(MobilitySurvey.user_id == user_id)
    return query.order_by(MobilitySurvey.created_at.desc()).limit(limit).all()


@router.get("/entities", response_model=list[EntityResponse])
def list_entities(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Entity).filter(Entity.is_active.is_(True)).order_by(Entity.id.asc()).all()


@router.get("/emission-sources", response_model=list[EmissionSourceResponse])
def list_emission_sources(scope: int | None = Query(default=None), db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    query = db.query(EmissionSource).filter(EmissionSource.is_active.is_(True))
    if scope is not None:
        query = query.filter(EmissionSource.scope == scope)
    return query.order_by(EmissionSource.scope.asc(), EmissionSource.id.asc()).all()


@router.delete("/activity/{activity_id}")
def delete_activity(activity_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = db.query(ActivityData).filter(ActivityData.id == activity_id).first()
    if record is None:
        raise HTTPException(status_code=404, detail="Donnée non trouvée")
    if current_user.role != "admin" and record.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="Non autorisé")
    db.delete(record)
    db.commit()
    return {"id": activity_id, "deleted": True}
