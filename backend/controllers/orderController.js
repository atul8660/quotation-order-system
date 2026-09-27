const Order = require("../models/Order");

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res, next) => {
    try {
        const orders = await Order.find()
            .populate("customerId", "name companyName email")
            .populate("createdBy", "name email");

        res.status(200).json({
            success: true,
            message: "Orders fetched successfully",
            data: orders
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("customerId", "name companyName email")
            .populate("quotationId", "quotationNumber")
            .populate("createdBy", "name email");

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.status(200).json({
            success: true,
            message: "Order fetched successfully",
            data: order
        });
    } catch (error) {
        console.error("Get order error:", error);
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, message: "Invalid order ID" });
        }
        next(error);
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (ADMIN, SALES)
const updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const validStatuses = ["CONFIRMED", "PROCESSING", "COMPLETED", "CANCELLED"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        order.status = status;
        await order.save();

        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            data: order
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getOrders,
    getOrderById,
    updateOrderStatus
};
