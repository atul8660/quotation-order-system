document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadOrders();
});

function getOrderStatusBadge(status) {
    const map = {
        'CONFIRMED': 'badge-pending', // Using pending style for confirmed
        'PROCESSING': 'badge-sent', // Using sent style for processing
        'COMPLETED': 'badge-approved',
        'CANCELLED': 'badge-rejected'
    };
    return `<span class="badge ${map[status] || 'badge-draft'}">${status}</span>`;
}

async function loadOrders() {
    const { data } = await fetchApi('/orders');
    const tbody = document.getElementById('ordersTable');
    tbody.innerHTML = '';
    const user = getUser();

    if (data.success) {
        // Sort data so actionable items appear first
        data.data.sort((a, b) => {
            const getPriority = (o) => {
                if (user.role === 'SALES' || user.role === 'ADMIN') {
                    return ['CONFIRMED', 'PROCESSING'].includes(o.status) ? 1 : 0;
                } else if (user.role === 'MANAGER') {
                    // Manager might just want active orders at the top
                    return ['CONFIRMED', 'PROCESSING'].includes(o.status) ? 1 : 0;
                }
                return 0;
            };
            
            const pA = getPriority(a);
            const pB = getPriority(b);
            
            if (pA !== pB) {
                return pB - pA; // Higher priority first
            }
            // Fallback to date descending (newest first)
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        data.data.forEach(o => {
            let actions = `<button onclick="viewOrder('${o._id}')" class="btn btn-sm btn-ghost">View Items</button>`;
            
            if (o.status === 'CONFIRMED' && (user.role === 'ADMIN' || user.role === 'SALES')) {
                actions += ` <button onclick="updateStatus('${o._id}', 'PROCESSING')" class="btn btn-sm" style="background: #3b82f6; color: white;">Process</button>`;
            }
            if (o.status === 'PROCESSING' && (user.role === 'ADMIN' || user.role === 'SALES')) {
                actions += ` <button onclick="updateStatus('${o._id}', 'COMPLETED')" class="btn btn-sm" style="background: #10b981; color: white;">Complete</button>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${o.orderNumber}</td>
                <td><span style="color: var(--text-secondary); font-size: 0.875rem;">${o.quotationId ? 'Ref' : '-'}</span></td>
                <td>${o.customerId?.name || '-'}</td>
                <td>₹${o.grandTotal.toFixed(2)}</td>
                <td>${getOrderStatusBadge(o.status)}</td>
                <td>${new Date(o.createdAt).toLocaleDateString()}</td>
                <td class="action-btns">${actions}</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

async function updateStatus(id, status) {
    const { data } = await fetchApi(`/orders/${id}/status`, 'PUT', { status });
    if (data.success) {
        loadOrders();
    } else {
        alert(data.message);
    }
}

async function viewOrder(id) {
    const { data } = await fetchApi(`/orders/${id}`);
    if (data.success) {
        const o = data.data;
        const details = document.getElementById('orderDetails');
        
        let itemsHtml = `
            <table style="margin-top: 1rem; font-size: 0.875rem;">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        o.items.forEach(item => {
            itemsHtml += `
                <tr>
                    <td>${item.productName}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.unitPrice.toFixed(2)}</td>
                    <td>₹${item.amount.toFixed(2)}</td>
                </tr>
            `;
        });
        
        itemsHtml += `</tbody></table>`;
        
        details.innerHTML = `
            <div class="grid" style="grid-template-columns: 1fr 1fr;">
                <div>
                    <p><strong>Order:</strong> ${o.orderNumber}</p>
                    <p><strong>Customer:</strong> ${o.customerId?.name}</p>
                    <p><strong>Status:</strong> ${getOrderStatusBadge(o.status)}</p>
                </div>
                <div style="text-align: right;">
                    <p><strong>Subtotal:</strong> ₹${o.subtotal.toFixed(2)}</p>
                    <p><strong>Discount:</strong> ₹${o.discountAmount.toFixed(2)}</p>
                    <p><strong>Tax:</strong> ₹${o.taxAmount.toFixed(2)}</p>
                    <h3 style="color: var(--accent);">Total: ₹${o.grandTotal.toFixed(2)}</h3>
                </div>
            </div>
            ${itemsHtml}
        `;
        
        document.getElementById('orderModal').classList.add('active');
    }
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}
