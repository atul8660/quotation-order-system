const Customer = require("../models/Customer");

// @desc    Create a new customer
// @route   POST /api/customers
// @access  Private (SALES, ADMIN)
const createCustomer = async (req, res, next) => {
    try {
        const { name, companyName, email, phone, address, city, state, country } = req.body;

        // Validation
        if (!name) {
            return res.status(400).json({ success: false, message: "Customer name is required" });
        }

        const customer = await Customer.create({
            name,
            companyName,
            email,
            phone,
            address,
            city,
            state,
            country,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: "Customer created successfully",
            data: customer
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all customers (with search)
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res, next) => {
    try {
        const { search } = req.query;
        let query = {};

        // Search by name, companyName, or email
        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { companyName: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } }
                ]
            };
        }

        const customers = await Customer.find(query).populate("createdBy", "name email");

        res.status(200).json({
            success: true,
            message: "Customers fetched successfully",
            data: customers
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get a single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.params.id).populate("createdBy", "name email");

        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        res.status(200).json({
            success: true,
            message: "Customer fetched successfully",
            data: customer
        });
    } catch (error) {
        console.error("Get customer error:", error);
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, message: "Invalid customer ID" });
        }
        next(error);
    }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private (SALES, ADMIN)
const updateCustomer = async (req, res, next) => {
    try {
        let customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        customer = await Customer.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Customer updated successfully",
            data: customer
        });
    } catch (error) {
        console.error("Update customer error:", error);
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, message: "Invalid customer ID" });
        }
        next(error);
    }
};

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Private (ADMIN)
const deleteCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        await customer.deleteOne();

        res.status(200).json({
            success: true,
            message: "Customer deleted successfully",
            data: {}
        });
    } catch (error) {
        console.error("Delete customer error:", error);
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, message: "Invalid customer ID" });
        }
        next(error);
    }
};

module.exports = {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer
};
