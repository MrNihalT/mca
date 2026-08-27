const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", requireAuth, authController.getMe);
router.post("/logout", authController.logout);
router.put("/profile", requireAuth, upload.single("avatar"), authController.updateProfile);

module.exports = router;
