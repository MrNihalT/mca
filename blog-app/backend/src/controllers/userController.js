const db = require("../config/db");
const bcrypt = require("bcryptjs");

// 1. Get All Users
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query(
            "SELECT id, name, email, role, avatar, bio, github, twitter, created_at, updated_at FROM users ORDER BY created_at DESC"
        );
        res.status(200).json({ users });
    } catch (err) {
        console.error("Get all users error:", err);
        res.status(500).json({ error: "Server error fetching users." });
    }
};

// 2. Create User/Staff (Admin direct creation)
exports.createUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: "Please provide name, email, password, and role." });
    }

    if (!["USER", "STAFF", "ADMIN"].includes(role)) {
        return res.status(400).json({ error: "Invalid role value. Must be USER, STAFF, or ADMIN." });
    }

    try {
        // Check uniqueness
        const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: "Email is already in use." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [name, email, hashedPassword, role]
        );

        const [newUsers] = await db.query(
            "SELECT id, name, email, role, avatar, bio, github, twitter, created_at FROM users WHERE id = ?",
            [result.insertId]
        );

        res.status(201).json({
            message: "User created successfully",
            user: newUsers[0]
        });
    } catch (err) {
        console.error("Admin create user error:", err);
        res.status(500).json({ error: "Server error creating user." });
    }
};

// 3. Update User (Admin edit)
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, role } = req.body;

    try {
        // Fetch user
        const [users] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
        if (users.length === 0) {
            return res.status(404).json({ error: "User not found." });
        }

        const user = users[0];

        const updatedName = name || user.name;
        const updatedEmail = email || user.email;
        const updatedRole = role || user.role;

        if (role && !["USER", "STAFF", "ADMIN"].includes(role)) {
            return res.status(400).json({ error: "Invalid role value." });
        }

        // Check if updating email to someone else's email
        if (email && email !== user.email) {
            const [existing] = await db.query("SELECT id FROM users WHERE email = ? AND id != ?", [email, id]);
            if (existing.length > 0) {
                return res.status(400).json({ error: "Email is already in use by another user." });
            }
        }

        await db.query(
            "UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?",
            [updatedName, updatedEmail, updatedRole, id]
        );

        const [updatedUsers] = await db.query(
            "SELECT id, name, email, role, avatar, bio, github, twitter, created_at, updated_at FROM users WHERE id = ?",
            [id]
        );

        res.status(200).json({
            message: "User updated successfully",
            user: updatedUsers[0]
        });
    } catch (err) {
        console.error("Admin update user error:", err);
        res.status(500).json({ error: "Server error updating user." });
    }
};

// 4. Delete User
exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    // Prevent deleting oneself
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: "You cannot delete your own admin account." });
    }

    try {
        const [users] = await db.query("SELECT id FROM users WHERE id = ?", [id]);
        if (users.length === 0) {
            return res.status(404).json({ error: "User not found." });
        }

        await db.query("DELETE FROM users WHERE id = ?", [id]);
        res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
        console.error("Admin delete user error:", err);
        res.status(500).json({ error: "Server error deleting user." });
    }
};
