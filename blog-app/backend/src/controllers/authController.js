const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "change_this_to_a_long_random_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Helper function to generate JWT
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// 1. Register a new user
exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: "Please provide name, email, and password." });
    }

    try {
        // Check if user already exists
        const [existingUsers] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: "Email is already in use." });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const [result] = await db.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'USER')",
            [name, email, hashedPassword]
        );

        const newUserId = result.insertId;

        // Fetch new user details
        const [newUsers] = await db.query("SELECT id, name, email, role, avatar, bio, github, twitter, created_at FROM users WHERE id = ?", [newUserId]);
        const newUser = newUsers[0];

        // Generate token
        const token = generateToken(newUser);

        res.cookie("token", token, {
            httpOnly: true,
            secure: false, // Set to true in production over HTTPS
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: newUser
        });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ error: "Server error during registration." });
    }
};

// 2. Login user
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Please provide email and password." });
    }

    try {
        // Fetch user
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length === 0) {
            return res.status(400).json({ error: "Invalid email or password." });
        }

        const user = users[0];

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid email or password." });
        }

        // Generate token
        const token = generateToken(user);

        res.cookie("token", token, {
            httpOnly: true,
            secure: false, // Set to true in production over HTTPS
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.status(200).json({
            message: "Logged in successfully",
            token,
            user: userWithoutPassword
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Server error during login." });
    }
};

// 3. Get currently logged in user profile
exports.getMe = async (req, res) => {
    try {
        const [users] = await db.query("SELECT id, name, email, role, avatar, bio, github, twitter, created_at FROM users WHERE id = ?", [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ error: "User not found." });
        }

        res.status(200).json({
            user: users[0]
        });
    } catch (err) {
        console.error("getMe error:", err);
        res.status(500).json({ error: "Server error retrieving profile." });
    }
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

// 4. Update user profile (including avatar)
exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { name, bio, github, twitter } = req.body;

    try {
        // Fetch current user to get old avatar path
        const [users] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
        if (users.length === 0) {
            if (req.file) deleteFile(`uploads/${req.file.filename}`);
            return res.status(404).json({ error: "User not found." });
        }

        const user = users[0];

        let updatedName = name || user.name;
        let updatedBio = bio !== undefined ? bio : user.bio;
        let updatedGithub = github !== undefined ? github : user.github;
        let updatedTwitter = twitter !== undefined ? twitter : user.twitter;
        let avatarPath = user.avatar;

        if (req.file) {
            // Delete old avatar if exists
            if (user.avatar) {
                deleteFile(user.avatar);
            }
            avatarPath = `uploads/${req.file.filename}`;
        }

        await db.query(
            "UPDATE users SET name = ?, bio = ?, github = ?, twitter = ?, avatar = ? WHERE id = ?",
            [updatedName, updatedBio, updatedGithub, updatedTwitter, avatarPath, userId]
        );

        // Fetch updated user details
        const [updatedUsers] = await db.query(
            "SELECT id, name, email, role, avatar, bio, github, twitter, created_at FROM users WHERE id = ?",
            [userId]
        );

        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUsers[0]
        });
    } catch (err) {
        console.error("Update profile error:", err);
        if (req.file) deleteFile(`uploads/${req.file.filename}`);
        res.status(500).json({ error: "Server error updating profile." });
    }
};

// 5. Logout user (clears cookie)
exports.logout = async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({ message: "Logged out successfully" });
};
