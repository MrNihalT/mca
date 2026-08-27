const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Middleware to enforce authentication via JWT.
 * Rejects requests with 401 if token is missing, invalid, or expired.
 */
const requireAuth = (req, res, next) => {
    let token = null;

    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "change_this_to_a_long_random_secret");
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token." });
    }
};

/**
 * Middleware to check authentication optionally.
 * Does not reject requests, but populates req.user if a valid token exists.
 */
const optionalAuth = (req, res, next) => {
    let token = null;

    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "change_this_to_a_long_random_secret");
            req.user = decoded;
        } catch (err) {
            // Silently ignore invalid tokens for optional auth
        }
    }
    next();
};

module.exports = {
    requireAuth,
    optionalAuth
};
