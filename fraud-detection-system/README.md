# Microinsurance Fraud Detection System

A plug-and-play service that scores insurance claims for fraud risk, explains *why* a claim was flagged, and gives analysts a dashboard to review and decide on suspicious claims. It can run on its own or sit in front of an existing policy or claims system.

![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

---

## How it works

```
React dashboard ──▶ Express API ──▶ ML scoring service (FastAPI)
                        │
                        ▼
                   PostgreSQL
```

1. A claim is sent to `POST /api/fraud/analyze`.
2. The API counts the client's claims in the last 30 days and sends everything to the scoring service.
3. The scoring service checks known fraud signals and returns a score from 0 to 1, a risk level and the reasons.
4. Low-risk claims are approved automatically. Claims scoring 0.6 or more go to **pending review** for an analyst.
5. Analysts approve or reject flagged claims from the dashboard.

### Fraud signals

| Signal | Example reason shown to the analyst |
|---|---|
| Amount far above normal for the product | "Amount is 2.5x the typical maximum for Crop claims" |
| Several claims in a short time | "Client filed 2 other claims in the last 30 days" |
| Frequent claimant | "Client has 6 previous claims" |
| Claim right after the policy started | "Claim made 12 days after the policy started" |
| Late reporting | "Incident reported 75 days after it happened" |
| Large, perfectly round amount | "Large, perfectly round amount" |

Scores are deterministic: the same claim always gets the same score, so decisions can be audited.

---

## API

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/fraud/analyze` | Score and store a claim |
| `GET` | `/api/fraud/claims?status=pending_review&limit=50` | List claims |
| `GET` | `/api/fraud/claims/:id` | One claim with its reasons |
| `PATCH` | `/api/fraud/claims/:id/review` | `{ "decision": "approved" \| "rejected", "reviewer": "name" }` |
| `GET` | `/api/fraud/stats` | Totals for the dashboard |

Example claim:
```json
{
  "client_id": "C300",
  "amount": 200000,
  "claim_type": "Crop",
  "location": "Embu",
  "previous_claims": 1,
  "policy_age_days": 12,
  "report_delay_days": 3
}
```

---

## Run with Docker

```bash
cd fraud-detection-system
docker compose up --build
```

- Dashboard: http://localhost:3000
- API: http://localhost:5000
- Scoring service docs: http://localhost:8000/docs

Set `DB_USER` and `DB_PASS` in your shell to override the default database credentials.

## Run manually

```bash
# Database
createdb frauddb
psql -d frauddb -f database/schema.sql -f database/seed.sql

# Scoring service
cd ml-service
pip install -r requirements.txt
uvicorn app:app --port 8000

# API (needs DB_USER, DB_PASS, DB_HOST, DB_PORT, DB_NAME and ML_SERVICE_URL)
cd backend
npm install
npm start

# Dashboard
cd frontend
npm install
npm run dev
```

## Tests

```bash
cd ml-service && pytest        # scoring rules
cd backend && npm test         # input validation
```

---

## Roadmap

- Train a model on labelled claim outcomes once enough reviewed claims exist
- Email or SMS alerts for high-risk claims
- Analyst login and roles
- Map view of flagged claims by location

## Author

**Felix Kariuki** - [@101feliki](https://github.com/101feliki)
