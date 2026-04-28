"""Import models so SQLAlchemy registers them."""

from app.models.activity_data import ActivityData
from app.models.carbon_result import CarbonFootprintResult
from app.models.emission_source import EmissionSource
from app.models.entity import Entity
from app.models.mobility_survey import MobilitySurvey
from app.models.simulation_scenario import SimulationScenario
from app.models.user import User
