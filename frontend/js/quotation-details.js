let products = [];
let items = [];

document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    
    // Check if it's view mode (via ?id= param)
    const urlParams = new URLSearchParams(window.location.search);
    const quoteId = urlParams.get('id');

    await Promise.all([loadCustomers(), loadProducts()]);

    if (quoteId) {
        document.getElementById('pageTitle').textContent = 'View Quotation';
        document.getElementById('saveBtn').style.display = 'none';
        document.getElementById('discountPercent').disabled = true;
        document.getElementById('customerId').disabled = true;
        await loadQuotation(quoteId);
    } else {
        addItem(); // Add one empty row
    }

    document.getElementById('discountPercent').addEventListener('input', calculateTotals);
    document.getElementById('quoteForm').addEventListener('submit', saveQuotation);
});

async function loadCustomers() {
    const { data } = await fetchApi('/customers');
    const select = document.getElementById('customerId');
    if (data.success) {
        data.data.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c._id;
            opt.textContent = `${c.name} (${c.companyName || '-'})`;
            select.appendChild(opt);
        });
    }
}

async function loadProducts() {
    const { data } = await fetchApi('/products');
    if (data.success) {
        products = data.data.filter(p => p.isActive);
    }
}

function addItem(existingData = null) {
    const isViewMode = new URLSearchParams(window.location.search).get('id') !== null;
    if (isViewMode && !existingData) return; // Disallow adding items in view mode

    const id = Date.now().toString();
    const item = existingData || { id, productId: '', quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 };
    if (!existingData) items.push(item);

    const tbody = document.getElementById('itemsTable');
    const tr = document.createElement('tr');
    tr.id = `row-${id}`;
    
    let productOptions = '<option value="">Select Product...</option>';
    products.forEach(p => {
        productOptions += `<option value="${p._id}" ${item.productId === p._id ? 'selected' : ''}>${p.name} (SKU: ${p.sku})</option>`;
    });

    // In view mode, we might not have the product in the active list, so just show name
    if (isViewMode) {
        productOptions = `<option>${existingData.productName}</option>`;
    }

    tr.innerHTML = `
        <td>
            <select class="form-control" onchange="onProductChange('${id}', this.value)" ${isViewMode ? 'disabled' : 'required'}>
                ${productOptions}
            </select>
        </td>
        <td>₹<span id="price-${id}">${item.unitPrice.toFixed(2)}</span></td>
        <td><span id="tax-${id}">${item.taxRate}</span>%</td>
        <td>
            <input type="number" class="form-control" value="${item.quantity}" min="1" oninput="onQuantityChange('${id}', this.value)" ${isViewMode ? 'disabled' : 'required'}>
        </td>
        <td>₹<strong id="amount-${id}">${item.amount.toFixed(2)}</strong></td>
        <td>
            ${!isViewMode ? `<button type="button" onclick="removeItem('${id}')" class="btn btn-danger btn-sm">X</button>` : ''}
        </td>
    `;
    tbody.appendChild(tr);
    if (!isViewMode) calculateTotals();
}

function onProductChange(id, productId) {
    const product = products.find(p => p._id === productId);
    const item = items.find(i => i.id === id);
    if (product && item) {
        item.productId = product._id;
        item.unitPrice = product.price;
        item.taxRate = product.taxRate;
        document.getElementById(`price-${id}`).textContent = product.price.toFixed(2);
        document.getElementById(`tax-${id}`).textContent = product.taxRate;
        calculateTotals();
    }
}

function onQuantityChange(id, qty) {
    const item = items.find(i => i.id === id);
    if (item) {
        item.quantity = Number(qty) || 1;
        calculateTotals();
    }
}

function removeItem(id) {
    items = items.filter(i => i.id !== id);
    document.getElementById(`row-${id}`).remove();
    calculateTotals();
}

function calculateTotals() {
    let subtotal = 0;
    
    items.forEach(item => {
        item.amount = item.quantity * item.unitPrice;
        const el = document.getElementById(`amount-${item.id}`);
        if (el) el.textContent = item.amount.toFixed(2);
        subtotal += item.amount;
    });

    const discountPercent = Number(document.getElementById('discountPercent').value) || 0;
    const discountAmount = (subtotal * discountPercent) / 100;
    const taxableAmount = subtotal - discountAmount;
    
    let taxAmount = 0;
    if (subtotal > 0) {
        items.forEach(item => {
            const itemProportion = item.amount / subtotal;
            const itemTaxable = taxableAmount * itemProportion;
            taxAmount += (itemTaxable * item.taxRate) / 100;
        });
    }

    const grandTotal = taxableAmount + taxAmount;

    document.getElementById('dispSubtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('dispDiscount').textContent = `₹${discountAmount.toFixed(2)}`;
    document.getElementById('dispTaxable').textContent = `₹${taxableAmount.toFixed(2)}`;
    document.getElementById('dispTax').textContent = `₹${taxAmount.toFixed(2)}`;
    document.getElementById('dispGrandTotal').textContent = `₹${grandTotal.toFixed(2)}`;
}

async function saveQuotation(e) {
    e.preventDefault();
    if (items.length === 0 || !items[0].productId) {
        alert('Please add at least one product.');
        return;
    }

    const payload = {
        customerId: document.getElementById('customerId').value,
        discountPercent: Number(document.getElementById('discountPercent').value),
        items: items.map(i => ({
            productId: i.productId,
            quantity: i.quantity
        }))
    };

    const { data } = await fetchApi('/quotations', 'POST', payload);
    if (data.success) {
        window.location.href = 'quotations.html';
    } else {
        alert(data.message);
    }
}

async function loadQuotation(id) {
    const { data } = await fetchApi(`/quotations/${id}`);
    if (data.success) {
        const q = data.data;
        document.getElementById('customerId').value = q.customerId._id;
        document.getElementById('discountPercent').value = q.discountPercent;
        
        q.items.forEach((item, index) => {
            addItem({
                id: `view-${index}`,
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxRate: item.taxRate,
                amount: item.amount
            });
        });

        document.getElementById('dispSubtotal').textContent = `₹${q.subtotal.toFixed(2)}`;
        document.getElementById('dispDiscount').textContent = `₹${q.discountAmount.toFixed(2)}`;
        document.getElementById('dispTaxable').textContent = `₹${q.taxableAmount.toFixed(2)}`;
        document.getElementById('dispTax').textContent = `₹${q.taxAmount.toFixed(2)}`;
        document.getElementById('dispGrandTotal').textContent = `₹${q.grandTotal.toFixed(2)}`;
    }
}
