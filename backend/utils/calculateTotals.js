const calculateTotals = (items, discountPercent = 0) => {
    let subtotal = 0;
    
    // Calculate item amounts and subtotal
    const calculatedItems = items.map(item => {
        const amount = item.quantity * item.unitPrice;
        subtotal += amount;
        return {
            ...item,
            amount
        };
    });

    // Discount amount
    const discountAmount = (subtotal * discountPercent) / 100;
    
    // Taxable amount
    const taxableAmount = subtotal - discountAmount;

    // Calculate tax amount
    // Since each item has its own taxRate, we calculate the proportion of discount for each item
    let taxAmount = 0;
    if (subtotal > 0) {
        calculatedItems.forEach(item => {
            const itemProportion = item.amount / subtotal;
            const itemTaxableAmount = taxableAmount * itemProportion;
            const itemTax = (itemTaxableAmount * item.taxRate) / 100;
            taxAmount += itemTax;
        });
    }

    const grandTotal = taxableAmount + taxAmount;

    return {
        items: calculatedItems,
        subtotal: Number(subtotal.toFixed(2)),
        discountAmount: Number(discountAmount.toFixed(2)),
        taxableAmount: Number(taxableAmount.toFixed(2)),
        taxAmount: Number(taxAmount.toFixed(2)),
        grandTotal: Number(grandTotal.toFixed(2))
    };
};

module.exports = { calculateTotals };
