import express from "express";
import { analyzeClaim, getAllClaims, getClaim, getStats, reviewClaim } from "../controllers/fraudController.js";

const router = express.Router();

router.post("/analyze", analyzeClaim);          // Score and store a claim
router.get("/claims", getAllClaims);            // List claims (?status=pending_review&limit=50)
router.get("/claims/:id", getClaim);            // One claim with its reasons
router.patch("/claims/:id/review", reviewClaim); // Analyst decision: approved | rejected
router.get("/stats", getStats);                 // Dashboard statistics

export default router;
