"""Dashboard schemas."""

from pydantic import BaseModel


class KPICard(BaseModel):
    title: str
    value: float
    unit: str
    change_percentage: float | None = None
    trend: str = "stable"


class DashboardSummary(BaseModel):
    kpi_cards: list[KPICard]
    emissions_timeline: list[dict]
    emissions_by_source: list[dict]
    top_entities: list[dict]


class DashboardFilter(BaseModel):
    period: str = "monthly"
    year: int
    entity_id: int | None = None
