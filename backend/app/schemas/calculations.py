"""Calculation schemas."""

from datetime import date

from pydantic import BaseModel


class CalculationRequest(BaseModel):
    period_start: date
    period_end: date
    entity_ids: list[int] | None = None


class CalculationResult(BaseModel):
    entity_id: int
    entity_name: str
    entity_type: str
    scope1_tco2e: float
    scope2_tco2e: float
    scope3_tco2e: float
    total_tco2e: float
    tco2e_per_student: float | None = None
    tco2e_per_m2: float | None = None
    surface_area_m2: float | None = None

    model_config = {"from_attributes": True}


class CalculationSummary(BaseModel):
    period: str
    period_start: date
    period_end: date
    total_tco2e: float
    scope1_tco2e: float
    scope2_tco2e: float
    scope3_tco2e: float
    total_students: int
    results_by_entity: list[CalculationResult]
    calculation_date: str | None = None
