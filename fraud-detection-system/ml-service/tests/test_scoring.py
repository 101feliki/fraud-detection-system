import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from scoring import Claim, score_claim  # noqa: E402


def claim(**overrides):
    base = dict(client_id="C1", amount=5_000, claim_type="Health", location="Nairobi")
    base.update(overrides)
    return Claim(**base)


def test_ordinary_claim_is_low_risk():
    result = score_claim(claim())
    assert result["risk_level"] == "low"
    assert not result["flagged"]
    assert result["reasons"] == []


def test_scoring_is_deterministic():
    c = claim(amount=120_000, recent_claims_30d=1)
    assert score_claim(c) == score_claim(c)


def test_stacked_signals_are_high_risk():
    result = score_claim(claim(amount=200_000, recent_claims_30d=3, policy_age_days=10))
    assert result["risk_level"] == "high"
    codes = {r["code"] for r in result["reasons"]}
    assert {"AMOUNT_VERY_HIGH", "MANY_RECENT_CLAIMS", "NEW_POLICY"} <= codes


def test_unknown_claim_type_uses_default_limit():
    assert score_claim(claim(claim_type="Gadget", amount=95_500))["reasons"] == []


def test_invalid_amount_rejected():
    with pytest.raises(ValueError):
        score_claim(claim(amount=0))
