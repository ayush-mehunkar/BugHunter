const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "bug_assigned",
        "bug_status_changed",
        "bug_priority_changed",
        "bug_severity_changed",
        "bug_commented",
        "test_execution_failed",
        "invitation_created",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    bug: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bug",
      default: null,
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, organization: 1, read: 1 });
notificationSchema.index({ recipient: 1, organization: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
