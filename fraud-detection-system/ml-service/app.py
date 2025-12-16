from fastapi import FastAPI
from pydantic import BaseModel
import random

app = FastAPI()

class Claim(BaseModel):
    client_id: str
    amount: float
    claim_type: str
    location: str
    previous_claims: int = 0

@app.post("/predict")
def predict(claim: Claim):
    # Mock predict - replace with real model load & predict
    base = min(0.9, claim.amount / 10000)
    score = round(max(0.01, base + claim.previous_claims * 0.03 * random.random()), 2)
    return {"fraud_score": score, "flagged": score > 0.8}
