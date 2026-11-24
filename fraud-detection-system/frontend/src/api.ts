import axios from "axios";

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/fraud`,
});

export interface Reason {
  code: string;
  weight: number;
  reason: string;
}

export interface Claim {
  id: number;
  client_id: string;
  amount: string | number;
  claim_type: string;
  location: string | null;
  claim_date: string;
  fraud_score: string | number;
  risk_level: "low" | "medium" | "high";
  flagged: boolean;
  reasons: Reason[];
  status: "pending_review" | "approved" | "rejected";
}

export interface Stats {
  total_claims: number;
  flagged_claims: number;
  pending_review: number;
  rejected_claims: number;
  avg_score: number;
  flagged_amount: number;
}

export interface NewClaim {
  client_id: string;
  amount: number;
  claim_type: string;
  location: string;
  previous_claims?: number;
  policy_age_days?: number;
  report_delay_days?: number;
}

export const errorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; errors?: string[] } | undefined;
    return data?.errors?.join(", ") || data?.error || err.message;
  }
  return String(err);
};
