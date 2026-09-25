const Bug = require("../models/Bug");
const User = require("../models/User");
const Activity = require("../models/Activity");
const { createNotification } = require("../services/notificationService");

const ALLOWED_STATUSES = [
  "Open",
  "In Progress",
  "Resolved",
  "Closed",
  "Reopened",
];

const ALLOWED_PRIORITIES = [
  "Low",
  "Medium",
  "High",
  "Critical",
];

const ALLOWED_SEVERITIES = [
  "Minor",
  "Major",
  "Critical",
  "Blocker",
];

// Get the organization ID from the authenticated JWT.
const getOrganizationId = (req) => {
  return req.user?.organizationId || null;
};

// Create a new bug
const createBug = async (req, res) => {
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
      priority,
      severity,
      environment,
      stepsToReproduce,
      expectedResult,
      actualResult,
      tags,
    } = req.body;

    if (!title || !description || !project) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and project are required",
      });
    }

    if (
      priority !== undefined &&
      priority !== "" &&
      !ALLOWED_PRIORITIES.includes(priority)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority value",
      });
    }

    if (
      severity !== undefined &&
      severity !== "" &&
      !ALLOWED_SEVERITIES.includes(severity)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid severity value",
      });
    }

    const tagArray =
      typeof tags === "string"
        ? tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag !== "")
        : Array.isArray(tags)
        ? tags
            .map((tag) => String(tag).trim())
            .filter((tag) => tag !== "")
        : [];

    const bug = await Bug.create({
      title: title.trim(),
      description: description.trim(),
      project: project.trim(),
      organization: organizationId,
      reportedBy: req.user?.userId || null,
      priority: priority || "Low",
      severity: severity || "Minor",
      environment: environment?.trim() || "",
      stepsToReproduce: stepsToReproduce?.trim() || "",
      expectedResult: expectedResult?.trim() || "",
      actualResult: actualResult?.trim() || "",
      tags: tagArray,
    });

    // Record bug creation in the activity history.
    try {
      if (req.user?.userId) {
        await Activity.create({
          bug: bug._id,
          user: req.user.userId,
          action: "Bug Created",
          description: `Bug "${bug.title}" was created`,
        });
      }
    } catch (activityError) {
      console.error(
        "Create bug activity error:",
        activityError.message
      );
    }

    return res.status(201).json({
      success: true,
      message: "Bug created successfully",
      bug,
    });
  } catch (error) {
    console.error("Create bug error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create bug",
      error: error.message,
    });
  }
};

// Get bugs with filters
const getBugs = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Your account is not assigned to an organization.",
      });
    }

    const { status, priority, severity } = req.query;

    const filter = {
      organization: organizationId,
    };

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (severity) {
      filter.severity = severity;
    }

    const bugs = await Bug.find(filter).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: bugs.length,
      bugs,
    });
  } catch (error) {
    console.error("Get bugs error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch bugs",
      error: error.message,
    });
  }
};

// Get a single bug by ID
const getBugById = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Your account is not assigned to an organization.",
      });
    }

    const bug = await Bug.findOne({
      _id: req.params.id,
      organization: organizationId,
    });

    if (!bug) {
      return res.status(404).json({
        success: false,
        message: "Bug not found",
      });
    }

    return res.status(200).json({
      success: true,
      bug,
    });
  } catch (error) {
    console.error("Get bug by ID error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch bug",
      error: error.message,
    });
  }
};

