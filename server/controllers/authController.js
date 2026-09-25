const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const Organization = require("../models/Organization");

// Register a new organization owner.
const registerUser = async (req, res) => {
  try {
    const { name, email, password, organizationName } =
      req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must contain at least 2 characters",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const finalOrganizationName =
      typeof organizationName === "string" &&
      organizationName.trim()
        ? organizationName.trim()
        : `${name.trim()}'s Organization`;

    if (finalOrganizationName.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Organization name must contain at least 2 characters",
      });
    }

    if (finalOrganizationName.length > 100) {
      return res.status(400).json({
        success: false,
        message:
          "Organization name cannot exceed 100 characters",
      });
    }

    const slugBase = finalOrganizationName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!slugBase) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid organization name",
      });
    }

    let slug = slugBase;
    let slugExists = await Organization.findOne({ slug });
    let suffix = 2;

    while (slugExists) {
      slug = `${slugBase}-${suffix}`;
      suffix += 1;

      slugExists = await Organization.findOne({ slug });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const organization = await Organization.create({
      name: finalOrganizationName,
      slug,
      owner: null,
      plan: "free",
      status: "active",
    });

    try {
      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "admin",
        organization: organization._id,
      });

      organization.owner = user._id;
      await organization.save();

      const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        organization: user.organization,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return res.status(201).json({
        success: true,
        message: "Organization and user registered successfully",
        user: userResponse,
        organization: {
          _id: organization._id,
          name: organization.name,
          slug: organization.slug,
          plan: organization.plan,
          status: organization.status,
        },
      });
    } catch (userCreationError) {
      await Organization.deleteOne({
        _id: organization._id,
      });

      throw userCreationError;
    }
  } catch (error) {
    console.error(
      "Register user error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to register user",
      error: error.message,
    });
  }
};

// Login user.
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const tokenPayload = {
      userId: user._id,
      role: user.role,
      organizationId: user.organization || null,
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      organization: user.organization,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error(
      "Login user error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to login",
      error: error.message,
    });
  }
};

// Request a password reset.
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Do not reveal whether an email exists.
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists for this email, a password reset link has been generated.",
      });
    }

    const rawResetToken = crypto.randomBytes(32).toString("hex");

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(rawResetToken)
      .digest("hex");

    const resetExpiresAt = new Date(
      Date.now() + 30 * 60 * 1000
    );

    user.passwordResetTokenHash = resetTokenHash;
    user.passwordResetExpiresAt = resetExpiresAt;

    await user.save();

    const frontendUrl =
      process.env.CLIENT_URL || "http://localhost:5173";

    const resetUrl =
      `${frontendUrl}/reset-password/${rawResetToken}`;

    const response = {
      success: true,
      message:
        "If an account exists for this email, a password reset link has been generated.",
      expiresAt: resetExpiresAt,
    };

    if (process.env.NODE_ENV !== "production") {
      response.resetUrl = resetUrl;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error(
      "Forgot password error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to process password reset request",
    });
  }
};

// Reset password using a valid reset token.
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        success: false,
        message: "Reset token is required",
      });
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters",
      });
    }

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetTokenHash: resetTokenHash,
      passwordResetExpiresAt: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset token",
      });
    }

    user.password = await bcrypt.hash(password, 10);

    // Invalidate the token immediately after successful use.
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Password reset successful. You can now log in with your new password.",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
};
