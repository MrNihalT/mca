const db = require("../config/db");
const fs = require("fs");
const path = require("path");

// Helper function to generate slug from title
const generateSlug = (title) => {
    const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    
    // Add random suffix to guarantee uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${randomSuffix}`;
};

// Helper function to delete file from disk
const deleteFile = (filePath) => {
    if (filePath) {
        const absolutePath = path.join(__dirname, "../..", filePath);
        fs.access(absolutePath, fs.constants.F_OK, (err) => {
            if (!err) {
                fs.unlink(absolutePath, (unlinkErr) => {
                    if (unlinkErr) console.error("Error deleting image file:", unlinkErr);
                });
            }
        });
    }
};

// 1. Create a Post
exports.createPost = async (req, res) => {
    const { title, content, category } = req.body;
    const authorId = req.user.id;

    if (!title || !content) {
        // If a file was uploaded but validation failed, clean it up
        if (req.file) deleteFile(`uploads/${req.file.filename}`);
        return res.status(400).json({ error: "Title and content are required." });
    }

    const slug = generateSlug(title);
    const imagePath = req.file ? `uploads/${req.file.filename}` : null;

    try {
        const [result] = await db.query(
            "INSERT INTO posts (title, slug, content, image, author_id, category) VALUES (?, ?, ?, ?, ?, ?)",
            [title, slug, content, imagePath, authorId, category || null]
        );

        const newPostId = result.insertId;

        // Fetch newly created post
        const [posts] = await db.query(
            `SELECT p.*, u.name as author_name, u.email as author_email, u.role as author_role
             FROM posts p
             JOIN users u ON p.author_id = u.id
             WHERE p.id = ?`,
            [newPostId]
        );

        res.status(201).json({
            message: "Post created successfully",
            post: posts[0]
        });
    } catch (err) {
        console.error("Create post error:", err);
        if (req.file) deleteFile(`uploads/${req.file.filename}`);
        res.status(500).json({ error: "Server error creating post." });
    }
};

// 2. Read All Posts (with search, author filter, likes & saves count, and status)
exports.getAllPosts = async (req, res) => {
    const userId = req.user ? req.user.id : 0; // 0 if guest
    const { authorId, search, saved, liked, category } = req.query;

    let query = `
        SELECT 
            p.*, 
            u.name as author_name, 
            u.email as author_email, 
            u.role as author_role,
            (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS likes_count,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
            (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND user_id = ?) AS is_liked,
            (SELECT COUNT(*) FROM saved_posts WHERE post_id = p.id AND user_id = ?) AS is_saved
        FROM posts p
        JOIN users u ON p.author_id = u.id
    `;

    const queryParams = [userId, userId];
    const conditions = [];

    // Filter by author
    if (authorId) {
        conditions.push("p.author_id = ?");
        queryParams.push(authorId);
    }

    // Filter by category
    if (category) {
        conditions.push("p.category = ?");
        queryParams.push(category);
    }

    // Search filter
    if (search) {
        conditions.push("(p.title LIKE ? OR p.content LIKE ?)");
        queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Filter by saved (requires logged-in user)
    if (saved === "true" && userId > 0) {
        conditions.push("p.id IN (SELECT post_id FROM saved_posts WHERE user_id = ?)");
        queryParams.push(userId);
    }

    // Filter by liked (requires logged-in user)
    if (liked === "true" && userId > 0) {
        conditions.push("p.id IN (SELECT post_id FROM post_likes WHERE user_id = ?)");
        queryParams.push(userId);
    }

    if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
    }

    // Sort by newest first
    query += " ORDER BY p.created_at DESC";

    try {
        const [posts] = await db.query(query, queryParams);
        
        // Map boolean fields
        const formattedPosts = posts.map(post => ({
            ...post,
            is_liked: post.is_liked > 0,
            is_saved: post.is_saved > 0
        }));

        res.status(200).json({ posts: formattedPosts });
    } catch (err) {
        console.error("Get all posts error:", err);
        res.status(500).json({ error: "Server error fetching posts." });
    }
};

// 3. Read Single Post by Slug (including its comments)
exports.getPostBySlug = async (req, res) => {
    const { slug } = req.params;
    const userId = req.user ? req.user.id : 0;

    try {
        const [posts] = await db.query(
            `SELECT 
                p.*, 
                u.name as author_name, 
                u.email as author_email, 
                u.role as author_role,
                (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS likes_count,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
                (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND user_id = ?) AS is_liked,
                (SELECT COUNT(*) FROM saved_posts WHERE post_id = p.id AND user_id = ?) AS is_saved
             FROM posts p
             JOIN users u ON p.author_id = u.id
             WHERE p.slug = ?`,
            [userId, userId, slug]
        );

        if (posts.length === 0) {
            return res.status(404).json({ error: "Post not found." });
        }

        const post = posts[0];
        post.is_liked = post.is_liked > 0;
        post.is_saved = post.is_saved > 0;

        // Fetch comments for this post
        const [comments] = await db.query(
            `SELECT c.*, u.name as user_name, u.email as user_email, u.role as user_role
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.post_id = ?
             ORDER BY c.created_at DESC`,
            [post.id]
        );

        post.comments = comments;

        res.status(200).json({ post });
    } catch (err) {
        console.error("Get post by slug error:", err);
        res.status(500).json({ error: "Server error fetching post." });
    }
};

