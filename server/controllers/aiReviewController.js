const AIReview = require("../models/AIReview");
const AIAnalysis = require("../models/AIAnalysis");
const Bug = require("../models/Bug");
const User = require("../models/User");

// ============================================================
// GET AI REVIEW
// ============================================================

const getAIReview = async (req, res) => {
  try {
    const { bugId } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Your account is not assigned to an organization.",
      });
    }

    const bug = await Bug.findOne({
      _id: bugId,
      organization: organizationId,
    });

    if (!bug) {
      return res.status(404).json({
        success: false,
        message: "Bug not found",
      });
    }

    const review = await AIReview.findOne({
      bug: bugId,
    })
      .populate("aiAnalysis")
      .populate("reviewer", "name email role")
      .populate(
        "reviewHistory.reviewer",
        "name email role"
      );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "AI review not found",
      });
    }

    return res.status(200).json({
      success: true,
      review,
    });
  } catch (error) {
    console.error(
      "Get AI review error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch AI review",
      error: error.message,
    });
  }
};

// ============================================================
// SUBMIT AI REVIEW
// ============================================================

const submitAIReview = async (req, res) => {
  try {
    const { bugId } = req.params;
    const organizationId = req.user?.organizationId;
    const reviewerId = req.user?.userId;

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Your account is not assigned to an organization.",
      });
    }

    if (!reviewerId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user could not be identified.",
      });
    }

    const {
      decision,
      reviewerComment,
      modifiedPriority,
      modifiedSeverity,
      modifiedCategory,
    } = req.body;

    const allowedDecisions = [
      "Accepted",
      "Modified",
      "Rejected",
    ];

    if (!allowedDecisions.includes(decision)) {
      return res.status(400).json({
        success: false,
        message:
          "Decision must be Accepted, Modified, or Rejected",
      });
    }

    // --------------------------------------------------------
    // Verify bug belongs to the logged-in user's organization
    // --------------------------------------------------------

    const bug = await Bug.findOne({
      _id: bugId,
      organization: organizationId,
    });

    if (!bug) {
      return res.status(404).json({
        success: false,
        message: "Bug not found",
      });
    }

    // --------------------------------------------------------
    // Verify reviewer belongs to the same organization
    // --------------------------------------------------------

    const reviewer = await User.findOne({
      _id: reviewerId,
      organization: organizationId,
    });

    if (!reviewer) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Reviewer does not belong to this organization.",
      });
    }

    // --------------------------------------------------------
    // Get AI analysis for the verified bug
    // --------------------------------------------------------

    const analysis = await AIAnalysis.findOne({
      bug: bug._id,
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message:
          "AI analysis not found. Generate AI analysis before reviewing.",
      });
    }

    // --------------------------------------------------------
    // Apply human review decision to the bug
    // --------------------------------------------------------

    if (decision === "Accepted") {
      bug.priority = analysis.priorityRecommendation;
      bug.severity = analysis.severityRecommendation;
      bug.category = analysis.category || "";

      await bug.save();
    }

    if (decision === "Modified") {
      if (
        !modifiedPriority ||
        !modifiedSeverity ||
        typeof modifiedCategory !== "string" ||
        !modifiedCategory.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Modified review requires priority, severity, and category.",
        });
      }

      bug.priority = modifiedPriority;
      bug.severity = modifiedSeverity;
      bug.category = modifiedCategory.trim();

      await bug.save();
    }

    // --------------------------------------------------------
    // Create or update review
    // --------------------------------------------------------

    const review = await AIReview.findOneAndUpdate(
      {
        bug: bug._id,
      },
      {
        $set: {
          aiAnalysis: analysis._id,
          decision,
          reviewer: reviewer._id,
          reviewerComment:
            typeof reviewerComment === "string"
              ? reviewerComment.trim()
              : "",
          modifiedPriority:
            decision === "Modified"
              ? modifiedPriority || null
              : null,
          modifiedSeverity:
            decision === "Modified"
              ? modifiedSeverity || null
              : null,
          modifiedCategory:
            decision === "Modified"
              ? typeof modifiedCategory === "string"
                ? modifiedCategory.trim()
                : ""
              : "",
        },

        $push: {
          reviewHistory: {
            decision,
            reviewer: reviewer._id,
            comment:
              typeof reviewerComment === "string"
                ? reviewerComment.trim()
                : "",
          },
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message:
        "AI review submitted successfully",
      review,
    });
  } catch (error) {
    console.error(
      "Submit AI review error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to submit AI review",
      error: error.message,
    });
  }
};

module.exports = {
  getAIReview,
  submitAIReview,
};
