const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        // 1. Check whether Authorization header exists
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        // 2 & 3. Check Bearer format and extract token
        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Invalid token format. Format should be: Bearer <token>"
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Token missing."
            });
        }

        // 4 & 5. Verify token and decode using JWT_SECRET
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 6. Attach decoded user information to req.user
        req.user = {
            id: decoded.id,
            role: decoded.role
        };

        // Proceed to next middleware or route handler
        next();

    } catch (error) {
        // 7. Return proper 401 response for invalid or expired token
        console.error("Auth middleware error:", error.message);
        
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired. Please login again."
            });
        }
        
        return res.status(401).json({
            success: false,
            message: "Invalid token."
        });
    }
};

module.exports = authMiddleware;
