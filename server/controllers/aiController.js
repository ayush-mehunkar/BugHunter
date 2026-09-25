const Bug = require("../models/Bug");
const AIAnalysis = require("../models/AIAnalysis");
const {
  evaluateBugRules,
} = require("../services/bugRuleEngine");

// ============================================================
// REQUEST AI ANALYSIS
// ============================================================

const requestAIAnalysis = async (req, res) => {
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

    // --------------------------------------------------------
    // RULE ENGINE
    // --------------------------------------------------------

    const ruleEngineResult = evaluateBugRules({
      title: bug.title || "",
      description: bug.description || "",
      environment: bug.environment || "",
      stepsToReproduce:
        bug.stepsToReproduce || "",
      expectedResult:
        bug.expectedResult || "",
      actualResult:
        bug.actualResult || "",
      tags: Array.isArray(bug.tags)
        ? bug.tags
        : [],
    });

    // --------------------------------------------------------
    // AI SERVICE
    // --------------------------------------------------------

    const response = await fetch(
      `${process.env.AI_SERVICE_URL}/analyze`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: bug.title || "",
          description:
            bug.description || "",
          environment:
            bug.environment || "",
          stepsToReproduce:
            bug.stepsToReproduce || "",
          expectedResult:
            bug.expectedResult || "",
          actualResult:
            bug.actualResult || "",
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `AI service returned status ${response.status}`
      );
    }

    const aiResult = await response.json();

    if (
      !aiResult.success ||
      !aiResult.analysis
    ) {
      throw new Error(
        "Invalid response from AI service"
      );
    }

    const aiData = aiResult.analysis;

    // --------------------------------------------------------
    // VALIDATE RISK ASSESSMENT
    // --------------------------------------------------------

    const allowedRiskLevels = [
      "Low",
      "Medium",
      "Medium-High",
      "High",
    ];

    const riskAssessment =
      aiData.riskAssessment &&
      typeof aiData.riskAssessment ===
        "object"
        ? {
            level:
              allowedRiskLevels.includes(
                aiData.riskAssessment.level
              )
                ? aiData.riskAssessment.level
                : "Medium",

            reason:
              typeof aiData.riskAssessment
                .reason === "string"
                ? aiData.riskAssessment.reason.trim()
                : "",
          }
        : {
            level: "Medium",
            reason: "",
          };

    // --------------------------------------------------------
    // CLEAN RULE ENGINE TRIGGERED RULES
    // --------------------------------------------------------

    const triggeredRules =
      Array.isArray(
        ruleEngineResult.triggeredRules
      )
        ? ruleEngineResult.triggeredRules.map(
            (rule) => ({
              ruleId:
                typeof rule.ruleId ===
                "string"
                  ? rule.ruleId
                  : "",

              ruleName:
                typeof rule.ruleName ===
                "string"
                  ? rule.ruleName
                  : "",

              description:
                typeof rule.description ===
                "string"
                  ? rule.description
                  : "",

              category:
                typeof rule.category ===
                "string"
                  ? rule.category
                  : "",

              severityImpact: [
                "Minor",
                "Major",
                "Critical",
                "Blocker",
              ].includes(
                rule.severityImpact
              )
                ? rule.severityImpact
                : null,

              priorityImpact: [
                "Low",
                "Medium",
                "High",
                "Critical",
              ].includes(
                rule.priorityImpact
              )
                ? rule.priorityImpact
                : null,

              matchedKeywords:
                Array.isArray(
                  rule.matchedKeywords
                )
                  ? rule.matchedKeywords.filter(
                      (keyword) =>
                        typeof keyword ===
                        "string"
                    )
                  : [],

              score:
                typeof rule.score ===
                  "number" &&
                rule.score >= 0 &&
                rule.score <= 100
                  ? rule.score
                  : 0,

              explanation:
                typeof rule.explanation ===
                "string"
                  ? rule.explanation
                  : "",
            })
          )
        : [];

    // --------------------------------------------------------
    // SAVE AI + RULE ENGINE ANALYSIS
    // --------------------------------------------------------

    const analysis =
      await AIAnalysis.findOneAndUpdate(
        {
          bug: bug._id,
        },
        {
          bug: bug._id,

          category:
            aiData.category || "",

          priorityRecommendation:
            [
              "Low",
              "Medium",
              "High",
              "Critical",
            ].includes(
              aiData.priority
            )
              ? aiData.priority
              : "Medium",

          severityRecommendation:
            [
              "Minor",
              "Major",
              "Critical",
              "Blocker",
            ].includes(
              aiData.severity
            )
              ? aiData.severity
              : "Major",

          summary:
            aiData.summary || "",

          possibleCause:
            aiData.possibleCause || "",

          suggestedFix:
            aiData.suggestedFix || "",

          confidence:
            typeof aiData.confidence ===
            "number"
              ? aiData.confidence
              : 0,

          // ==================================================
          // RULE ENGINE RESULT
          // ==================================================

          ruleEngine: {
            engine:
              ruleEngineResult.engine ||
              "BugHunter Rule Engine",

            version:
              ruleEngineResult.version ||
              "1.2.0",

            rulesEvaluated:
              typeof ruleEngineResult
                .rulesEvaluated ===
              "number"
                ? ruleEngineResult.rulesEvaluated
                : 0,

            rulesTriggered:
              typeof ruleEngineResult
                .rulesTriggered ===
              "number"
                ? ruleEngineResult.rulesTriggered
                : 0,

            triggeredRules,
          },

          // ==================================================
          // AI INVESTIGATION DATA
          // ==================================================

          investigation:
            Array.isArray(
              aiData.investigation
            )
              ? aiData.investigation.filter(
                  (item) =>
                    typeof item ===
                    "string"
                )
              : [],

          rootCauseHypotheses:
            Array.isArray(
              aiData.rootCauseHypotheses
            )
              ? aiData.rootCauseHypotheses
              : [],

          evidence:
            Array.isArray(
              aiData.evidence
            )
              ? aiData.evidence
              : [],

          suggestedTests:
            Array.isArray(
              aiData.suggestedTests
            )
              ? aiData.suggestedTests
              : [],

          riskAssessment,
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );

    bug.aiAnalysis = analysis._id;
    await bug.save();

    return res.status(200).json({
      success: true,
      message:
        "AI analysis generated and saved successfully",
      analysis,
    });
  } catch (error) {
    console.error(
      "Request AI analysis error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate AI analysis",
      error: error.message,
    });
  }
};

