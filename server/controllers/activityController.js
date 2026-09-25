const Activity = require("../models/Activity");
const Bug = require("../models/Bug");

// Create an activity
const createActivity = async (req, res) => {
  try {
    const { bugId } = req.params;
    const { action, description } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Your account is not assigned to an organization.",
      });
    }

    if (!action || !description) {
      return res.status(400).json({
        success: false,
        message: "Action and description are required",
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

    const activity = await Activity.create({
      bug: bug._id,
      user: req.user.userId,
      action,
      description,
    });

    const populatedActivity = await Activity.findById(
      activity._id
    ).populate("user", "name email role");

    res.status(201).json({
      success: true,
      message: "Activity created successfully",
      activity: populatedActivity,
    });
  } catch (error) {
    console.error("Create activity error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to create activity",
      error: error.message,
    });
  }
};

// Get activities for a bug
const getActivities = async (req, res) => {
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

    const activities = await Activity.find({
      bug: bug._id,
    })
      .populate("user", "name email role")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error("Get activities error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch activities",
      error: error.message,
    });
  }
};

module.exports = {
  createActivity,
  getActivities,
};
