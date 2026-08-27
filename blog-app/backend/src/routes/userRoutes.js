const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { requireAuth } = require("../middleware/authMiddleware");
const { restrictTo } = require("../middleware/roleMiddleware");

// All routes here are restricted to ADMIN role only
router.use(requireAuth, restrictTo("ADMIN"));

router.get("/", userController.getAllUsers);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

module.exports = router;
