import { predictFraud } from "../ml/fraudModel.js";
import { pool } from "../config/db.js";
import { validateClaim, REVIEW_DECISIONS } from "../validation.js";

export const analyzeClaim = async (req, res) => {
  const { claim, errors } = validateClaim(req.body);
  if (errors.length) return res.status(400).json({ errors });

  try {
    // Repeat claims are a strong fraud signal, so count this client's recent claims first.
    const { rows } = await pool.query(
      "SELECT COUNT(*)::int AS n FROM claims WHERE client_id = $1 AND claim_date > NOW() - INTERVAL '30 days'",
      [claim.client_id]
    );
    const recent_claims_30d = rows[0].n;

    let result;
    try {
      result = await predictFraud({ ...claim, recent_claims_30d });
    } catch (err) {
      console.error("ML service error:", err.message);
      return res.status(503).json({ error: "Scoring service is unavailable. Try again shortly." });
    }

    const status = result.flagged ? "pending_review" : "approved";
    const inserted = await pool.query(
      `INSERT INTO claims
         (client_id, amount, claim_type, location, previous_claims, policy_age_days, report_delay_days,
          fraud_score, risk_level, flagged, reasons, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        claim.client_id, claim.amount, claim.claim_type, claim.location, claim.previous_claims,
        claim.policy_age_days, claim.report_delay_days, result.fraud_score, result.risk_level,
        result.flagged, JSON.stringify(result.reasons), status,
      ]
    );

    res.status(201).json({
      claim: inserted.rows[0],
      decision: result.flagged ? "Review Required" : "Approved",
      reasons: result.reasons,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not analyse the claim" });
  }
};

export const getAllClaims = async (req, res) => {
  try {
    const params = [];
    let where = "";
    if (req.query.status) {
      params.push(req.query.status);
      where = "WHERE status = $1";
    }
    const limit = Math.max(1, Math.min(Math.trunc(Number(req.query.limit)) || 100, 500));
    const { rows } = await pool.query(`SELECT * FROM claims ${where} ORDER BY id DESC LIMIT ${limit}`, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load claims" });
  }
};

export const getClaim = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM claims WHERE id = $1", [Number(req.params.id)]);
    if (!rows.length) return res.status(404).json({ error: "Claim not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load the claim" });
  }
};

export const reviewClaim = async (req, res) => {
  const { decision, reviewer } = req.body || {};
  if (!REVIEW_DECISIONS.includes(decision)) {
    return res.status(400).json({ error: `decision must be one of: ${REVIEW_DECISIONS.join(", ")}` });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE claims SET status = $1, reviewed_by = $2, reviewed_at = NOW()
       WHERE id = $3 AND status = 'pending_review' RETURNING *`,
      [decision, reviewer || null, Number(req.params.id)]
    );
    if (!rows.length) return res.status(409).json({ error: "Claim not found or not waiting for review" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save the review" });
  }
};

export const getStats = async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)::int                                         AS total_claims,
        COUNT(*) FILTER (WHERE flagged)::int                  AS flagged_claims,
        COUNT(*) FILTER (WHERE status = 'pending_review')::int AS pending_review,
        COUNT(*) FILTER (WHERE status = 'rejected')::int       AS rejected_claims,
        COALESCE(ROUND(AVG(fraud_score)::numeric, 3), 0)::float AS avg_score,
        COALESCE(SUM(amount) FILTER (WHERE flagged), 0)::float  AS flagged_amount
      FROM claims
    `);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load stats" });
  }
};
