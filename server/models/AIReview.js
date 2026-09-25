const mongoose = require("mongoose");

const aiReviewSchema = new mongoose.Schema(
  {
    bug: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bug",
      required: true,
      unique: true,
    },

    aiAnalysis: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIAnalysis",
      required: true,
    },

    decision: {
      type: String,
      enum: [
        "Pending",
        "Accepted",
        "Modified",
        "Rejected",
      ],
      default: "Pending",
    },

    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewerComment: {
      type: String,
      default: "",
      trim: true,
    },

    modifiedPriority: {
      type: String,
      enum: [
        "Low",
        "Medium",
        "High",
        "Critical",
        null,
      ],
      default: null,
    },

    modifiedSeverity: {
      type: String,
      enum: [
        "Minor",
        "Major",
        "Critical",
        "Blocker",
        null,
      ],
      default: null,
    },

    modifiedCategory: {
      type: String,
      default: "",
      trim: true,
    },

    reviewHistory: [
      {
        decision: {
          type: String,
          enum: [
            "Accepted",
            "Modified",
            "Rejected",
          ],
          required: true,
        },

        reviewer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },

        comment: {
          type: String,
          default: "",
          trim: true,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const AIReview = mongoose.model(
  "AIReview",
  aiReviewSchema
);

module.exports = AIReview;
