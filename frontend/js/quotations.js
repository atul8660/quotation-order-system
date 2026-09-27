document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadQuotations();
});

function getStatusBadge(status) {
    const map = {
        'DRAFT': 'badge-draft',
        'PENDING_APPROVAL': 'badge-pending',
        'APPROVED': 'badge-approved',
        'SENT': 'badge-sent',
        'ACCEPTED': 'badge-accepted',
        'REJECTED': 'badge-rejected',
        'CONVERTED': 'badge-converted',
        'EXPIRED': 'badge-draft'
    };
    return `<span class="badge ${map[status] || 'badge-draft'}">${status.replace('_', ' ')}</span>`;
}

async function loadQuotations() {
    const { data } = await fetchApi('/quotations');
    const tbody = document.getElementById('quotationsTable');
    tbody.innerHTML = '';
    const user = getUser();
    
    if (user.role === 'MANAGER') {
        const createBtn = document.getElementById('create-quote-btn');
        if (createBtn) createBtn.style.display = 'none';
    }

    if (data.success) {
        // Sort data so actionable items appear first for the user
        data.data.sort((a, b) => {
            const getPriority = (q) => {
                if (user.role === 'MANAGER') {
                    return q.status === 'PENDING_APPROVAL' ? 1 : 0;
                } else if (user.role === 'SALES' || user.role === 'ADMIN') {
                    return ['DRAFT', 'APPROVED', 'SENT', 'ACCEPTED'].includes(q.status) ? 1 : 0;
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

        data.data.forEach(q => {
            let actions = '';
            if (user.role !== 'MANAGER') {
                actions = `<button onclick="openViewModal('${q._id}')" class="btn btn-sm btn-ghost">View</button>`;
            }
            
            if (q.status === 'DRAFT' && (user.role === 'SALES' || user.role === 'ADMIN')) {
                actions += ` <button onclick="updateStatus('${q._id}', 'submit')" class="btn btn-sm btn-primary">Submit</button>`;
            }
            if (q.status === 'PENDING_APPROVAL' && (user.role === 'MANAGER' || user.role === 'ADMIN')) {
                actions += ` <button onclick="openApproveModal('${q._id}')" class="btn btn-sm btn-success">Review</button>`;
            }
            if (q.status === 'APPROVED' && (user.role === 'SALES' || user.role === 'ADMIN')) {
                actions += ` <button onclick="updateStatus('${q._id}', 'send')" class="btn btn-sm" style="background: #3b82f6; color: white;">Send to Customer</button>`;
            }
            if (q.status === 'SENT' && (user.role === 'SALES' || user.role === 'ADMIN')) {
                actions += ` <button onclick="updateStatus('${q._id}', 'accept')" class="btn btn-sm" style="background: #10b981; color: white;">Mark Accepted</button>`;
            }
            if (q.status === 'ACCEPTED' && (user.role === 'SALES' || user.role === 'ADMIN')) {
                actions += ` <button onclick="convertOrder('${q._id}')" class="btn btn-sm" style="background: #8b5cf6; color: white;">Convert to Order</button>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${q.quotationNumber}</td>
                <td>${q.customerDetails?.name || '-'}</td>
                <td>₹${q.grandTotal.toFixed(2)}</td>
                <td>${getStatusBadge(q.status)}</td>
                <td>${new Date(q.createdAt).toLocaleDateString()}</td>
                <td><div class="action-btns">${actions}</div></td>
            `;
            tbody.appendChild(tr);
        });
    }
}

async function updateStatus(id, action) {
    const { data } = await fetchApi(`/quotations/${id}/${action}`, 'POST');
    if (data.success) {
        loadQuotations();
    } else {
        alert(data.message);
    }
}

async function convertOrder(id) {
    const { data } = await fetchApi(`/quotations/${id}/convert`, 'POST');
    if (data.success) {
        alert('Converted to order successfully!');
        window.location.href = 'orders.html';
    } else {
        alert(data.message);
    }
}

async function openApproveModal(id) {
    document.getElementById('approveQuoteId').value = id;
    document.getElementById('approveComments').value = '';
    document.getElementById('quoteSummary').innerHTML = 'Loading details...';
    document.getElementById('approveModal').classList.add('active');

    // Fetch and display quotation details for Manager review
    const { data } = await fetchApi(`/quotations/${id}`);
    if (data.success) {
        const q = data.data;
        let itemsHtml = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 0.5rem;">
                <thead>
                    <tr>
                        <th style="padding: 0.5rem; text-align: left; border-bottom: 1px solid var(--border); font-size: 0.75rem; color: var(--text-secondary);">Product</th>
                        <th style="padding: 0.5rem; text-align: left; border-bottom: 1px solid var(--border); font-size: 0.75rem; color: var(--text-secondary);">Qty</th>
                        <th style="padding: 0.5rem; text-align: left; border-bottom: 1px solid var(--border); font-size: 0.75rem; color: var(--text-secondary);">Price</th>
                        <th style="padding: 0.5rem; text-align: left; border-bottom: 1px solid var(--border); font-size: 0.75rem; color: var(--text-secondary);">Total</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        q.items.forEach(item => {
            itemsHtml += `
                <tr>
                    <td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">${item.productName}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">${item.quantity}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">₹${item.unitPrice.toFixed(2)}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">₹${item.amount.toFixed(2)}</td>
                </tr>
            `;
        });
        itemsHtml += `</tbody></table>`;
        
        const summaryHtml = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <div>
                    <p style="margin-bottom: 0.25rem; color: var(--text-secondary);">Customer</p>
                    <p style="font-weight: 600; font-size: 1.1rem;">${q.customerDetails?.name}</p>
                </div>
                <div style="text-align: right; background: var(--bg-primary); padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border);">
                    <div style="display: flex; justify-content: space-between; gap: 2rem; margin-bottom: 0.25rem; font-size: 0.8rem; color: var(--text-secondary);">
                        <span>Subtotal:</span>
                        <span>₹${q.subtotal.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; gap: 2rem; margin-bottom: 0.25rem; font-size: 0.8rem; color: var(--text-secondary);">
                        <span>Discount (${q.discountPercent}%):</span>
                        <span>-₹${q.discountAmount.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; gap: 2rem; margin-bottom: 0.5rem; font-size: 0.8rem; color: var(--text-secondary);">
                        <span>Tax Amount:</span>
                        <span>₹${q.taxAmount.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; gap: 2rem; padding-top: 0.5rem; border-top: 1px solid var(--border); font-weight: 700;">
                        <span>Grand Total:</span>
                        <span style="color: var(--accent);">₹${q.grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            ${itemsHtml}
        `;
        document.getElementById('quoteSummary').innerHTML = summaryHtml;
    } else {
        document.getElementById('quoteSummary').innerHTML = '<span style="color: var(--danger);">Failed to load quotation details.</span>';
    }
}

async function openViewModal(id) {
    document.getElementById('viewQuoteSummary').innerHTML = 'Loading details...';
    document.getElementById('viewModal').classList.add('active');

    // Fetch and display quotation details for view mode
    const { data } = await fetchApi(`/quotations/${id}`);
    if (data.success) {
        const q = data.data;
        let itemsHtml = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 0.5rem;">
                <thead>
                    <tr>
                        <th style="padding: 0.5rem; text-align: left; border-bottom: 1px solid var(--border); font-size: 0.75rem; color: var(--text-secondary);">Product</th>
                        <th style="padding: 0.5rem; text-align: left; border-bottom: 1px solid var(--border); font-size: 0.75rem; color: var(--text-secondary);">Qty</th>
                        <th style="padding: 0.5rem; text-align: left; border-bottom: 1px solid var(--border); font-size: 0.75rem; color: var(--text-secondary);">Price</th>
                        <th style="padding: 0.5rem; text-align: left; border-bottom: 1px solid var(--border); font-size: 0.75rem; color: var(--text-secondary);">Total</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        q.items.forEach(item => {
            itemsHtml += `
                <tr>
                    <td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">${item.productName}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">${item.quantity}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">₹${item.unitPrice.toFixed(2)}</td>
                    <td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">₹${item.amount.toFixed(2)}</td>
                </tr>
            `;
        });
        itemsHtml += `</tbody></table>`;
        
        const summaryHtml = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <div>
                    <p style="margin-bottom: 0.25rem; color: var(--text-secondary);">Customer</p>
                    <p style="font-weight: 600; font-size: 1.1rem;">${q.customerDetails?.name}</p>
                </div>
                <div style="text-align: right; background: var(--bg-surface); padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border); box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                    <div style="display: flex; justify-content: space-between; gap: 2rem; margin-bottom: 0.25rem; font-size: 0.8rem; color: var(--text-secondary);">
                        <span>Subtotal:</span>
                        <span>₹${q.subtotal.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; gap: 2rem; margin-bottom: 0.25rem; font-size: 0.8rem; color: var(--text-secondary);">
                        <span>Discount (${q.discountPercent}%):</span>
                        <span>-₹${q.discountAmount.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; gap: 2rem; margin-bottom: 0.5rem; font-size: 0.8rem; color: var(--text-secondary);">
                        <span>Tax Amount:</span>
                        <span>₹${q.taxAmount.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; gap: 2rem; padding-top: 0.5rem; border-top: 1px solid var(--border); font-weight: 700;">
                        <span>Grand Total:</span>
                        <span style="color: var(--accent);">₹${q.grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            ${itemsHtml}
        `;
        document.getElementById('viewQuoteSummary').innerHTML = summaryHtml;
    } else {
        document.getElementById('viewQuoteSummary').innerHTML = '<span style="color: var(--danger);">Failed to load quotation details.</span>';
    }
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

async function submitReview(status) {
    const id = document.getElementById('approveQuoteId').value;
    const comments = document.getElementById('approveComments').value;
    const action = status === 'APPROVED' ? 'approve' : 'reject';
    
    const { data } = await fetchApi(`/quotations/${id}/${action}`, 'POST', { comments });
    if (data.success) {
        closeModal('approveModal');
        loadQuotations();
    } else {
        alert(data.message);
    }
}
