const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    project: {
      type: String,
      required: true,
      trim: true,
    },

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    preconditions: {
      type: String,
      default: "",
      trim: true,
    },

    steps: {
      type: String,
      required: true,
      trim: true,
    },

    expectedResult: {
      type: String,
      required: true,
      trim: true,
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },

    status: {
      type: String,
      enum: ["Draft", "Ready", "Deprecated"],
      default: "Draft",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const TestCase = mongoose.model(
  "TestCase",
  testCaseSchema
);

module.exports = TestCase;
