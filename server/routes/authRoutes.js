const express = require("express");

const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Forgot password
router.post("/forgot-password", forgotPassword);

// Reset password
router.post("/reset-password", resetPassword);

// JWT protected route
router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Authentication successful",
    user: req.user,
  });
});

// Developer-only test route
router.get(
  "/developer-test",
  protect,
  authorize("developer", "admin"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Developer role authorization successful",
      user: req.user,
    });
  }
);

module.exports = router;
