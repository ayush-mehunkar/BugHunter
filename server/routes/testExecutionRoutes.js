const express = require("express");

const {
  createTestExecution,
  getTestExecutions,
  getTestExecutionById,
  deleteTestExecution,
} = require("../controllers/testExecutionController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Create a test execution.
router.post("/", protect, createTestExecution);

// Get test executions with optional filters.
router.get("/", protect, getTestExecutions);

// Get one test execution.
router.get("/:id", protect, getTestExecutionById);

// Delete a test execution.
router.delete("/:id", protect, deleteTestExecution);

module.exports = router;
