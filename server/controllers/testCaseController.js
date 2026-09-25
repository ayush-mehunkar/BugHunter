const TestCase = require("../models/TestCase");

// Allowed values
const ALLOWED_PRIORITIES = [
  "Low",
  "Medium",
  "High",
  "Critical",
];

const ALLOWED_STATUSES = [
  "Draft",
  "Ready",
  "Deprecated",
];

// Get organization ID from the authenticated JWT.
const getOrganizationId = (req) => {
  return req.user?.organizationId || null;
};

// Create a test case
const createTestCase = async (req, res) => {
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
      title,
      description,
      project,
      preconditions,
      steps,
      expectedResult,
      priority,
      status,
      tags,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Test case title is required",
      });
    }

    if (!project || !project.trim()) {
      return res.status(400).json({
        success: false,
        message: "Project is required",
      });
    }

    if (!steps || !steps.trim()) {
      return res.status(400).json({
        success: false,
        message: "Test steps are required",
      });
    }

    if (!expectedResult || !expectedResult.trim()) {
      return res.status(400).json({
        success: false,
        message: "Expected result is required",
      });
    }

    if (
      priority &&
      !ALLOWED_PRIORITIES.includes(priority)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid test case priority",
      });
    }

    if (
      status &&
      !ALLOWED_STATUSES.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid test case status",
      });
    }

    const normalizedTags = Array.isArray(tags)
      ? tags
          .map((tag) => String(tag).trim())
          .filter(Boolean)
      : [];

    const testCase = await TestCase.create({
      title: title.trim(),
      description: description?.trim() || "",
      project: project.trim(),
      organization: organizationId,
      preconditions: preconditions?.trim() || "",
      steps: steps.trim(),
      expectedResult: expectedResult.trim(),
      priority: priority || "Medium",
      status: status || "Draft",
      createdBy: req.user?.userId || null,
      tags: normalizedTags,
    });

    return res.status(201).json({
      success: true,
      message: "Test case created successfully",
      testCase,
    });
  } catch (error) {
    console.error(
      "Create test case error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create test case",
      error: error.message,
    });
  }
};

// Get all test cases
const getTestCases = async (req, res) => {
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
      project,
      priority,
      status,
      search,
    } = req.query;

    const filter = {
      organization: organizationId,
    };

    if (project) {
      filter.project = project.trim();
    }

    if (priority) {
      if (!ALLOWED_PRIORITIES.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: "Invalid test case priority",
        });
      }

      filter.priority = priority;
    }

    if (status) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid test case status",
        });
      }

      filter.status = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(
        search.trim(),
        "i"
      );

      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { steps: searchRegex },
        { expectedResult: searchRegex },
        { tags: searchRegex },
      ];
    }

    const testCases = await TestCase.find(filter)
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: testCases.length,
      testCases,
    });
  } catch (error) {
    console.error(
      "Get test cases error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch test cases",
      error: error.message,
    });
  }
};

// Get one test case
const getTestCaseById = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Your account is not assigned to an organization.",
      });
    }

    const testCase = await TestCase.findOne({
      _id: req.params.id,
      organization: organizationId,
    }).populate(
      "createdBy",
      "name email role"
    );

    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: "Test case not found",
      });
    }

    return res.status(200).json({
      success: true,
      testCase,
    });
  } catch (error) {
    console.error(
      "Get test case error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch test case",
      error: error.message,
    });
  }
};

// Update a test case
const updateTestCase = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Your account is not assigned to an organization.",
      });
    }

    const testCase =
      await TestCase.findOne({
        _id: req.params.id,
        organization: organizationId,
      });

    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: "Test case not found",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "project",
      "preconditions",
      "steps",
      "expectedResult",
      "priority",
      "status",
      "tags",
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (
        Object.prototype.hasOwnProperty.call(
          req.body,
          field
        )
      ) {
        updates[field] = req.body[field];
      }
    });

    if (updates.title !== undefined) {
      if (
        !String(updates.title).trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Test case title cannot be empty",
        });
      }

      updates.title =
        String(updates.title).trim();
    }

    if (updates.project !== undefined) {
      if (
        !String(updates.project).trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Project cannot be empty",
        });
      }

      updates.project =
        String(updates.project).trim();
    }

    if (updates.steps !== undefined) {
      if (!String(updates.steps).trim()) {
        return res.status(400).json({
          success: false,
          message: "Test steps cannot be empty",
        });
      }

      updates.steps =
        String(updates.steps).trim();
    }

    if (
      updates.expectedResult !== undefined
    ) {
      if (
        !String(
          updates.expectedResult
        ).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Expected result cannot be empty",
        });
      }

      updates.expectedResult =
        String(
          updates.expectedResult
        ).trim();
    }

    if (
      updates.description !== undefined
    ) {
      updates.description =
        String(
          updates.description
        ).trim();
    }

    if (
      updates.preconditions !== undefined
    ) {
      updates.preconditions =
        String(
          updates.preconditions
        ).trim();
    }

    if (updates.priority !== undefined) {
      if (
        !ALLOWED_PRIORITIES.includes(
          updates.priority
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid test case priority",
        });
      }
    }

    if (updates.status !== undefined) {
      if (
        !ALLOWED_STATUSES.includes(
          updates.status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid test case status",
        });
      }
    }

    if (updates.tags !== undefined) {
      updates.tags = Array.isArray(
        updates.tags
      )
        ? updates.tags
            .map((tag) =>
              String(tag).trim()
            )
            .filter(Boolean)
        : [];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No valid test case changes were provided",
      });
    }

    Object.assign(testCase, updates);

    await testCase.save();

    return res.status(200).json({
      success: true,
      message: "Test case updated successfully",
      testCase,
    });
  } catch (error) {
    console.error(
      "Update test case error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update test case",
      error: error.message,
    });
  }
};

// Delete a test case
const deleteTestCase = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Your account is not assigned to an organization.",
      });
    }

    const testCase =
      await TestCase.findOne({
        _id: req.params.id,
        organization: organizationId,
      });

    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: "Test case not found",
      });
    }

    await testCase.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Test case deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete test case error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete test case",
      error: error.message,
    });
  }
};

module.exports = {
  createTestCase,
  getTestCases,
  getTestCaseById,
  updateTestCase,
  deleteTestCase,
};
