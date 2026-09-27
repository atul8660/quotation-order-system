document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadCustomers();

    document.getElementById('searchInput').addEventListener('input', (e) => {
        loadCustomers(e.target.value);
    });

    document.getElementById('customerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('customerId').value;
        const payload = {
            name: document.getElementById('custName').value,
            companyName: document.getElementById('custCompany').value,
            email: document.getElementById('custEmail').value,
            phone: document.getElementById('custPhone').value
        };

        const method = id ? 'PUT' : 'POST';
        const endpoint = id ? `/customers/${id}` : '/customers';

        const { status, data } = await fetchApi(endpoint, method, payload);
        if (data.success) {
            closeModal('customerModal');
            loadCustomers();
        } else {
            alert(data.message);
        }
    });
});

async function loadCustomers(search = '') {
    const endpoint = search ? `/customers?search=${encodeURIComponent(search)}` : '/customers';
    const { data } = await fetchApi(endpoint);
    const tbody = document.getElementById('customersTable');
    tbody.innerHTML = '';

    if (data.success) {
        data.data.forEach(cust => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cust.name}</td>
                <td>${cust.companyName || '-'}</td>
                <td>${cust.email || '-'}</td>
                <td>${cust.phone || '-'}</td>
                <td class="action-btns">
                    <button onclick="editCustomer('${cust._id}')" class="btn btn-sm" style="background: rgba(255,255,255,0.1);">Edit</button>
                    <button onclick="deleteCustomer('${cust._id}')" class="btn btn-danger btn-sm">Del</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    document.getElementById('customerForm').reset();
    document.getElementById('customerId').value = '';
    document.getElementById('modalTitle').textContent = 'Add Customer';
}

async function editCustomer(id) {
    const { data } = await fetchApi(`/customers/${id}`);
    if (data.success) {
        const c = data.data;
        document.getElementById('customerId').value = c._id;
        document.getElementById('custName').value = c.name;
        document.getElementById('custCompany').value = c.companyName || '';
        document.getElementById('custEmail').value = c.email || '';
        document.getElementById('custPhone').value = c.phone || '';
        document.getElementById('modalTitle').textContent = 'Edit Customer';
        openModal('customerModal');
    }
}

async function deleteCustomer(id) {
    if (confirm('Are you sure you want to delete this customer?')) {
        const { data } = await fetchApi(`/customers/${id}`, 'DELETE');
        if (data.success) {
            loadCustomers();
        } else {
            alert(data.message);
        }
    }
}
