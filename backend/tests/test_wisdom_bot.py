import pytest

from bhriguwelt.api import handle_command
from bhriguwelt.horoscope import HoroscopeRequest
from bhriguwelt.wisdom_bot import build_wisdom_bot_response


@pytest.fixture
def sample_request() -> HoroscopeRequest:
    return HoroscopeRequest(
        name="Asha",
        birth_date="1990-01-01",
        birth_time="06:15",
        birth_place="Jaipur, Bharat",
        consent_for_date_predictions=True,
    )


def test_build_wisdom_bot_response_compiles_shareable_markdown(sample_request):
    response = build_wisdom_bot_response(
        primary_request=sample_request,
        query="How do I balance work and relationships?",
        focus_areas=["career", "relationship"],
        language="en",
    ).to_dict()

    assert response["ai_reply"].startswith("Asha, your query")
    assert "Core Wisdom Digest" in response["download"]["markdown"]
    assert response["core_wisdom"]["sections"]
    assert response["core_wisdom"]["sources"]
    assert response["flow"]["analyzers"]
    assert response["ai_support"]["coverage"]


def test_wisdom_bot_command_handles_payload(sample_request):
    payload = {
        "name": sample_request.name,
        "birth_date": sample_request.birth_date,
        "birth_time": sample_request.birth_time,
        "birth_place": sample_request.birth_place,
        "query": "Share a consolidated wisdom pack",
        "focus_areas": ["purpose"],
        "consent_for_date_predictions": True,
    }

    response = handle_command("wisdom-bot", payload)

    assert response["core_wisdom"]["karmic_epoch"]
    assert response["download"]["filename"].endswith("asha.md")
    assert "analyzers" in response["flow"]
