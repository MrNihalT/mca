const db = require("../config/db");

// 1. Create a comment
exports.createComment = async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
        return res.status(400).json({ error: "Comment content cannot be empty." });
    }

    try {
        // Check if post exists
        const [posts] = await db.query("SELECT id FROM posts WHERE id = ?", [postId]);
        if (posts.length === 0) {
            return res.status(404).json({ error: "Post not found." });
        }

        // Insert comment
        const [result] = await db.query(
            "INSERT INTO comments (content, user_id, post_id) VALUES (?, ?, ?)",
            [content, userId, postId]
        );

        const newCommentId = result.insertId;

        // Fetch newly created comment with user details
        const [comments] = await db.query(
            `SELECT c.*, u.name as user_name, u.email as user_email, u.role as user_role
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.id = ?`,
            [newCommentId]
        );

        res.status(201).json({
            message: "Comment added successfully",
            comment: comments[0]
        });
    } catch (err) {
        console.error("Create comment error:", err);
        res.status(500).json({ error: "Server error adding comment." });
    }
};

// 2. Delete a comment
exports.deleteComment = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // Fetch comment to check ownership
        const [comments] = await db.query("SELECT * FROM comments WHERE id = ?", [id]);
        if (comments.length === 0) {
            return res.status(404).json({ error: "Comment not found." });
        }

        const comment = comments[0];

        // Authorization check: USER can only delete their own comment. STAFF/ADMIN can delete any comment.
        if (userRole === "USER" && comment.user_id !== userId) {
            return res.status(403).json({ error: "Forbidden. You can only delete your own comments." });
        }

        await db.query("DELETE FROM comments WHERE id = ?", [id]);

        res.status(200).json({ message: "Comment deleted successfully" });
    } catch (err) {
        console.error("Delete comment error:", err);
        res.status(500).json({ error: "Server error deleting comment." });
    }
};
