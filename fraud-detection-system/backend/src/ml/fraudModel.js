import axios from "axios";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

// Sends the claim to the ML scoring service and returns
// { fraud_score, risk_level, flagged, reasons }.
export const predictFraud = async (claim) => {
  const { data } = await axios.post(`${ML_SERVICE_URL}/predict`, claim, { timeout: 5000 });
  return data;
};
