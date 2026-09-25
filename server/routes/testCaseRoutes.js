const express = require("express");

const {
  createTestCase,
  getTestCases,
  getTestCaseById,
  updateTestCase,
  deleteTestCase,
} = require("../controllers/testCaseController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Create a test case.
router.post(
  "/",
  protect,
  createTestCase
);

// Get all test cases.
router.get(
  "/",
  protect,
  getTestCases
);

// Get one test case.
router.get(
  "/:id",
  protect,
  getTestCaseById
);

// Update a test case.
router.put(
  "/:id",
  protect,
  updateTestCase
);

// Delete a test case.
router.delete(
  "/:id",
  protect,
  deleteTestCase
);

module.exports = router;
