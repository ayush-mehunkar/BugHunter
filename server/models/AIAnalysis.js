const mongoose = require("mongoose");

const triggeredRuleSchema = new mongoose.Schema(
  {
    ruleId: {
      type: String,
      required: true,
      trim: true,
    },

    ruleName: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      default: "",
      trim: true,
    },

    severityImpact: {
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

    priorityImpact: {
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

    matchedKeywords: {
      type: [String],
      default: [],
    },

    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    explanation: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const aiAnalysisSchema = new mongoose.Schema(
  {
    bug: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bug",
      required: true,
      unique: true,
    },

    category: {
      type: String,
      default: "",
      trim: true,
    },

    priorityRecommendation: {
      type: String,
      enum: [
        "Low",
        "Medium",
        "High",
        "Critical",
      ],
      default: "Medium",
    },

    severityRecommendation: {
      type: String,
      enum: [
        "Minor",
        "Major",
        "Critical",
        "Blocker",
      ],
      default: "Major",
    },

    summary: {
      type: String,
      default: "",
      trim: true,
    },

    possibleCause: {
      type: String,
      default: "",
      trim: true,
    },

    suggestedFix: {
      type: String,
      default: "",
      trim: true,
    },

    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // ========================================================
    // RULE ENGINE
    // ========================================================

    ruleEngine: {
      engine: {
        type: String,
        default: "BugHunter Rule Engine",
        trim: true,
      },

      version: {
        type: String,
        default: "1.2.0",
        trim: true,
      },

      rulesEvaluated: {
        type: Number,
        min: 0,
        default: 0,
      },

      rulesTriggered: {
        type: Number,
        min: 0,
        default: 0,
      },

      triggeredRules: {
        type: [triggeredRuleSchema],
        default: [],
      },
    },

    // ========================================================
    // AI INVESTIGATION
    // ========================================================

    investigation: {
      type: [String],
      default: [],
    },

    rootCauseHypotheses: {
      type: [String],
      default: [],
    },

    evidence: {
      type: [String],
      default: [],
    },

    suggestedTests: {
      type: [String],
      default: [],
    },

    riskAssessment: {
      level: {
        type: String,
        enum: [
          "Low",
          "Medium",
          "Medium-High",
          "High",
        ],
        default: "Medium",
      },

      reason: {
        type: String,
        default: "",
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

const AIAnalysis = mongoose.model(
  "AIAnalysis",
  aiAnalysisSchema
);

module.exports = AIAnalysis;
