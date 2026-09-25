const express = require("express");

const {
  createInvitation,
  getInvitations,
  cancelInvitation,
  validateInvitation,
  acceptInvitation,
} = require("../controllers/invitationController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("admin", "manager"),
  createInvitation
);

router.get(
  "/",
  protect,
  authorize("admin", "manager"),
  getInvitations
);

router.delete(
  "/:id",
  protect,
  authorize("admin", "manager"),
  cancelInvitation
);

router.get(
  "/validate/:token",
  validateInvitation
);

router.post(
  "/accept",
  acceptInvitation
);

module.exports = router;
