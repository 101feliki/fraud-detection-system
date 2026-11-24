import { test } from "node:test";
import assert from "node:assert/strict";
import { validateClaim } from "../src/validation.js";

test("accepts a valid claim and fills defaults", () => {
  const { claim, errors } = validateClaim({ client_id: " C1 ", amount: "5000", claim_type: "Health" });
  assert.deepEqual(errors, []);
  assert.equal(claim.client_id, "C1");
  assert.equal(claim.amount, 5000);
  assert.equal(claim.previous_claims, 0);
  assert.equal(claim.policy_age_days, null);
});

test("rejects missing fields and bad numbers", () => {
  const { errors } = validateClaim({ amount: -1, previous_claims: 1.5 });
  assert.equal(errors.length, 4);
});