// Update a bug
const updateBug = async (req, res) => {
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
      status,
      priority,
      severity,
      assignedTo,
    } = req.body;

    const currentRole = req.user?.role;

    // Get the existing bug only inside the user's organization.
    const existingBug = await Bug.findOne({
      _id: req.params.id,
      organization: organizationId,
    });

    if (!existingBug) {
      return res.status(404).json({
        success: false,
        message: "Bug not found",
      });
    }

    const updateData = {};

    // ---------------------------------------------------------
    // STATUS
    // ---------------------------------------------------------

    if (status !== undefined) {
      if (
        currentRole !== "admin" &&
        currentRole !== "manager" &&
        currentRole !== "developer"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. You cannot change bug status.",
        });
      }

      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value",
        });
      }

      updateData.status = status;
    }

    // ---------------------------------------------------------
    // PRIORITY
    // ---------------------------------------------------------

    if (priority !== undefined) {
      if (!ALLOWED_PRIORITIES.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: "Invalid priority value",
        });
      }

      updateData.priority = priority;
    }

    // ---------------------------------------------------------
    // SEVERITY
    // ---------------------------------------------------------

    if (severity !== undefined) {
      if (!ALLOWED_SEVERITIES.includes(severity)) {
        return res.status(400).json({
          success: false,
          message: "Invalid severity value",
        });
      }

      updateData.severity = severity;
    }

    // ---------------------------------------------------------
    // ASSIGNMENT
    // ---------------------------------------------------------

    if (assignedTo !== undefined) {
      if (
        currentRole !== "admin" &&
        currentRole !== "manager"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. You cannot assign bugs.",
        });
      }

      // Empty value means unassign.
      if (!assignedTo) {
        updateData.assignedTo = null;
      } else {
        // The assigned user MUST belong to the same organization.
        const assignedUser = await User.findOne({
          _id: assignedTo,
          organization: organizationId,
        });

        if (!assignedUser) {
          return res.status(400).json({
            success: false,
            message:
              "Assigned user not found in your organization",
          });
        }

        updateData.assignedTo = assignedTo;
      }
    }

    // Prevent meaningless empty update requests.
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No valid bug changes were provided",
      });
    }

    const bug = await Bug.findOneAndUpdate(
      {
        _id: req.params.id,
        organization: organizationId,
      },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!bug) {
      return res.status(404).json({
        success: false,
        message: "Bug not found",
      });
    }

    // ---------------------------------------------------------
    // STATUS ACTIVITY
    // ---------------------------------------------------------

    if (
      status !== undefined &&
      existingBug.status !== bug.status
    ) {
      try {
        await Activity.create({
          bug: bug._id,
          user: req.user.userId,
          action: "Status Changed",
          description: `Bug status changed from ${existingBug.status} to ${bug.status}`,
        });
      } catch (activityError) {
        console.error(
          "Create status activity error:",
          activityError.message
        );
      }
    }

    // ---------------------------------------------------------
    // PRIORITY ACTIVITY
    // ---------------------------------------------------------

    if (
      priority !== undefined &&
      existingBug.priority !== bug.priority
    ) {
      try {
        await Activity.create({
          bug: bug._id,
          user: req.user.userId,
          action: "Priority Changed",
          description: `Bug priority changed from ${existingBug.priority} to ${bug.priority}`,
        });
      } catch (activityError) {
        console.error(
          "Create priority activity error:",
          activityError.message
        );
      }
    }

    // ---------------------------------------------------------
    // SEVERITY ACTIVITY
    // ---------------------------------------------------------

    if (
      severity !== undefined &&
      existingBug.severity !== bug.severity
    ) {
      try {
        await Activity.create({
          bug: bug._id,
          user: req.user.userId,
          action: "Severity Changed",
          description: `Bug severity changed from ${existingBug.severity} to ${bug.severity}`,
        });
      } catch (activityError) {
        console.error(
          "Create severity activity error:",
          activityError.message
        );
      }
    }

    // ---------------------------------------------------------
    // ASSIGNMENT ACTIVITY + NOTIFICATION
    // ---------------------------------------------------------

    if (
      assignedTo !== undefined &&
      String(existingBug.assignedTo || "") !==
        String(bug.assignedTo || "")
    ) {
      try {
        let oldAssignment = "Unassigned";
        let newAssignment = "Unassigned";
        let assignedUser = null;

        if (existingBug.assignedTo) {
          const oldUser = await User.findOne({
            _id: existingBug.assignedTo,
            organization: organizationId,
          });

          if (oldUser) {
            oldAssignment = oldUser.name;
          }
        }

        if (bug.assignedTo) {
          assignedUser = await User.findOne({
            _id: bug.assignedTo,
            organization: organizationId,
          });

          if (assignedUser) {
            newAssignment = assignedUser.name;
          }
        }

        await Activity.create({
          bug: bug._id,
          user: req.user.userId,
          action: "Assignment Changed",
          description: `Bug assigned from ${oldAssignment} to ${newAssignment}`,
        });

        // Notify the newly assigned user.
        // Do not notify when the bug is being unassigned.
        // Do not notify the actor if they assign the bug to themselves.
        if (
          assignedUser &&
          String(assignedUser._id) !== String(req.user.userId)
        ) {
          await createNotification({
            recipient: assignedUser._id,
            organization: organizationId,
            type: "bug_assigned",
            title: "Bug assigned to you",
            message: `You were assigned bug "${bug.title}".`,
            bug: bug._id,
          });
        }
      } catch (assignmentError) {
        console.error(
          "Create assignment activity/notification error:",
          assignmentError.message
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Bug updated successfully",
      bug,
    });
  } catch (error) {
    console.error("Update bug error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update bug",
      error: error.message,
    });
  }
};

// Search bugs
const searchBugs = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Your account is not assigned to an organization.",
      });
    }

    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const searchTerm = q.trim();

    const bugs = await Bug.find({
      organization: organizationId,
      $or: [
        {
          title: {
            $regex: searchTerm,
            $options: "i",
          },
        },
        {
          description: {
            $regex: searchTerm,
            $options: "i",
          },
        },
        {
          project: {
            $regex: searchTerm,
            $options: "i",
          },
        },
        {
          category: {
            $regex: searchTerm,
            $options: "i",
          },
        },
        {
          tags: {
            $regex: searchTerm,
            $options: "i",
          },
        },
      ],
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: bugs.length,
      bugs,
    });
  } catch (error) {
    console.error("Search bugs error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to search bugs",
      error: error.message,
    });
  }
};

module.exports = {
  createBug,
  getBugs,
  getBugById,
  updateBug,
  searchBugs,
};
