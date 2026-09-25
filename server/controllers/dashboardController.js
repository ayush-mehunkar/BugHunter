const mongoose = require("mongoose");

const Bug = require("../models/Bug");
const Project = require("../models/Project");

const getOrganizationId = (req) => {
  return req.user?.organizationId || null;
};

// Get dashboard summary
const getDashboardSummary = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message: "User is not associated with an organization.",
      });
    }

    const [
      totalBugs,
      openBugs,
      inProgressBugs,
      resolvedBugs,
      closedBugs,
      reopenedBugs,
      totalProjects,
    ] = await Promise.all([
      Bug.countDocuments({
        organization: organizationId,
      }),
      Bug.countDocuments({
        organization: organizationId,
        status: "Open",
      }),
      Bug.countDocuments({
        organization: organizationId,
        status: "In Progress",
      }),
      Bug.countDocuments({
        organization: organizationId,
        status: "Resolved",
      }),
      Bug.countDocuments({
        organization: organizationId,
        status: "Closed",
      }),
      Bug.countDocuments({
        organization: organizationId,
        status: "Reopened",
      }),
      Project.countDocuments({
        organization: organizationId,
      }),
    ]);

    return res.status(200).json({
      success: true,
      summary: {
        totalBugs,
        openBugs,
        inProgressBugs,
        resolvedBugs,
        closedBugs,
        reopenedBugs,
        totalProjects,
      },
    });
  } catch (error) {
    console.error(
      "Get dashboard summary error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard summary",
    });
  }
};

// Get bugs grouped by status
const getBugStatusStats = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message: "User is not associated with an organization.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(403).json({
        success: false,
        message: "Invalid organization.",
      });
    }

    const organizationObjectId =
      new mongoose.Types.ObjectId(organizationId);

    const statusStats = await Bug.aggregate([
      {
        $match: {
          organization: organizationObjectId,
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      stats: statusStats,
    });
  } catch (error) {
    console.error(
      "Get bug status stats error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch bug status statistics",
    });
  }
};

// Get bugs grouped by priority
const getBugPriorityStats = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message: "User is not associated with an organization.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(403).json({
        success: false,
        message: "Invalid organization.",
      });
    }

    const organizationObjectId =
      new mongoose.Types.ObjectId(organizationId);

    const priorityStats = await Bug.aggregate([
      {
        $match: {
          organization: organizationObjectId,
        },
      },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      stats: priorityStats,
    });
  } catch (error) {
    console.error(
      "Get bug priority stats error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch bug priority statistics",
    });
  }
};

// Get project health statistics
const getProjectHealth = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message: "User is not associated with an organization.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(403).json({
        success: false,
        message: "Invalid organization.",
      });
    }

    const organizationObjectId =
      new mongoose.Types.ObjectId(organizationId);

    const projectHealth = await Bug.aggregate([
      {
        $match: {
          organization: organizationObjectId,
        },
      },
      {
        $group: {
          _id: "$project",
          totalBugs: { $sum: 1 },
          openBugs: {
            $sum: {
              $cond: [
                { $eq: ["$status", "Open"] },
                1,
                0,
              ],
            },
          },
          inProgressBugs: {
            $sum: {
              $cond: [
                { $eq: ["$status", "In Progress"] },
                1,
                0,
              ],
            },
          },
          resolvedBugs: {
            $sum: {
              $cond: [
                { $eq: ["$status", "Resolved"] },
                1,
                0,
              ],
            },
          },
          criticalBugs: {
            $sum: {
              $cond: [
                { $eq: ["$priority", "Critical"] },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $sort: {
          totalBugs: -1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      projects: projectHealth,
    });
  } catch (error) {
    console.error(
      "Get project health error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch project health statistics",
    });
  }
};

module.exports = {
  getDashboardSummary,
  getBugStatusStats,
  getBugPriorityStats,
  getProjectHealth,
};
