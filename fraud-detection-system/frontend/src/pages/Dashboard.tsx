import React, { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const Dashboard = () => {
  const [claims, setClaims] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/fraud/claims").then((res) => setClaims(res.data)).catch(()=>{});
  }, []);

  return (
    <div>
      <h1 style={{fontSize:24, fontWeight:700, marginBottom:20}}>Fraud Detection Dashboard</h1>
      <div style={{ width: "100%", height: 360 }}>
        <ResponsiveContainer>
          <BarChart data={claims}>
            <XAxis dataKey="claim_type" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="fraud_score" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <table style={{width:"100%", marginTop:20, borderCollapse:"collapse"}}>
        <thead style={{background:"#f3f4f6"}}>
          <tr>
            <th>ID</th><th>Type</th><th>Amount</th><th>Score</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {claims.map((c:any) => (
            <tr key={c.id} style={{textAlign:"center", borderTop:"1px solid #e5e7eb"}}>
              <td>{c.id}</td><td>{c.claim_type}</td><td>{c.amount}</td><td>{c.fraud_score}</td><td>{c.flagged ? "Review" : "Clear"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
