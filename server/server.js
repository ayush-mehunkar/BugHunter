require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const bugRoutes = require("./routes/bugRoutes");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const authRoutes = require("./routes/authRoutes");
const commentRoutes = require("./routes/commentRoutes");
const activityRoutes = require("./routes/activityRoutes");
const aiRoutes = require("./routes/aiRoutes");
const aiReviewRoutes = require("./routes/aiReviewRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const attachmentRoutes = require("./routes/attachmentRoutes");
const testCaseRoutes = require("./routes/testCaseRoutes");
const testExecutionRoutes = require("./routes/testExecutionRoutes");
const invitationRoutes = require("./routes/invitationRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded attachments.
app.use("/api/uploads", express.static("uploads"));

// Health check.
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "BugHunter API is running",
  });
});

// Bug routes.
app.use("/api/bugs", bugRoutes);

// User routes.
app.use("/api/users", userRoutes);

// Project routes.
app.use("/api/projects", projectRoutes);

// Authentication routes.
app.use("/api/auth", authRoutes);

// Comment routes.
app.use("/api", commentRoutes);

// Activity routes.
app.use("/api", activityRoutes);

// AI routes.
app.use("/api/ai", aiRoutes);

// AI Review routes.
app.use("/api/ai-reviews", aiReviewRoutes);

// Dashboard routes.
app.use("/api/dashboard", dashboardRoutes);

// Attachment routes.
app.use("/api", attachmentRoutes);

// Test case routes.
app.use("/api/test-cases", testCaseRoutes);

// Test execution routes.
app.use("/api/test-executions", testExecutionRoutes);

// Invitation routes.
app.use("/api/invitations", invitationRoutes);

// Notification routes.
app.use("/api/notifications", notificationRoutes);

const startServer = async () => {
  await connectDB();

  const PORT = process.env.PORT || 5001;

  app.listen(PORT, () => {
    console.log(
      `BugHunter backend running on port ${PORT}`
    );
  });
};

// Start the server only when this file is executed directly.
if (require.main === module) {
  startServer();
}

// Export the Express app for Jest/Supertest.
module.exports = app;
