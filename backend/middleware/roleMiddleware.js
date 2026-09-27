const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // We assume req.user is already set by authMiddleware
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated."
            });
        }

        // Check if the user's role is included in the allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            // Return 403 Forbidden
            return res.status(403).json({
                success: false,
                message: `Forbidden: Your role (${req.user.role}) does not have permission to access this resource.`
            });
        }

        // User is authorized, proceed
        next();
    };
};

module.exports = authorizeRoles;
