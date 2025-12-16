CREATE TABLE IF NOT EXISTS claims (
  id SERIAL PRIMARY KEY,
  client_id VARCHAR(50),
  amount FLOAT,
  claim_type VARCHAR(100),
  location VARCHAR(150),
  claim_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fraud_score FLOAT,
  flagged BOOLEAN
);
