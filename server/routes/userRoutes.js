const express = require("express");

const {
getUsers,
getUserById,
updateUser,
deleteUser,
} = require("../controllers/userController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Get all users - protected
router.get("/", protect, getUsers);

// Get user by ID - protected
router.get("/:id", protect, getUserById);

// Update user - protected, admin permission checked in controller
router.put("/:id", protect, updateUser);

// Delete user - protected, admin permission checked in controller
router.delete("/:id", protect, deleteUser);

module.exports = router;
