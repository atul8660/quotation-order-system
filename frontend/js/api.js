// Helper for making API requests with JWT
async function fetchApi(endpoint, method = 'GET', body = null) {
    const token = getToken();
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
    if (body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }
    
    const res = await fetch(`${API_URL}${endpoint}`, options);
    const data = await res.json();
    if (res.status === 401) {
        logout(); // Token expired or invalid
    }
    return { status: res.status, data };
}
