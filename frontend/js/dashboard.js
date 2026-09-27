document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    
    // Load dashboard stats
    try {
        const [custRes, prodRes, quotRes, ordRes] = await Promise.all([
            fetchApi('/customers'),
            fetchApi('/products'),
            fetchApi('/quotations'),
            fetchApi('/orders')
        ]);
        
        if (custRes.data.success) document.getElementById('stat-customers').textContent = custRes.data.data.length;
        if (prodRes.data.success) document.getElementById('stat-products').textContent = prodRes.data.data.length;
        if (quotRes.data.success) {
            const quotations = quotRes.data.data;
            document.getElementById('stat-quotations').textContent = quotations.length;
            document.getElementById('stat-pending').textContent = quotations.filter(q => q.status === 'PENDING_APPROVAL').length;
            document.getElementById('stat-accepted').textContent = quotations.filter(q => q.status === 'ACCEPTED').length;
        }
        if (ordRes.data.success) document.getElementById('stat-orders').textContent = ordRes.data.data.length;
    } catch (error) {
        console.error("Dashboard load error", error);
    }
    
    // Apply role-based visibility
    const user = getUser();
    if (user) {
        document.getElementById('dashboardTitle').textContent = `Welcome, ${user.name}!`;
        const subtitle = document.getElementById('dashboardSubtitle');

        if (user.role === 'MANAGER') {
            subtitle.textContent = 'Manager Portal';
            document.getElementById('card-customers').style.display = 'none';
            document.getElementById('card-products').style.display = 'none';
        }
        if (user.role === 'SALES') {
            subtitle.textContent = 'Sales Executive Portal';
            document.getElementById('card-products').style.display = 'none';
        }
        if (user.role === 'ADMIN') {
            subtitle.textContent = 'Admin Control Center';
            // Admin sees everything
        }
    }
});
