import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { api, Claim, NewClaim, Stats, errorMessage } from "../api";

const CLAIM_TYPES = ["Health", "Crop", "Livestock", "Property", "Life", "Motor"];
const RISK_COLORS = { low: "#2da44e", medium: "#d29922", high: "#cf222e" } as const;
const kes = (n: number | string) => `KES ${Number(n).toLocaleString()}`;

const emptyForm = {
  client_id: "",
  amount: "",
  claim_type: "Health",
  location: "",
  previous_claims: "",
  policy_age_days: "",
  report_delay_days: "",
};

const Dashboard = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [result, setResult] = useState<{ decision: string; claim: Claim } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([
        api.get<Claim[]>("/claims", { params: filter ? { status: filter } : {} }),
        api.get<Stats>("/stats"),
      ]);
      setClaims(c.data);
      setStats(s.data);
      setError("");
    } catch (err) {
      setError(`Could not reach the API: ${errorMessage(err)}`);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const chartData = useMemo(() => {
    const byType: Record<string, { claim_type: string; total: number; flagged: number }> = {};
    for (const c of claims) {
      const row = (byType[c.claim_type] ||= { claim_type: c.claim_type, total: 0, flagged: 0 });
      row.total++;
      if (c.flagged) row.flagged++;
    }
    return Object.values(byType);
  }, [claims]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const optional = (v: string) => (v === "" ? undefined : Number(v));
      const payload: NewClaim = {
        client_id: form.client_id,
        amount: Number(form.amount),
        claim_type: form.claim_type,
        location: form.location,
        previous_claims: optional(form.previous_claims),
        policy_age_days: optional(form.policy_age_days),
        report_delay_days: optional(form.report_delay_days),
      };
      const { data } = await api.post("/analyze", payload);
      setResult(data);
      setForm(emptyForm);
      setError("");
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const review = async (id: number, decision: "approved" | "rejected") => {
    try {
      await api.patch(`/claims/${id}/review`, { decision, reviewer: "analyst" });
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const field = (name: keyof typeof emptyForm, label: string, type = "text", required = false) => (
    <label>
      {label}
      <input
        type={type}
        min={type === "number" ? 0 : undefined}
        required={required}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
      />
    </label>
  );

  return (
    <div className="dashboard">
      <h1>Fraud Detection Dashboard</h1>
      {error && <p className="error">{error}</p>}

      {stats && (
        <div className="stats">
          <div className="card"><span>Total claims</span><strong>{stats.total_claims}</strong></div>
          <div className="card"><span>Flagged</span><strong>{stats.flagged_claims}</strong></div>
          <div className="card"><span>Awaiting review</span><strong>{stats.pending_review}</strong></div>
          <div className="card"><span>Rejected</span><strong>{stats.rejected_claims}</strong></div>
          <div className="card"><span>Flagged amount</span><strong>{kes(stats.flagged_amount)}</strong></div>
        </div>
      )}

      <div className="grid">
        <form className="panel" onSubmit={submit}>
          <h2>Check a claim</h2>
          {field("client_id", "Client ID", "text", true)}
          {field("amount", "Amount (KES)", "number", true)}
          <label>
            Claim type
            <select value={form.claim_type} onChange={(e) => setForm({ ...form, claim_type: e.target.value })}>
              {CLAIM_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          {field("location", "Location")}
          {field("previous_claims", "Previous claims", "number")}
          {field("policy_age_days", "Days since policy started", "number")}
          {field("report_delay_days", "Days between incident and report", "number")}
          <button disabled={busy}>{busy ? "Scoring..." : "Analyse claim"}</button>

          {result && (
            <div className={`result ${result.claim.risk_level}`}>
              <strong>{result.decision}</strong> - score {Number(result.claim.fraud_score).toFixed(2)} ({result.claim.risk_level} risk)
              {result.claim.reasons.length > 0 && (
                <ul>{result.claim.reasons.map((r) => <li key={r.code}>{r.reason}</li>)}</ul>
              )}
            </div>
          )}
        </form>

        <div className="panel">
          <h2>Claims by type</h2>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <XAxis dataKey="claim_type" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" name="All claims" fill="#8c959f" />
                <Bar dataKey="flagged" name="Flagged" fill="#cf222e">
                  {chartData.map((d) => <Cell key={d.claim_type} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="table-head">
          <h2>Claims</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All</option>
            <option value="pending_review">Awaiting review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Client</th><th>Type</th><th>Amount</th><th>Score</th><th>Risk</th><th>Why</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.client_id}</td>
                <td>{c.claim_type}</td>
                <td>{kes(c.amount)}</td>
                <td>{Number(c.fraud_score).toFixed(2)}</td>
                <td><span className="pill" style={{ background: RISK_COLORS[c.risk_level] || "#8c959f" }}>{c.risk_level}</span></td>
                <td className="reasons">{c.reasons.map((r) => r.reason).join("; ") || "-"}</td>
                <td>
                  {c.status === "pending_review" ? (
                    <span className="actions">
                      <button className="small ok" onClick={() => review(c.id, "approved")}>Approve</button>
                      <button className="small bad" onClick={() => review(c.id, "rejected")}>Reject</button>
                    </span>
                  ) : (
                    c.status
                  )}
                </td>
              </tr>
            ))}
            {claims.length === 0 && (
              <tr><td colSpan={8}>No claims yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
