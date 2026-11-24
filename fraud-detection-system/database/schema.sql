CREATE TABLE IF NOT EXISTS claims (
  id                SERIAL PRIMARY KEY,
  client_id         VARCHAR(50)  NOT NULL,
  amount            NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  claim_type        VARCHAR(100) NOT NULL,
  location          VARCHAR(150),
  previous_claims   INT NOT NULL DEFAULT 0,
  policy_age_days   INT,
  report_delay_days INT,
  claim_date        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fraud_score       NUMERIC(4,3),
  risk_level        VARCHAR(10),
  flagged           BOOLEAN NOT NULL DEFAULT FALSE,
  reasons           JSONB NOT NULL DEFAULT '[]',
  status            VARCHAR(20) NOT NULL DEFAULT 'approved'
                    CHECK (status IN ('pending_review', 'approved', 'rejected')),
  reviewed_by       VARCHAR(100),
  reviewed_at       TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_claims_client_date ON claims (client_id, claim_date);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims (status);
