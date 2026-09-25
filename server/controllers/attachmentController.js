const fs = require("fs");
const path = require("path");

const Bug = require("../models/Bug");
const Activity = require("../models/Activity");

const uploadsDirectory = path.join(__dirname, "../uploads");

// Get organization ID from the authenticated JWT.
const getOrganizationId = (req) => {
  return req.user?.organizationId || null;
};

const getAttachmentUrl = (req, filename) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return `${baseUrl}/api/uploads/${encodeURIComponent(
    filename
  )}`;
};

// Upload attachments to a bug
const uploadAttachments = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      if (req.files?.length) {
        req.files.forEach((file) => {
          fs.unlink(
            path.join(uploadsDirectory, file.filename),
            () => {}
          );
        });
      }

      return res.status(403).json({
        success: false,
        message:
          "Access denied. Your account is not assigned to an organization.",
      });
    }

    const { bugId } = req.params;

    const bug = await Bug.findOne({
      _id: bugId,
      organization: organizationId,
    });

    if (!bug) {
      if (req.files?.length) {
        req.files.forEach((file) => {
          fs.unlink(
            path.join(uploadsDirectory, file.filename),
            () => {}
          );
        });
      }

      return res.status(404).json({
        success: false,
        message: "Bug not found",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files were uploaded",
      });
    }

    const attachments = req.files.map((file) => ({
      url: getAttachmentUrl(req, file.filename),
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
    }));

    bug.attachments.push(...attachments);

    await bug.save();

    try {
      if (req.user?.userId) {
        await Activity.create({
          bug: bug._id,
          user: req.user.userId,
          action: "Attachment Added",
          description: `${req.files.length} attachment${
            req.files.length > 1 ? "s" : ""
          } added to bug "${bug.title}"`,
        });
      }
    } catch (activityError) {
      console.error(
        "Create attachment activity error:",
        activityError.message
      );
    }

    return res.status(201).json({
      success: true,
      message: "Attachments uploaded successfully",
      attachments,
      bug,
    });
  } catch (error) {
    console.error(
      "Upload attachments error:",
      error.message
    );

    if (req.files?.length) {
      req.files.forEach((file) => {
        fs.unlink(
          path.join(uploadsDirectory, file.filename),
          () => {}
        );
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to upload attachments",
      error: error.message,
    });
  }
};

// Get attachments for a bug
const getAttachments = async (req, res) => {
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
      _id: req.params.bugId,
      organization: organizationId,
    }).select("title attachments");

    if (!bug) {
      return res.status(404).json({
        success: false,
        message: "Bug not found",
      });
    }

    return res.status(200).json({
      success: true,
      count: bug.attachments.length,
      attachments: bug.attachments,
    });
  } catch (error) {
    console.error(
      "Get attachments error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch attachments",
      error: error.message,
    });
  }
};

// Delete an attachment from a bug
const deleteAttachment = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Your account is not assigned to an organization.",
      });
    }

    const { bugId, attachmentId } = req.params;

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

    const attachment = bug.attachments.id(attachmentId);

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: "Attachment not found",
      });
    }

    const originalName = attachment.originalName;
    const storedName = attachment.storedName;

    // Remove the attachment from MongoDB.
    attachment.deleteOne();

    await bug.save();

    // Remove the physical file from the server.
    if (storedName) {
      const filePath = path.join(
        uploadsDirectory,
        storedName
      );

      try {
        await fs.promises.unlink(filePath);
      } catch (fileError) {
        if (fileError.code !== "ENOENT") {
          console.error(
            "Delete physical attachment file error:",
            fileError.message
          );
        }
      }
    }

    // Record the deletion in activity history.
    try {
      if (req.user?.userId) {
        await Activity.create({
          bug: bug._id,
          user: req.user.userId,
          action: "Attachment Deleted",
          description: `Attachment "${originalName}" was deleted from bug "${bug.title}"`,
        });
      }
    } catch (activityError) {
      console.error(
        "Create attachment deletion activity error:",
        activityError.message
      );
    }

    return res.status(200).json({
      success: true,
      message: "Attachment deleted successfully",
      attachmentId,
    });
  } catch (error) {
    console.error(
      "Delete attachment error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete attachment",
      error: error.message,
    });
  }
};

module.exports = {
  uploadAttachments,
  getAttachments,
  deleteAttachment,
};
