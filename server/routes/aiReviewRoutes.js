const express = require("express");

const {
  getAIReview,
  submitAIReview,
} = require("../controllers/aiReviewController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Get existing human review
router.get(
  "/:bugId",
  protect,
  getAIReview
);

// Submit human review
router.post(
  "/:bugId",
  protect,
  submitAIReview
);

module.exports = router;
