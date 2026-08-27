const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const { requireAuth, optionalAuth } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.get("/", optionalAuth, postController.getAllPosts);
router.get("/categories", postController.getCategories);
router.get("/:slug", optionalAuth, postController.getPostBySlug);

router.post("/", requireAuth, upload.single("image"), postController.createPost);
router.put("/:id", requireAuth, upload.single("image"), postController.updatePost);
router.delete("/:id", requireAuth, postController.deletePost);

router.post("/:id/like", requireAuth, postController.toggleLikePost);
router.post("/:id/save", requireAuth, postController.toggleSavePost);

module.exports = router;
