import express from "express";
import { analyzeClaim, getAllClaims, getStats } from "../controllers/fraudController.js";

const router = express.Router();

router.post("/analyze", analyzeClaim);  // Analyze a claim
router.get("/claims", getAllClaims);    // Fetch all claims
router.get("/stats", getStats);         // System statistics

export default router;
