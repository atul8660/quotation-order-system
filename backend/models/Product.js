const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    sku: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    category: {
        type: String,
        trim: true
    },
    unit: {
        type: String,
        trim: true,
        default: "pcs"
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price must be greater than or equal to 0']
    },
    taxRate: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Tax rate must be greater than or equal to 0']
    },
    stock: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
