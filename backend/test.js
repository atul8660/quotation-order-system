async function test() {
    try {
        console.log("Logging in as Sales...");
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'sales@example.com', password: 'password123' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        const config = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
        console.log("Token:", token.substring(0, 20) + "...");

        console.log("Creating Customer...");
        const custRes = await fetch('http://localhost:5000/api/customers', {
            method: 'POST', headers: config,
            body: JSON.stringify({ name: 'Test Customer', email: 'test@customer.com' })
        });
        const custData = await custRes.json();
        if(!custData.success) { console.error("Customer Error:", custData); return; }
        const customerId = custData.data._id;
        console.log("Customer ID:", customerId);

        console.log("Creating Product...");
        const prodRes = await fetch('http://localhost:5000/api/products', {
            method: 'POST', headers: config,
            body: JSON.stringify({ name: 'Test Product', sku: 'TEST-001' + Date.now(), price: 100, taxRate: 10 })
        });
        const prodData = await prodRes.json();
        if(!prodData.success) { console.error("Product Error:", prodData); return; }
        const productId = prodData.data._id;
        console.log("Product ID:", productId);

        console.log("Creating Quotation...");
        const quoteRes = await fetch('http://localhost:5000/api/quotations', {
            method: 'POST', headers: config,
            body: JSON.stringify({
                customerId: customerId,
                items: [{ productId: productId, quantity: 2 }]
            })
        });
        const quoteData = await quoteRes.json();
        if(!quoteData.success) { console.error("Quotation Error:", quoteData); return; }
        console.log("Quotation created successfully:", quoteData.data._id);
        
    } catch (error) {
        console.error(error.message);
    }
}

test();
