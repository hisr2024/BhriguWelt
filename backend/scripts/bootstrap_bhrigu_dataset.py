from pathlib import Path
from bhriguwelt.taxonomy_generator import (
    generate_past_life_taxonomy,
    generate_future_taxonomy,
)
from bhriguwelt.data_loader import persist_bhrigu_data

dataset = {
    "metadata": {
        "source_note": "Generated scaffold – to be enriched with manuscript citations",
        "version": "0.1.0",
    },
    "principles": [],
    "past_life_engines": generate_past_life_taxonomy(),
    "future_engines": generate_future_taxonomy(),
    "transit_rules": [],
    "matchmaking_criteria": [],
    "remedies": [],
}

persist_bhrigu_data(dataset, Path("backend/data/bhrigu_samhita_principles.yml"))

print("✅ bhrigu_samhita_principles.yml created")
