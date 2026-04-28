"""Admin routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.session import get_db
from app.models.emission_source import EmissionSource
from app.models.entity import Entity
from app.models.user import User
from app.schemas.auth import UserResponse
from app.schemas.data import EmissionSourceResponse, EntityResponse

router = APIRouter()


class UserRoleUpdate(BaseModel):
    role: str


class EntityCreate(BaseModel):
    name: str
    type: str
    surface_area_m2: float | None = None
    description: str | None = None


class EntityUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    surface_area_m2: float | None = None
    description: str | None = None
    is_active: bool | None = None


class EmissionSourceUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    unit: str | None = None
    factor_kgco2e: float | None = None
    description: str | None = None
    is_active: bool | None = None


@router.get("/users", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(User).order_by(User.id.asc()).all()


@router.put("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(user_id: int, payload: UserRoleUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    if payload.role not in {"admin", "user", "teacher", "student"}:
        raise HTTPException(status_code=400, detail="Rôle invalide")
    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user


@router.post("/entities", response_model=EntityResponse, status_code=status.HTTP_201_CREATED)
def create_entity(payload: EntityCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if payload.type not in {"BUILDING", "LAB", "ADMIN", "CAMPUS"}:
        raise HTTPException(status_code=400, detail="Type d'entité invalide")
    entity = Entity(**payload.model_dump())
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity


@router.get("/entities", response_model=list[EntityResponse])
def list_entities(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(Entity).order_by(Entity.id.asc()).all()


@router.put("/entities/{entity_id}", response_model=EntityResponse)
def update_entity(entity_id: int, payload: EntityUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if entity is None:
        raise HTTPException(status_code=404, detail="Entité non trouvée")
    for key, value in payload.model_dump(exclude_none=True).items():
        setattr(entity, key, value)
    db.commit()
    db.refresh(entity)
    return entity


@router.delete("/entities/{entity_id}")
def delete_entity(entity_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if entity is None:
        raise HTTPException(status_code=404, detail="Entité non trouvée")
    entity.is_active = False
    db.commit()
    return {"id": entity_id, "is_active": False}


@router.get("/emission-sources", response_model=list[EmissionSourceResponse])
def list_emission_sources(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(EmissionSource).order_by(EmissionSource.scope.asc(), EmissionSource.id.asc()).all()


@router.put("/emission-sources/{source_id}", response_model=EmissionSourceResponse)
def update_emission_source(source_id: int, payload: EmissionSourceUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    source = db.query(EmissionSource).filter(EmissionSource.id == source_id).first()
    if source is None:
        raise HTTPException(status_code=404, detail="Source d'émission non trouvée")
    for key, value in payload.model_dump(exclude_none=True).items():
        setattr(source, key, value)
    db.commit()
    db.refresh(source)
    return source
