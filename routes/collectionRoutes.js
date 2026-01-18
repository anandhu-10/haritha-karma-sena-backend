const express = require("express");
const router = express.Router();

const {
  addCollectionArea,
  getCollectionAreas,
} = require("../controllers/collectionController");

const DisposerRequest = require("../models/DisposerRequest");

/* ---------------- COLLECTION AREAS ---------------- */

// Add new collection area
router.post("/collectionAreas", addCollectionArea);

// Get all collection areas
router.get("/collectionAreas", getCollectionAreas);

/* ---------------- COLLECTOR DASHBOARD STATS ---------------- */
/*
  GET /api/collector/dashboard-stats
*/
router.get("/collector/dashboard-stats", async (req, res) => {
  try {
    const requests = await DisposerRequest.find();

    const total = requests.length;
    const pending = requests.filter(
      (r) => r.status !== "Picked Up"
    ).length;

    const picked = requests.filter(
      (r) => r.status === "Picked Up"
    ).length;

    const todayDate = new Date().toLocaleDateString();
    const today = requests.filter(
      (r) => r.date && r.date.includes(todayDate)
    ).length;

    res.status(200).json({
      total,
      pending,
      picked,
      today,
    });
  } catch (err) {
    console.error("DASHBOARD STATS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});

module.exports = router;
