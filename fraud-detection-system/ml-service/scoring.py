"""Explainable fraud risk scoring for microinsurance claims.

Each rule adds weight when a known fraud signal is present. The weighted sum
goes through a logistic function to give a 0-1 score, and every rule that
fired is returned as a plain-language reason so an analyst can see *why* a
claim was flagged. Scores are deterministic: the same claim always gets the
same score.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

# Typical upper claim amounts (KES) per product. Above this is unusual.
TYPICAL_MAX_AMOUNT = {
    "health": 50_000,
    "crop": 80_000,
    "livestock": 60_000,
    "property": 150_000,
    "life": 300_000,
    "motor": 200_000,
}
DEFAULT_TYPICAL_MAX = 100_000

BIAS = -3.0          # baseline log-odds: a claim with no signals scores ~0.05
REVIEW_THRESHOLD = 0.6
HIGH_RISK_THRESHOLD = 0.8


@dataclass(frozen=True)
class Claim:
    client_id: str
    amount: float
    claim_type: str
    location: str
    previous_claims: int = 0         # lifetime claims by this client
    recent_claims_30d: int = 0       # claims by this client in the last 30 days
    policy_age_days: int | None = None
    report_delay_days: int | None = None


def _logistic(x: float) -> float:
    return 1 / (1 + math.exp(-x))


def score_claim(claim: Claim) -> dict:
    if claim.amount <= 0:
        raise ValueError("amount must be greater than 0")

    reasons: list[dict] = []

    def add(weight: float, code: str, text: str) -> None:
        reasons.append({"code": code, "weight": weight, "reason": text})

    typical = TYPICAL_MAX_AMOUNT.get(claim.claim_type.strip().lower(), DEFAULT_TYPICAL_MAX)
    ratio = claim.amount / typical
    if ratio >= 2:
        add(2.5, "AMOUNT_VERY_HIGH", f"Amount is {ratio:.1f}x the typical maximum for {claim.claim_type} claims")
    elif ratio >= 1:
        add(1.5, "AMOUNT_HIGH", f"Amount is above the typical maximum for {claim.claim_type} claims")

    if claim.recent_claims_30d >= 2:
        add(2.0, "MANY_RECENT_CLAIMS", f"Client filed {claim.recent_claims_30d} other claims in the last 30 days")
    elif claim.recent_claims_30d == 1:
        add(0.8, "RECENT_CLAIM", "Client filed another claim in the last 30 days")

    if claim.previous_claims >= 5:
        add(1.2, "FREQUENT_CLAIMANT", f"Client has {claim.previous_claims} previous claims")

    if claim.policy_age_days is not None and claim.policy_age_days < 30:
        add(1.8, "NEW_POLICY", f"Claim made {claim.policy_age_days} days after the policy started")

    if claim.report_delay_days is not None and claim.report_delay_days > 60:
        add(1.0, "LATE_REPORT", f"Incident reported {claim.report_delay_days} days after it happened")

    if claim.amount >= 10_000 and claim.amount % 10_000 == 0:
        add(0.6, "ROUND_AMOUNT", "Large, perfectly round amount")

    score = round(_logistic(BIAS + sum(r["weight"] for r in reasons)), 3)
    if score >= HIGH_RISK_THRESHOLD:
        risk = "high"
    elif score >= REVIEW_THRESHOLD:
        risk = "medium"
    else:
        risk = "low"

    return {
        "fraud_score": score,
        "risk_level": risk,
        "flagged": score >= REVIEW_THRESHOLD,
        "reasons": sorted(reasons, key=lambda r: -r["weight"]),
    }
