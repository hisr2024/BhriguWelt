from pathlib import Path

from bhriguwelt import bhrigu_data
from bhriguwelt.data_loader import persist_bhrigu_data
from bhriguwelt.taxonomy_generator import generate_future_taxonomy, generate_past_life_taxonomy


def main() -> None:
    dataset = bhrigu_data.as_dict()
    dataset["past_life_engines"] = generate_past_life_taxonomy()
    dataset["future_engines"] = generate_future_taxonomy()

    target = Path("backend/data/bhrigu_samhita_principles.yml")
    persist_bhrigu_data(dataset, target)
    print(f"✅ {target} created")


if __name__ == "__main__":
    main()
