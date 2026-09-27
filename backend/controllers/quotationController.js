const Quotation = require("../models/Quotation");
const Approval = require("../models/Approval");
const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const { generateQuotationNumber, generateOrderNumber } = require("../utils/generateNumber");
const { calculateTotals } = require("../utils/calculateTotals");

// @desc    Create a new quotation
// @route   POST /api/quotations
// @access  Private (SALES, ADMIN)
const createQuotation = async (req, res, next) => {
    try {
        const { customerId, items, discountPercent, validUntil } = req.body;

        if (!customerId || !items || items.length === 0) {
            return res.status(400).json({ success: false, message: "Customer and items are required" });
        }

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        // Fetch products to get snapshots of name, price, taxRate
        const quotationItems = [];
        for (let item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ success: false, message: `Product with id ${item.productId} not found` });
            }
            quotationItems.push({
                productId: product._id,
                productName: product.name,
                quantity: item.quantity,
                unitPrice: product.price,
                taxRate: product.taxRate
            });
        }

        const totals = calculateTotals(quotationItems, discountPercent || 0);

        const quotationNumber = await generateQuotationNumber();

        const quotation = await Quotation.create({
            quotationNumber,
            customerId: customer._id,
            customerDetails: {
                name: customer.name,
                email: customer.email,
                companyName: customer.companyName
            },
            items: totals.items,
            subtotal: totals.subtotal,
            discountPercent: discountPercent || 0,
            discountAmount: totals.discountAmount,
            taxableAmount: totals.taxableAmount,
            taxAmount: totals.taxAmount,
            grandTotal: totals.grandTotal,
            validUntil,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: "Quotation created successfully",
            data: quotation
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Private
const getQuotations = async (req, res, next) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status) {
            query.status = status;
        }

        const quotations = await Quotation.find(query)
            .populate("customerId", "name companyName email")
            .populate("createdBy", "name email");

        res.status(200).json({
            success: true,
            message: "Quotations fetched successfully",
            data: quotations
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single quotation
// @route   GET /api/quotations/:id
// @access  Private
const getQuotationById = async (req, res, next) => {
    try {
        const quotation = await Quotation.findById(req.params.id)
            .populate("customerId", "name companyName email")
            .populate("createdBy", "name email");

        if (!quotation) {
            return res.status(404).json({ success: false, message: "Quotation not found" });
        }

        res.status(200).json({
            success: true,
            message: "Quotation fetched successfully",
            data: quotation
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update a draft quotation
// @route   PUT /api/quotations/:id
// @access  Private (SALES, ADMIN)
const updateQuotation = async (req, res, next) => {
    try {
        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({ success: false, message: "Quotation not found" });
        }

        if (quotation.status !== "DRAFT") {
            return res.status(400).json({ success: false, message: "Only draft quotations can be edited" });
        }

        const { items, discountPercent, validUntil } = req.body;

        // If items are updated, recalculate
        if (items && items.length > 0) {
            const quotationItems = [];
            for (let item of items) {
                const product = await Product.findById(item.productId);
                if (!product) {
                    return res.status(404).json({ success: false, message: `Product with id ${item.productId} not found` });
                }
                quotationItems.push({
                    productId: product._id,
                    productName: product.name,
                    quantity: item.quantity,
                    unitPrice: product.price, // Latest price or keep old if not specified? Rule says "never trust frontend totals, snapshot values". If they update items, we fetch latest price.
                    taxRate: product.taxRate
                });
            }

            const totals = calculateTotals(quotationItems, discountPercent !== undefined ? discountPercent : quotation.discountPercent);

            quotation.items = totals.items;
            quotation.subtotal = totals.subtotal;
            quotation.discountPercent = discountPercent !== undefined ? discountPercent : quotation.discountPercent;
            quotation.discountAmount = totals.discountAmount;
            quotation.taxableAmount = totals.taxableAmount;
            quotation.taxAmount = totals.taxAmount;
            quotation.grandTotal = totals.grandTotal;
        }

        if (validUntil) quotation.validUntil = validUntil;

        await quotation.save();

        res.status(200).json({
            success: true,
            message: "Quotation updated successfully",
            data: quotation
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete quotation
// @route   DELETE /api/quotations/:id
// @access  Private (ADMIN)
const deleteQuotation = async (req, res, next) => {
    try {
        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({ success: false, message: "Quotation not found" });
        }

        if (quotation.status !== "DRAFT") {
            return res.status(400).json({ success: false, message: "Only draft quotations can be deleted" });
        }

        await quotation.deleteOne();

        res.status(200).json({
            success: true,
            message: "Quotation deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

// WORKFLOW APIs

// @desc    Submit quotation for approval
// @route   POST /api/quotations/:id/submit
// @access  Private (SALES, ADMIN)
const submitQuotation = async (req, res, next) => {
    try {
        const quotation = await Quotation.findById(req.params.id);
        if (!quotation) return res.status(404).json({ success: false, message: "Quotation not found" });

        if (quotation.status !== "DRAFT") {
            return res.status(400).json({ success: false, message: "Only DRAFT quotation can be submitted" });
        }

        quotation.status = "PENDING_APPROVAL";
        await quotation.save();

        // Create approval record
        await Approval.create({
            quotationId: quotation._id,
            requestedBy: req.user.id,
            status: "PENDING"
        });

        res.status(200).json({ success: true, message: "Quotation submitted for approval", data: quotation });
    } catch (error) {
        next(error);
    }
};

// @desc    Send quotation to customer
// @route   POST /api/quotations/:id/send
// @access  Private (SALES, ADMIN)
const sendQuotation = async (req, res, next) => {
    try {
        const quotation = await Quotation.findById(req.params.id);
        if (!quotation) return res.status(404).json({ success: false, message: "Quotation not found" });

        if (quotation.status !== "APPROVED") {
            return res.status(400).json({ success: false, message: "Only APPROVED quotation can be sent" });
        }

        quotation.status = "SENT";
        await quotation.save();

        res.status(200).json({ success: true, message: "Quotation sent to customer", data: quotation });
    } catch (error) {
        next(error);
    }
};

// @desc    Accept quotation
// @route   POST /api/quotations/:id/accept
// @access  Private (SALES, ADMIN)
const acceptQuotation = async (req, res, next) => {
    try {
        const quotation = await Quotation.findById(req.params.id);
        if (!quotation) return res.status(404).json({ success: false, message: "Quotation not found" });

        if (quotation.status !== "SENT") {
            return res.status(400).json({ success: false, message: "Only SENT quotation can be accepted" });
        }

        quotation.status = "ACCEPTED";
        await quotation.save();

        res.status(200).json({ success: true, message: "Quotation accepted by customer", data: quotation });
    } catch (error) {
        next(error);
    }
};

// @desc    Approve quotation
// @route   POST /api/quotations/:id/approve
// @access  Private (MANAGER, ADMIN)
const approveQuotation = async (req, res, next) => {
    try {
        const quotation = await Quotation.findById(req.params.id);
        if (!quotation) return res.status(404).json({ success: false, message: "Quotation not found" });

        if (quotation.status !== "PENDING_APPROVAL") {
            return res.status(400).json({ success: false, message: "Only PENDING_APPROVAL quotation can be approved" });
        }

        quotation.status = "APPROVED";
        quotation.approvedBy = req.user.id;
        await quotation.save();

        // Update approval record
        const approval = await Approval.findOne({ quotationId: quotation._id, status: "PENDING" });
        if (approval) {
            approval.status = "APPROVED";
            approval.reviewedBy = req.user.id;
            approval.comments = req.body.comments || "";
            approval.reviewedAt = Date.now();
            await approval.save();
        }

        res.status(200).json({ success: true, message: "Quotation approved", data: quotation });
    } catch (error) {
        next(error);
    }
};

// @desc    Reject quotation
// @route   POST /api/quotations/:id/reject
// @access  Private (MANAGER, ADMIN)
const rejectQuotation = async (req, res, next) => {
    try {
        const quotation = await Quotation.findById(req.params.id);
        if (!quotation) return res.status(404).json({ success: false, message: "Quotation not found" });

        if (quotation.status !== "PENDING_APPROVAL") {
            return res.status(400).json({ success: false, message: "Only PENDING_APPROVAL quotation can be rejected" });
        }

        quotation.status = "REJECTED";
        await quotation.save();

        // Update approval record
        const approval = await Approval.findOne({ quotationId: quotation._id, status: "PENDING" });
        if (approval) {
            approval.status = "REJECTED";
            approval.reviewedBy = req.user.id;
            approval.comments = req.body.comments || "";
            approval.reviewedAt = Date.now();
            await approval.save();
        }

        res.status(200).json({ success: true, message: "Quotation rejected", data: quotation });
    } catch (error) {
        next(error);
    }
};

// @desc    Convert quotation to order
// @route   POST /api/quotations/:id/convert
// @access  Private (SALES, ADMIN)
const convertQuotation = async (req, res, next) => {
    const mongoose = require("mongoose");
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const quotation = await Quotation.findById(req.params.id).session(session);
        if (!quotation) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: "Quotation not found" });
        }

        if (quotation.status !== "ACCEPTED") {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: "Only ACCEPTED quotation can be converted" });
        }

        const existingOrder = await Order.findOne({ quotationId: quotation._id }).session(session);
        if (existingOrder) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: "Quotation has already been converted to an order" });
        }

        const orderNumber = await generateOrderNumber();

        const order = new Order({
            orderNumber,
            quotationId: quotation._id,
            customerId: quotation.customerId,
            items: quotation.items.map(item => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxRate: item.taxRate,
                amount: item.amount
            })),
            subtotal: quotation.subtotal,
            discountAmount: quotation.discountAmount,
            taxAmount: quotation.taxAmount,
            grandTotal: quotation.grandTotal,
            status: "CONFIRMED",
            createdBy: req.user.id
        });

        await order.save({ session });

        quotation.status = "CONVERTED";
        await quotation.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ success: true, message: "Quotation converted to order successfully", data: order });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

module.exports = {
    createQuotation,
    getQuotations,
    getQuotationById,
    updateQuotation,
    deleteQuotation,
    submitQuotation,
    sendQuotation,
    acceptQuotation,
    approveQuotation,
    rejectQuotation,
    convertQuotation
};
