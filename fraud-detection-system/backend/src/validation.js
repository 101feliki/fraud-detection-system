const optionalInt = (value, field, errors) => {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) errors.push(`${field} must be a whole number of 0 or more`);
  return n;
};

// Returns { claim, errors }. claim is only usable when errors is empty.
export const validateClaim = (body = {}) => {
  const errors = [];
  const clientId = typeof body.client_id === "string" ? body.client_id.trim() : "";
  const claimType = typeof body.claim_type === "string" ? body.claim_type.trim() : "";
  const amount = Number(body.amount);

  if (!clientId) errors.push("client_id is required");
  if (!claimType) errors.push("claim_type is required");
  if (!Number.isFinite(amount) || amount <= 0) errors.push("amount must be a number greater than 0");

  const claim = {
    client_id: clientId,
    claim_type: claimType,
    amount,
    location: typeof body.location === "string" ? body.location.trim() : "",
    previous_claims: optionalInt(body.previous_claims, "previous_claims", errors) ?? 0,
    policy_age_days: optionalInt(body.policy_age_days, "policy_age_days", errors),
    report_delay_days: optionalInt(body.report_delay_days, "report_delay_days", errors),
  };
  return { claim, errors };
};

export const REVIEW_DECISIONS = ["approved", "rejected"];
