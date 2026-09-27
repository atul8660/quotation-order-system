document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadProducts();

    document.getElementById('searchInput').addEventListener('input', (e) => {
        loadProducts(e.target.value);
    });

    document.getElementById('productForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('productId').value;
        const payload = {
            name: document.getElementById('prodName').value,
            sku: document.getElementById('prodSku').value,
            price: Number(document.getElementById('prodPrice').value),
            taxRate: Number(document.getElementById('prodTax').value),
            isActive: document.getElementById('prodActive').value === 'true'
        };

        const method = id ? 'PUT' : 'POST';
        const endpoint = id ? `/products/${id}` : '/products';

        const { data } = await fetchApi(endpoint, method, payload);
        if (data.success) {
            closeModal('productModal');
            loadProducts();
        } else {
            alert(data.message);
        }
    });
});

async function loadProducts(search = '') {
    const endpoint = search ? `/products?search=${encodeURIComponent(search)}` : '/products';
    const { data } = await fetchApi(endpoint);
    const tbody = document.getElementById('productsTable');
    tbody.innerHTML = '';

    if (data.success) {
        data.data.forEach(prod => {
            const statusBadge = prod.isActive ? '<span class="badge badge-approved">Active</span>' : '<span class="badge badge-rejected">Inactive</span>';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${prod.name}</td>
                <td>${prod.sku}</td>
                <td>₹${prod.price.toFixed(2)}</td>
                <td>${prod.taxRate}%</td>
                <td>${statusBadge}</td>
                <td class="action-btns">
                    <button onclick="editProduct('${prod._id}')" class="btn btn-sm" style="background: rgba(255,255,255,0.1);">Edit</button>
                    <button onclick="deleteProduct('${prod._id}')" class="btn btn-danger btn-sm">Del</button>
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
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('modalTitle').textContent = 'Add Product';
}

async function editProduct(id) {
    const { data } = await fetchApi(`/products/${id}`);
    if (data.success) {
        const p = data.data;
        document.getElementById('productId').value = p._id;
        document.getElementById('prodName').value = p.name;
        document.getElementById('prodSku').value = p.sku;
        document.getElementById('prodPrice').value = p.price;
        document.getElementById('prodTax').value = p.taxRate;
        document.getElementById('prodActive').value = p.isActive.toString();
        document.getElementById('modalTitle').textContent = 'Edit Product';
        openModal('productModal');
    }
}

async function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        const { data } = await fetchApi(`/products/${id}`, 'DELETE');
        if (data.success) {
            loadProducts();
        } else {
            alert(data.message);
        }
    }
}