// 4. Update Post
exports.updatePost = async (req, res) => {
    const { id } = req.params;
    const { title, content, category } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // Fetch post to check ownership
        const [posts] = await db.query("SELECT * FROM posts WHERE id = ?", [id]);
        if (posts.length === 0) {
            if (req.file) deleteFile(`uploads/${req.file.filename}`);
            return res.status(404).json({ error: "Post not found." });
        }

        const post = posts[0];

        // Authorization check: USER role can only edit their own post. STAFF/ADMIN can edit any post.
        if (userRole === "USER" && post.author_id !== userId) {
            if (req.file) deleteFile(`uploads/${req.file.filename}`);
            return res.status(403).json({ error: "Forbidden. You can only edit your own posts." });
        }

        let updatedTitle = title || post.title;
        let updatedContent = content || post.content;
        let updatedCategory = category !== undefined ? category : post.category;
        let imagePath = post.image;
        let updatedSlug = post.slug;

        // If title changed, update slug
        if (title && title !== post.title) {
            updatedSlug = generateSlug(title);
        }

        // If new image uploaded, delete old one and set new path
        if (req.file) {
            if (post.image) deleteFile(post.image);
            imagePath = `uploads/${req.file.filename}`;
        }

        await db.query(
            "UPDATE posts SET title = ?, slug = ?, content = ?, image = ?, category = ? WHERE id = ?",
            [updatedTitle, updatedSlug, updatedContent, imagePath, updatedCategory, id]
        );

        // Fetch updated post
        const [updatedPosts] = await db.query(
            `SELECT p.*, u.name as author_name, u.email as author_email, u.role as author_role
             FROM posts p
             JOIN users u ON p.author_id = u.id
             WHERE p.id = ?`,
            [id]
        );

        res.status(200).json({
            message: "Post updated successfully",
            post: updatedPosts[0]
        });
    } catch (err) {
        console.error("Update post error:", err);
        if (req.file) deleteFile(`uploads/${req.file.filename}`);
        res.status(500).json({ error: "Server error updating post." });
    }
};

// 5. Delete Post
exports.deletePost = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // Fetch post to check ownership
        const [posts] = await db.query("SELECT * FROM posts WHERE id = ?", [id]);
        if (posts.length === 0) {
            return res.status(404).json({ error: "Post not found." });
        }

        const post = posts[0];

        // Authorization check: USER can only delete their own post. STAFF/ADMIN can delete any post.
        if (userRole === "USER" && post.author_id !== userId) {
            return res.status(403).json({ error: "Forbidden. You can only delete your own posts." });
        }

        // Delete post banner image from disk
        if (post.image) deleteFile(post.image);

        // Delete post from DB (cascade deletes comments/likes/saves)
        await db.query("DELETE FROM posts WHERE id = ?", [id]);

        res.status(200).json({ message: "Post deleted successfully" });
    } catch (err) {
        console.error("Delete post error:", err);
        res.status(500).json({ error: "Server error deleting post." });
    }
};

// 6. Toggle Like on a Post
exports.toggleLikePost = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        // Check if post exists
        const [posts] = await db.query("SELECT id FROM posts WHERE id = ?", [id]);
        if (posts.length === 0) {
            return res.status(404).json({ error: "Post not found." });
        }

        // Check if already liked
        const [likes] = await db.query("SELECT id FROM post_likes WHERE user_id = ? AND post_id = ?", [userId, id]);
        
        let liked = false;
        if (likes.length > 0) {
            // Unlike post
            await db.query("DELETE FROM post_likes WHERE user_id = ? AND post_id = ?", [userId, id]);
        } else {
            // Like post
            await db.query("INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)", [userId, id]);
            liked = true;
        }

        // Fetch updated like count
        const [[{ likes_count }]] = await db.query("SELECT COUNT(*) as likes_count FROM post_likes WHERE post_id = ?", [id]);

        res.status(200).json({
            message: liked ? "Post liked successfully" : "Post unliked successfully",
            liked,
            likes_count
        });
    } catch (err) {
        console.error("Toggle like error:", err);
        res.status(500).json({ error: "Server error toggling post like." });
    }
};

// 7. Toggle Save on a Post (Bookmark)
exports.toggleSavePost = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        // Check if post exists
        const [posts] = await db.query("SELECT id FROM posts WHERE id = ?", [id]);
        if (posts.length === 0) {
            return res.status(404).json({ error: "Post not found." });
        }

        // Check if already saved
        const [saves] = await db.query("SELECT id FROM saved_posts WHERE user_id = ? AND post_id = ?", [userId, id]);
        
        let saved = false;
        if (saves.length > 0) {
            // Unsave post
            await db.query("DELETE FROM saved_posts WHERE user_id = ? AND post_id = ?", [userId, id]);
        } else {
            // Save post
            await db.query("INSERT INTO saved_posts (user_id, post_id) VALUES (?, ?)", [userId, id]);
            saved = true;
        }

        res.status(200).json({
            message: saved ? "Post saved successfully" : "Post unsaved successfully",
            saved
        });
    } catch (err) {
        console.error("Toggle save error:", err);
        res.status(500).json({ error: "Server error toggling post bookmark." });
    }
};

// 8. Get Dynamic Categories List in Use
exports.getCategories = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT DISTINCT category FROM posts WHERE category IS NOT NULL AND category != ''"
        );
        const categories = rows.map(r => r.category);
        res.status(200).json({ categories });
    } catch (err) {
        console.error("Get categories error:", err);
        res.status(500).json({ error: "Server error fetching categories." });
    }
};
