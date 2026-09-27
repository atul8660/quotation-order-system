const Product = require("../models/Product");

// @desc    Create a new product
// @route   POST /api/products
// @access  Private (ADMIN)
const createProduct = async (req, res, next) => {
    try {
        const { name, description, sku, category, unit, price, taxRate, stock, isActive } = req.body;

        // Validation
        if (!name || !sku || price === undefined) {
            return res.status(400).json({ success: false, message: "Name, SKU, and price are required" });
        }

        if (price < 0) {
            return res.status(400).json({ success: false, message: "Price cannot be negative" });
        }

        if (taxRate !== undefined && taxRate < 0) {
            return res.status(400).json({ success: false, message: "Tax rate cannot be negative" });
        }

        // Check SKU uniqueness
        const existingProduct = await Product.findOne({ sku });
        if (existingProduct) {
            return res.status(400).json({ success: false, message: "SKU must be unique" });
        }

        const product = await Product.create({
            name,
            description,
            sku,
            category,
            unit,
            price,
            taxRate,
            stock,
            isActive,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all products (with search and filters)
// @route   GET /api/products
// @access  Private (ADMIN, SALES, MANAGER)
const getProducts = async (req, res, next) => {
    try {
        const { search, category, isActive } = req.query;
        let query = {};

        // Search by name or sku
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { sku: { $regex: search, $options: "i" } }
            ];
        }

        // Filter by category
        if (category) {
            query.category = category;
        }

        // Filter by active status
        if (isActive !== undefined) {
            query.isActive = isActive === "true";
        }

        const products = await Product.find(query).populate("createdBy", "name email");

        res.status(200).json({
            success: true,
            message: "Products fetched successfully",
            data: products
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get a single product
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id).populate("createdBy", "name email");

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.status(200).json({
            success: true,
            message: "Product fetched successfully",
            data: product
        });
    } catch (error) {
        console.error("Get product error:", error);
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, message: "Invalid product ID" });
        }
        next(error);
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (ADMIN)
const updateProduct = async (req, res, next) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Additional validation
        if (req.body.price !== undefined && req.body.price < 0) {
            return res.status(400).json({ success: false, message: "Price cannot be negative" });
        }
        if (req.body.taxRate !== undefined && req.body.taxRate < 0) {
            return res.status(400).json({ success: false, message: "Tax rate cannot be negative" });
        }
        if (req.body.sku && req.body.sku !== product.sku) {
            const existingSku = await Product.findOne({ sku: req.body.sku });
            if (existingSku) {
                return res.status(400).json({ success: false, message: "SKU must be unique" });
            }
        }

        product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product
        });
    } catch (error) {
        console.error("Update product error:", error);
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, message: "Invalid product ID" });
        }
        next(error);
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (ADMIN)
const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        await product.deleteOne();

        res.status(200).json({
            success: true,
            message: "Product deleted successfully",
            data: {}
        });
    } catch (error) {
        console.error("Delete product error:", error);
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, message: "Invalid product ID" });
        }
        next(error);
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
};
