/**
 * Middleware to restrict access based on user roles.
 * Expects requireAuth middleware to run before this to populate req.user.
 * 
 * @param {...string} allowedRoles - The roles permitted to access this resource ('USER', 'STAFF', 'ADMIN')
 */
const restrictTo = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Authentication required." });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden. You do not have permission to perform this action." });
        }

        next();
    };
};

module.exports = {
    restrictTo
};
