const mongoose = require("mongoose");

const testExecutionSchema = new mongoose.Schema(
  {
    testCase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestCase",
      required: true,
    },

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    executedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    result: {
      type: String,
      enum: ["Pass", "Fail", "Blocked"],
      required: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    environment: {
      type: String,
      default: "",
      trim: true,
    },

    actualResult: {
      type: String,
      default: "",
      trim: true,
    },

    defectBug: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bug",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const TestExecution = mongoose.model(
  "TestExecution",
  testExecutionSchema
);

module.exports = TestExecution;
