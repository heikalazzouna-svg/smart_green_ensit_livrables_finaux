"""Default emission factors for the platform."""

DEFAULT_EMISSION_FACTORS = [
    {"name": "Natural Gas Combustion", "scope": 1, "category": "Combustion sur site", "unit": "kWh", "factor_kgco2e": 0.227, "description": "Combustion de gaz naturel pour chauffage"},
    {"name": "Diesel (Fleet Vehicles)", "scope": 1, "category": "Carburants - Déplacements pro", "unit": "litre", "factor_kgco2e": 2.67, "description": "Diesel pour véhicules de l'établissement"},
    {"name": "Gasoline (Fleet Vehicles)", "scope": 1, "category": "Carburants - Déplacements pro", "unit": "litre", "factor_kgco2e": 2.28, "description": "Essence pour véhicules de l'établissement"},
    {"name": "R-410A Refrigerant Leakage", "scope": 1, "category": "Émissions fugitives", "unit": "kg", "factor_kgco2e": 2088.0, "description": "Fuite de fluide frigorigène R-410A (PRG 2088)"},
    {"name": "R-134A Refrigerant Leakage", "scope": 1, "category": "Émissions fugitives", "unit": "kg", "factor_kgco2e": 1430.0, "description": "Fuite de fluide frigorigène R-134A (PRG 1430)"},
    {"name": "Purchased Electricity (Tunisia Grid)", "scope": 2, "category": "Électricité importée", "unit": "kWh", "factor_kgco2e": 0.656, "description": "Électricité du réseau tunisien (STEG)"},
    {"name": "Student Commute - Car", "scope": 3, "category": "Transport domicile-campus", "unit": "km", "factor_kgco2e": 0.193, "description": "Voiture individuelle - étudiant"},
    {"name": "Student Commute - Bus", "scope": 3, "category": "Transport domicile-campus", "unit": "km", "factor_kgco2e": 0.105, "description": "Bus - étudiant"},
    {"name": "Student Commute - Train/Metro", "scope": 3, "category": "Transport domicile-campus", "unit": "km", "factor_kgco2e": 0.006, "description": "Train/Métro - étudiant"},
    {"name": "Student Commute - Walking/Bicycle", "scope": 3, "category": "Transport domicile-campus", "unit": "km", "factor_kgco2e": 0.0, "description": "Marche/Vélo"},
    {"name": "Teacher Commute - Car", "scope": 3, "category": "Transport domicile-campus", "unit": "km", "factor_kgco2e": 0.193, "description": "Voiture individuelle - enseignant"},
    {"name": "Teacher Commute - Bus", "scope": 3, "category": "Transport domicile-campus", "unit": "km", "factor_kgco2e": 0.105, "description": "Bus - enseignant"},
    {"name": "Staff Commute - Car", "scope": 3, "category": "Transport domicile-campus", "unit": "km", "factor_kgco2e": 0.193, "description": "Voiture individuelle - personnel admin"},
    {"name": "Staff Commute - Bus", "scope": 3, "category": "Transport domicile-campus", "unit": "km", "factor_kgco2e": 0.105, "description": "Bus - personnel admin"},
]