// ============================================================
// GET AI ANALYSIS
// ============================================================

const getAIAnalysis = async (req, res) => {
  try {
    const { bugId } = req.params;
    const organizationId =
      req.user?.organizationId;

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

    const analysis =
      await AIAnalysis.findOne({
        bug: bugId,
      });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message:
          "AI analysis not found for this bug",
      });
    }

    return res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error(
      "Get AI analysis error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch AI analysis",
      error: error.message,
    });
  }
};

// ============================================================
// DUPLICATE BUG DETECTION
// ============================================================

const checkDuplicateBug = async (
  req,
  res
) => {
  try {
    const { bugId } = req.params;
    const organizationId =
      req.user?.organizationId;

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

    const existingBugs =
      await Bug.find({
        organization: organizationId,
        _id: {
          $ne: bug._id,
        },
      })
        .select(
          "_id title description"
        )
        .sort({
          createdAt: -1,
        })
        .limit(50);

    const duplicateCandidates =
      existingBugs.map(
        (existingBug) => ({
          id: existingBug._id.toString(),
          title:
            existingBug.title || "",
          description:
            existingBug.description ||
            "",
        })
      );

    const response = await fetch(
      `${process.env.AI_SERVICE_URL}/duplicate-check`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          title: bug.title || "",
          description:
            bug.description || "",
          existingBugs:
            duplicateCandidates,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `AI duplicate service returned status ${response.status}`
      );
    }

    const duplicateResult =
      await response.json();

    if (!duplicateResult.success) {
      throw new Error(
        "Invalid response from duplicate detection service"
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Duplicate bug check completed successfully",
      bugId: bug._id,
      isDuplicate:
        duplicateResult.isDuplicate,
      matches:
        duplicateResult.matches || [],
    });
  } catch (error) {
    console.error(
      "Duplicate bug check error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to check for duplicate bugs",
      error: error.message,
    });
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  requestAIAnalysis,
  getAIAnalysis,
  checkDuplicateBug,
};
