"""Data schemas."""

from datetime import date, datetime

from pydantic import BaseModel, field_validator


class ActivityDataCreate(BaseModel):
    source_id: int
    entity_id: int
    period_start: date
    period_end: date
    quantity: float
    unit: str
    data_quality: str
    notes: str | None = None

    @field_validator("data_quality")
    @classmethod
    def check_quality(cls, value: str) -> str:
        valid = {"MEASURED", "EXTRAPOLATED", "SURVEY", "ESTIMATED"}
        if value not in valid:
            raise ValueError("Qualité de donnée invalide")
        return value


class ActivityDataResponse(BaseModel):
    id: int
    source_id: int
    entity_id: int
    period_start: date
    period_end: date
    quantity: float
    unit: str
    data_quality: str
    notes: str | None
    uploaded_by: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class MobilitySurveyCreate(BaseModel):
    user_id: int
    transport_mode: str
    distance_km: float
    trips_per_week: int
    period_start: date
    period_end: date


class MobilitySurveyResponse(BaseModel):
    id: int
    user_id: int | None
    transport_mode: str
    distance_km: float
    trips_per_week: int
    period_start: date
    period_end: date
    created_at: datetime

    model_config = {"from_attributes": True}


class EntityResponse(BaseModel):
    id: int
    name: str
    type: str
    surface_area_m2: float | None
    description: str | None
    is_active: bool

    model_config = {"from_attributes": True}


class EmissionSourceResponse(BaseModel):
    id: int
    name: str
    scope: int
    category: str
    unit: str
    factor_kgco2e: float
    description: str | None
    is_active: bool

    model_config = {"from_attributes": True}
