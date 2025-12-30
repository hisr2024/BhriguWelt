import pytest

from bhriguwelt.api import handle_command
from bhriguwelt.wisdom_aggregator import aggregate_wisdom_for_bot


def test_aggregate_wisdom_for_bot_includes_all_engines():
    aggregate = aggregate_wisdom_for_bot(tradition="universal")
    payload = aggregate.to_dict()

    engines = {entry["engine"] for entry in payload["engines"]}
    expected = {
        "principles",
        "remedies",
        "past_life_engines",
        "future_engines",
        "transit_rules",
        "matchmaking_criteria",
    }

    assert expected.issubset(engines)
    assert payload["manuscript"]["title"]
    assert payload["analyses"]
    assert payload["interpretations"]


def test_handle_command_wisdom_aggregator_focus_filtering():
    response = handle_command("wisdom-aggregator", {"focus_engines": ["principles", "remedies"]})

    engines = {entry["engine"] for entry in response["engines"]}
    assert engines == {"principles", "remedies"}

    with pytest.raises(ValueError):
        handle_command("wisdom-aggregator", {"focus_engines": "principles"})
