const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message || "Server error";

    // Handle Mongoose CastError (Invalid ObjectId)
    if (err.name === "CastError") {
        statusCode = 400;
        message = `Resource not found. Invalid ${err.path}`;
    }

    // Handle Mongoose ValidationError
    if (err.name === "ValidationError") {
        statusCode = 400;
        const messages = Object.values(err.errors).map(val => val.message);
        message = messages.join(", ");
    }

    // Handle Mongoose duplicate key (11000)
    if (err.code === 11000) {
        statusCode = 400;
        const duplicateField = Object.keys(err.keyValue)[0];
        
        if (duplicateField === "email") {
            message = "Email is already registered";
        } else if (duplicateField === "sku") {
            message = "Product SKU must be unique";
        } else if (duplicateField === "quotationNumber") {
            message = "Quotation number must be unique";
        } else if (duplicateField === "orderNumber" || duplicateField === "quotationId") {
            message = "Duplicate conversion detected: Quotation has already been converted to an order";
        } else {
            message = `Duplicate field value entered: ${duplicateField}`;
        }
    }

    // Custom Error handling for unauthorized and forbidden
    if (err.name === "UnauthorizedError" || message.toLowerCase().includes("unauthorized") || message.toLowerCase().includes("token")) {
        statusCode = 401;
    }

    if (err.name === "ForbiddenError" || message.toLowerCase().includes("forbidden") || message.toLowerCase().includes("permission")) {
        statusCode = 403;
    }

    // Default error response
    res.status(statusCode).json({
        success: false,
        message: message
    });
};

const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

module.exports = { errorHandler, notFound };
