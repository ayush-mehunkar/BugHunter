const Comment = require("../models/Comment");
const Bug = require("../models/Bug");

// Create a comment
const createComment = async (req, res) => {
  try {
    const { text } = req.body;
    const { bugId } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Your account is not assigned to an organization.",
      });
    }

    if (!text || text.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
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

    const comment = await Comment.create({
      bug: bug._id,
      user: req.user.userId,
      text: text.trim(),
    });

    const populatedComment = await Comment.findById(
      comment._id
    ).populate("user", "name email role");

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: populatedComment,
    });
  } catch (error) {
    console.error("Create comment error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to add comment",
      error: error.message,
    });
  }
};

// Get comments for a bug
const getComments = async (req, res) => {
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

    const comments = await Comment.find({
      bug: bug._id,
    })
      .populate("user", "name email role")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    console.error("Get comments error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch comments",
      error: error.message,
    });
  }
};

// Delete a comment
const deleteComment = async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Your account is not assigned to an organization.",
      });
    }

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Verify that the comment belongs to a bug
    // inside the authenticated user's organization.
    const bug = await Bug.findOne({
      _id: comment.bug,
      organization: organizationId,
    });

    if (!bug) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const currentUserId = req.user.userId?.toString();
    const commentUserId = comment.user?.toString();

    const isOwner = currentUserId === commentUserId;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You cannot delete this comment.",
      });
    }

    await Comment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Delete comment error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to delete comment",
      error: error.message,
    });
  }
};

module.exports = {
  createComment,
  getComments,
  deleteComment,
};
