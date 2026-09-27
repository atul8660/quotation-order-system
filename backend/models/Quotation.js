const mongoose = require("mongoose");

const quotationItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    taxRate: {
        type: Number,
        required: true,
        min: 0
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    }
});

const quotationSchema = new mongoose.Schema({
    quotationNumber: {
        type: String,
        required: true,
        unique: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },
    customerDetails: {
        name: String,
        email: String,
        companyName: String
    },
    items: [quotationItemSchema],
    subtotal: {
        type: Number,
        default: 0
    },
    discountPercent: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    taxableAmount: {
        type: Number,
        default: 0
    },
    taxAmount: {
        type: Number,
        default: 0
    },
    grandTotal: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "SENT", "EXPIRED", "ACCEPTED", "CONVERTED"],
        default: "DRAFT"
    },
    validUntil: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

module.exports = mongoose.model("Quotation", quotationSchema);
