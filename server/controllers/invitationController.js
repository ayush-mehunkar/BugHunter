const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Invitation = require("../models/Invitation");
const Organization = require("../models/Organization");
const User = require("../models/User");

// Get organization ID from the authenticated JWT.
const getOrganizationId = (req) => {
  return req.user?.organizationId || null;
};

// Create a secure hash of an invitation token.
const hashToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

// Create an invitation.
const createInvitation = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Your account is not assigned to an organization.",
      });
    }

    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: "Email and role are required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const allowedRoles = [
      "manager",
      "developer",
      "tester",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid invitation role. Allowed roles: manager, developer, tester.",
      });
    }

    const organization = await Organization.findById(
      organizationId
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found.",
      });
    }

    if (organization.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your organization is not active.",
      });
    }

    // Do not invite an existing user.
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      if (
        String(existingUser.organization) ===
        String(organizationId)
      ) {
        return res.status(409).json({
          success: false,
          message:
            "This user is already a member of your organization.",
        });
      }

      return res.status(409).json({
        success: false,
        message:
          "A user with this email already has an account.",
      });
    }

    // Do not create duplicate pending invitations.
    const existingInvitation = await Invitation.findOne({
      organization: organizationId,
      email: normalizedEmail,
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    if (existingInvitation) {
      return res.status(409).json({
        success: false,
        message:
          "A pending invitation already exists for this email.",
      });
    }

    // Invitation expires in 48 hours.
    const expiresAt = new Date(
      Date.now() + 48 * 60 * 60 * 1000
    );

    // Generate a random raw token.
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Store only the hash in MongoDB.
    const tokenHash = hashToken(rawToken);

    const invitation = await Invitation.create({
      organization: organizationId,
      email: normalizedEmail,
      role,
      invitedBy: req.user.userId,
      tokenHash,
      expiresAt,
      status: "pending",
    });

    const response = {
      success: true,
      message: "Invitation created successfully.",
      invitation: {
        _id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
    };

    // Return the raw token only during development.
    // In production it should be delivered through email.
    if (process.env.NODE_ENV !== "production") {
      response.invitationToken = rawToken;
    }

    return res.status(201).json(response);
  } catch (error) {
    console.error(
      "Create invitation error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create invitation.",
      error: error.message,
    });
  }
};

// Get invitations for the current organization.
const getInvitations = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Your account is not assigned to an organization.",
      });
    }

    const invitations = await Invitation.find({
      organization: organizationId,
    })
      .select("-tokenHash")
      .populate("invitedBy", "name email")
      .populate("acceptedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: invitations.length,
      invitations,
    });
  } catch (error) {
    console.error(
      "Get invitations error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch invitations.",
      error: error.message,
    });
  }
};

// Cancel a pending invitation.
const cancelInvitation = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Your account is not assigned to an organization.",
      });
    }

    const invitation = await Invitation.findOne({
      _id: req.params.id,
      organization: organizationId,
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found.",
      });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message:
          "Only pending invitations can be cancelled.",
      });
    }

    invitation.status = "cancelled";

    await invitation.save();

    return res.status(200).json({
      success: true,
      message: "Invitation cancelled successfully.",
      invitationId: invitation._id,
    });
  } catch (error) {
    console.error(
      "Cancel invitation error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to cancel invitation.",
      error: error.message,
    });
  }
};

// Validate an invitation token.
const validateInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Invitation token is required.",
      });
    }

    const tokenHash = hashToken(token);

    const invitation = await Invitation.findOne({
      tokenHash,
    }).populate(
      "organization",
      "name slug plan status"
    );

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invalid invitation.",
      });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `This invitation is ${invitation.status}.`,
      });
    }

    if (invitation.expiresAt <= new Date()) {
      invitation.status = "expired";
      await invitation.save();

      return res.status(400).json({
        success: false,
        message: "This invitation has expired.",
      });
    }

    if (
      !invitation.organization ||
      invitation.organization.status !== "active"
    ) {
      return res.status(403).json({
        success: false,
        message: "This organization is not active.",
      });
    }

    return res.status(200).json({
      success: true,
      invitation: {
        _id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        organization: invitation.organization,
      },
    });
  } catch (error) {
    console.error(
      "Validate invitation error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to validate invitation.",
      error: error.message,
    });
  }
};

// Accept an invitation and create the invited user's account.
const acceptInvitation = async (req, res) => {
  try {
    const { token, name, password } = req.body;

    if (!token || !name || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Invitation token, name, and password are required.",
      });
    }

    const normalizedName = name.trim();

    if (normalizedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters long.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long.",
      });
    }

    const tokenHash = hashToken(token);

    const invitation = await Invitation.findOne({
      tokenHash,
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invalid invitation.",
      });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message:
          `This invitation is ${invitation.status}.`,
      });
    }

    if (invitation.expiresAt <= new Date()) {
      invitation.status = "expired";
      await invitation.save();

      return res.status(400).json({
        success: false,
        message: "This invitation has expired.",
      });
    }

    const organization = await Organization.findById(
      invitation.organization
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found.",
      });
    }

    if (organization.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "This organization is not active.",
      });
    }

    // Make sure the invited email has not been registered
    // since the invitation was created.
    const existingUser = await User.findOne({
      email: invitation.email,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this invitation email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    // IMPORTANT:
    // The organization and role come from the invitation,
    // never from the public request body.
    const user = await User.create({
      name: normalizedName,
      email: invitation.email,
      password: hashedPassword,
      role: invitation.role,
      organization: invitation.organization,
    });

    invitation.status = "accepted";
    invitation.acceptedBy = user._id;
    invitation.acceptedAt = new Date();

    await invitation.save();

    const tokenPayload = {
      userId: user._id,
      role: user.role,
      organizationId: user.organization,
    };

    const authToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    return res.status(201).json({
      success: true,
      message:
        "Invitation accepted and account created successfully.",
      token: authToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
      },
      organization: {
        _id: organization._id,
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan,
        status: organization.status,
      },
    });
  } catch (error) {
    console.error(
      "Accept invitation error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to accept invitation.",
      error: error.message,
    });
  }
};

module.exports = {
  createInvitation,
  getInvitations,
  cancelInvitation,
  validateInvitation,
  acceptInvitation,
};
