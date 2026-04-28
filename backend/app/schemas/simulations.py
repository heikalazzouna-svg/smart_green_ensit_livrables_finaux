"""Simulation schemas."""

from pydantic import BaseModel

from app.schemas.calculations import CalculationResult


class ModificationItem(BaseModel):
    source_id: int
    entity_id: int
    percentage_change: float


class SimulationRequest(BaseModel):
    name: str
    description: str | None = None
    modifications: list[ModificationItem]


class SimulationResult(BaseModel):
    scenario_name: str
    scenario_description: str | None
    baseline_total_tco2e: float
    scenario_total_tco2e: float
    delta_tco2e: float
    delta_percentage: float
    baseline_scope1: float
    baseline_scope2: float
    baseline_scope3: float
    scenario_scope1: float
    scenario_scope2: float
    scenario_scope3: float
    results_by_entity: list[CalculationResult]


class PredictionRequest(BaseModel):
    months_ahead: int = 12


class PredictionResult(BaseModel):
    month: str
    predicted_kwh: float
    predicted_tco2e: float
    confidence_interval_lower: float
    confidence_interval_upper: float
    is_historical: bool = False
