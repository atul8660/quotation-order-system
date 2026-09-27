document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // Check if user is admin
    const user = getUser();
    if (!user || user.role !== 'ADMIN') {
        alert('Unauthorized access. Only Admins can view this page.');
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Fetch and load users
    loadUsers();

    document.getElementById('userForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            name: document.getElementById('userName').value,
            email: document.getElementById('userEmail').value,
            password: document.getElementById('userPassword').value,
            role: document.getElementById('userRole').value
        };

        const { data } = await fetchApi('/auth/register', 'POST', payload);
        if (data.success) {
            alert('User created successfully!');
            closeModal('userModal');
            loadUsers();
        } else {
            alert(data.message);
        }
    });
});

async function loadUsers() {
    const { data } = await fetchApi('/auth/users');
    const tbody = document.getElementById('usersTable');
    tbody.innerHTML = '';

    if (data.success) {
        data.data.forEach(user => {
            const roleBadgeClass = user.role === 'ADMIN' ? 'badge-converted' : user.role === 'MANAGER' ? 'badge-approved' : 'badge-sent';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="badge ${roleBadgeClass}">${user.role}</span></td>
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
    document.getElementById('userForm').reset();
}
