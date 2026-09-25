const express = require("express");

const {
  uploadAttachments,
  getAttachments,
  deleteAttachment,
} = require("../controllers/attachmentController");

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Upload up to 5 attachments to a bug.
router.post(
  "/bugs/:bugId/attachments",
  protect,
  upload.array("attachments", 5),
  uploadAttachments
);

// Get attachments for a bug.
router.get(
  "/bugs/:bugId/attachments",
  protect,
  getAttachments
);

// Delete a specific attachment from a bug.
router.delete(
  "/bugs/:bugId/attachments/:attachmentId",
  protect,
  deleteAttachment
);

module.exports = router;
