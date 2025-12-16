import * as tf from "@tensorflow/tfjs-node";

/*
  This is a stub model for testing.
  Replace this with a loaded model or a real prediction function.
  Example: load a saved model with tf.loadLayersModel(path)
*/

export const predictFraud = async (claim) => {
  // TODO: replace with real feature extraction + model prediction
  // For now return a mock score based on amount and previous claims
  try {
    const base = Math.tanh((claim.amount || 0) / 10000);
    const prev = (claim.previous_claims || 0) * 0.05;
    const score = Math.min(0.99, Math.max(0.01, base + prev * Math.random()));
    return parseFloat(score.toFixed(2));
  } catch (err) {
    console.error("Model error:", err);
    return 0.01;
  }
};
