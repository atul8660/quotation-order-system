const API_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorMsg = document.getElementById('errorMsg');
            
            try {
                const res = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                
                if (data.success) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.href = 'dashboard.html';
                } else {
                    errorMsg.textContent = data.message;
                    errorMsg.style.display = 'block';
                }
            } catch (err) {
                errorMsg.textContent = 'Server error. Please try again.';
                errorMsg.style.display = 'block';
            }
        });
    }
});

// Utility functions for auth
function getToken() {
    return localStorage.getItem('token');
}

function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function checkAuth() {
    const token = getToken();
    if (!token && !window.location.pathname.endsWith('login.html')) {
        window.location.href = 'login.html';
        return;
    }
    
    const user = getUser();
    if (user) {
        // Populate sidebar user info
        const avatarEl = document.getElementById('userAvatar');
        const nameEl = document.getElementById('sidebarUserName');
        const roleEl = document.getElementById('sidebarUserRole');
        if (avatarEl) avatarEl.textContent = user.name ? user.name.charAt(0).toUpperCase() : 'U';
        if (nameEl) nameEl.textContent = user.name || 'User';
        if (roleEl) roleEl.textContent = user.role || 'Role';

        // Show 'Users' tab for ADMIN
        if (user.role === 'ADMIN') {
            const navUsers = document.getElementById('nav-users');
            if (navUsers) {
                navUsers.style.display = 'flex';
            }
            // Hide customers, quotations, and orders tabs
            const navLinks = document.querySelectorAll('.sidebar-nav a');
            navLinks.forEach(link => {
                const text = link.textContent.trim();
                if (text === 'Customers' || text === 'Quotations' || text === 'Orders') {
                    link.style.display = 'none';
                }
            });
        }
        if (user.role === 'MANAGER') {
            // Hide customers and products tabs
            const navLinks = document.querySelectorAll('.sidebar-nav a');
            navLinks.forEach(link => {
                const text = link.textContent.trim();
                if (text === 'Customers' || text === 'Products') {
                    link.style.display = 'none';
                }
            });
        }
        if (user.role === 'SALES') {
            // Hide products tab
            const navLinks = document.querySelectorAll('.sidebar-nav a');
            navLinks.forEach(link => {
                const text = link.textContent.trim();
                if (text === 'Products') {
                    link.style.display = 'none';
                }
            });
        }
    }
}
