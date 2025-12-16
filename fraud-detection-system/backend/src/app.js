import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fraudRoutes from "./routes/fraudRoutes.js";
import { connectDB } from "./config/db.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Connect DB
connectDB();

// Routes
app.use("/api/fraud", fraudRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Fraud Detection API running on port ${PORT}`);
});
