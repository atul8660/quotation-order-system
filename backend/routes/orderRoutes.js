const express = require("express");
const router = express.Router();
const {
    getOrders,
    getOrderById,
    updateOrderStatus
} = require("../controllers/orderController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Protect all order routes with JWT
router.use(authMiddleware);

router.route("/")
    .get(getOrders);

router.route("/:id")
    .get(getOrderById);

router.route("/:id/status")
    .put(authorizeRoles("ADMIN", "SALES"), updateOrderStatus);

module.exports = router;
