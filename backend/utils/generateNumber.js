const Quotation = require("../models/Quotation");
// Note: We require Order here, but Order model might not be created yet.
// We will wrap the Order require in a try-catch or create it later, but since we create Order in Module 8,
// we can define generateOrderNumber here and it will be used later.
// To avoid crashing if Order model is not yet created, we require it dynamically inside the function.

const generateQuotationNumber = async () => {
    const year = new Date().getFullYear();
    const prefix = `QT-${year}-`;
    
    const lastQuotation = await Quotation.findOne({ quotationNumber: new RegExp(`^${prefix}`) })
        .sort({ quotationNumber: -1 });

    let nextNumber = 1;
    if (lastQuotation) {
        const lastSequence = parseInt(lastQuotation.quotationNumber.split("-")[2], 10);
        nextNumber = lastSequence + 1;
    }

    const paddedNumber = nextNumber.toString().padStart(4, "0");
    return `${prefix}${paddedNumber}`;
};

const generateOrderNumber = async () => {
    const Order = require("../models/Order");
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}-`;
    
    const lastOrder = await Order.findOne({ orderNumber: new RegExp(`^${prefix}`) })
        .sort({ orderNumber: -1 });

    let nextNumber = 1;
    if (lastOrder) {
        const lastSequence = parseInt(lastOrder.orderNumber.split("-")[2], 10);
        nextNumber = lastSequence + 1;
    }

    const paddedNumber = nextNumber.toString().padStart(4, "0");
    return `${prefix}${paddedNumber}`;
};

module.exports = {
    generateQuotationNumber,
    generateOrderNumber
};
