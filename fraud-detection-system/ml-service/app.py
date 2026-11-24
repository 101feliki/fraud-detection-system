from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from scoring import Claim, score_claim

app = FastAPI(title="Fraud Scoring Service", version="2.0.0")


class ClaimIn(BaseModel):
    client_id: str = Field(min_length=1)
    amount: float = Field(gt=0)
    claim_type: str = Field(min_length=1)
    location: str = ""
    previous_claims: int = Field(default=0, ge=0)
    recent_claims_30d: int = Field(default=0, ge=0)
    policy_age_days: int | None = Field(default=None, ge=0)
    report_delay_days: int | None = Field(default=None, ge=0)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
def predict(claim: ClaimIn):
    try:
        return score_claim(Claim(**claim.model_dump()))
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
