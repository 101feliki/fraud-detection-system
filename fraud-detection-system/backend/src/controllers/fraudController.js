import { predictFraud } from "../ml/fraudModel.js";
import { pool } from "../config/db.js";

export const analyzeClaim = async (req, res) => {
  try {
    const claim = req.body;
    const fraud_score = await predictFraud(claim);
    const flagged = fraud_score > 0.8;

    await pool.query(
      "INSERT INTO claims (client_id, amount, claim_type, location, fraud_score, flagged) VALUES ($1, $2, $3, $4, $5, $6)",
      [claim.client_id, claim.amount, claim.claim_type, claim.location, fraud_score, flagged]
    );

    res.json({ fraud_score, flagged, decision: flagged ? "Review Required" : "Approved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllClaims = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM claims ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        COUNT(*) as total_claims,
        SUM(CASE WHEN flagged THEN 1 ELSE 0 END) as flagged_claims,
        AVG(fraud_score) as avg_score
      FROM claims
    `);
    res.json(stats.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
