const express = require("express");

const {
  requestAIAnalysis,
  getAIAnalysis,
  checkDuplicateBug,
} = require("../controllers/aiController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Request a new AI analysis
router.post(
  "/analyze/:bugId",
  protect,
  requestAIAnalysis
);

// Get existing AI analysis
router.get(
  "/analysis/:bugId",
  protect,
  getAIAnalysis
);

// Check whether a bug is a possible duplicate
router.get(
  "/duplicate-check/:bugId",
  protect,
checkDuplicateBug
);

module.exports = router;