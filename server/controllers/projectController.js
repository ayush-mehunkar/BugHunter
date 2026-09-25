const Project = require("../models/Project");

// Get organization ID from the authenticated JWT.
const getOrganizationId = (req) => {
  return req.user?.organizationId || null;
};

// Create a new project
const createProject = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Your account is not assigned to an organization.",
      });
    }

    const { name, description, status } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Project name is required",
      });
    }

    const project = await Project.create({
      name: name.trim(),
      description: description?.trim() || "",
      status: status || "Active",
      organization: organizationId,
      createdBy: req.user?.userId || null,
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error(
      "Create project error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create project",
      error: error.message,
    });
  }
};

// Get all projects
const getProjects = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Your account is not assigned to an organization.",
      });
    }

    const projects = await Project.find({
      organization: organizationId,
    })
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error(
      "Get projects error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
      error: error.message,
    });
  }
};

// Get one project by ID
const getProjectById = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Your account is not assigned to an organization.",
      });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      organization: organizationId,
    }).populate(
      "createdBy",
      "name email role"
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error(
      "Get project by ID error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch project",
      error: error.message,
    });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
};
