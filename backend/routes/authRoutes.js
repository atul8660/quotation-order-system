const express = require("express");

const {
    registerUser,
    loginUser,
    getUsers
} = require("../controllers/authController");

const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

router.post("/register", authMiddleware, authorizeRoles("ADMIN"), registerUser);
router.get("/users", authMiddleware, authorizeRoles("ADMIN"), getUsers);

router.post("/login", loginUser);

module.exports = router;