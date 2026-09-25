const TestExecution = require("../models/TestExecution");
const TestCase = require("../models/TestCase");
const Bug = require("../models/Bug");

const ALLOWED_RESULTS = [
  "Pass",
  "Fail",
  "Blocked",
];

// Get organization ID from the authenticated JWT.
const getOrganizationId = (req) => {
  return req.user?.organizationId || null;
};

const createTestExecution = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Your account is not assigned to an organization.",
      });
    }

    const {
      testCase,
      result,
      notes,
      environment,
      actualResult,
      defectBug,
    } = req.body;

    if (!testCase) {
      return res.status(400).json({
        success: false,
        message: "Test case is required.",
      });
    }

    if (!result) {
      return res.status(400).json({
        success: false,
        message: "Execution result is required.",
      });
    }

    if (!ALLOWED_RESULTS.includes(result)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid execution result. Allowed values: Pass, Fail, Blocked.",
      });
    }

    const existingTestCase = await TestCase.findOne({
      _id: testCase,
      organization: organizationId,
    });

    if (!existingTestCase) {
      return res.status(404).json({
        success: false,
        message: "Test case not found.",
      });
    }

    let linkedBug = null;

    if (defectBug) {
      linkedBug = await Bug.findOne({
        _id: defectBug,
        organization: organizationId,
      });

      if (!linkedBug) {
        return res.status(404).json({
          success: false,
          message: "Linked bug not found.",
        });
      }
    }

    const execution = await TestExecution.create({
      testCase,
      organization: organizationId,
      executedBy: req.user?.userId || null,
      result,
      notes: notes?.trim() || "",
      environment: environment?.trim() || "",
      actualResult: actualResult?.trim() || "",
      defectBug: linkedBug?._id || null,
    });

    const populatedExecution =
      await TestExecution.findOne({
        _id: execution._id,
        organization: organizationId,
      })
        .populate("testCase", "title project")
        .populate(
          "executedBy",
          "name email role"
        )
        .populate(
          "defectBug",
          "title status priority severity"
        );

    return res.status(201).json({
      success: true,
      message: "Test execution recorded successfully.",
      execution: populatedExecution,
    });
  } catch (error) {
    console.error(
      "Create test execution error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to record test execution.",
    });
  }
};

const getTestExecutions = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Your account is not assigned to an organization.",
      });
    }

    const {
      testCase,
      result,
      defectBug,
    } = req.query;

    const filter = {
      organization: organizationId,
    };

    if (testCase) {
      const existingTestCase = await TestCase.findOne({
        _id: testCase,
        organization: organizationId,
      });

      if (!existingTestCase) {
        return res.status(404).json({
          success: false,
          message: "Test case not found.",
        });
      }

      filter.testCase = testCase;
    }

    if (result) {
      if (!ALLOWED_RESULTS.includes(result)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid execution result. Allowed values: Pass, Fail, Blocked.",
        });
      }

      filter.result = result;
    }

    if (defectBug) {
      const existingBug = await Bug.findOne({
        _id: defectBug,
        organization: organizationId,
      });

      if (!existingBug) {
        return res.status(404).json({
          success: false,
          message: "Bug not found.",
        });
      }

      filter.defectBug = defectBug;
    }

    const executions = await TestExecution.find(filter)
      .populate("testCase", "title project")
      .populate(
        "executedBy",
        "name email role"
      )
      .populate(
        "defectBug",
        "title status priority severity"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: executions.length,
      executions,
    });
  } catch (error) {
    console.error(
      "Get test executions error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch test executions.",
    });
  }
};

const getTestExecutionById = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Your account is not assigned to an organization.",
      });
    }

    const execution =
      await TestExecution.findOne({
        _id: req.params.id,
        organization: organizationId,
      })
        .populate("testCase", "title project")
        .populate(
          "executedBy",
          "name email role"
        )
        .populate(
          "defectBug",
          "title status priority severity"
        );

    if (!execution) {
      return res.status(404).json({
        success: false,
        message: "Test execution not found.",
      });
    }

    return res.status(200).json({
      success: true,
      execution,
    });
  } catch (error) {
    console.error(
      "Get test execution by ID error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch test execution.",
    });
  }
};

const deleteTestExecution = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Your account is not assigned to an organization.",
      });
    }

    const execution =
      await TestExecution.findOne({
        _id: req.params.id,
        organization: organizationId,
      });

    if (!execution) {
      return res.status(404).json({
        success: false,
        message: "Test execution not found.",
      });
    }

    await TestExecution.deleteOne({
      _id: req.params.id,
      organization: organizationId,
    });

    return res.status(200).json({
      success: true,
      message: "Test execution deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete test execution error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete test execution.",
    });
  }
};

module.exports = {
  createTestExecution,
  getTestExecutions,
  getTestExecutionById,
  deleteTestExecution,
};
