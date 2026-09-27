# Quotation to Order System

A full-stack, role-based web application designed to streamline the sales pipeline from generating quotations to finalizing orders. It features a modern, clean UI ("Ocean Breeze" theme) and robust backend workflows for multi-tier approvals.

## 🚀 Features

- **Role-Based Access Control (RBAC):**
  - **Sales Executive:** Create quotations, send them to customers, and convert accepted quotes to orders.
  - **Manager:** Review and approve/reject high-value quotations to enforce business rules.
  - **Admin:** Full access to manage users, customers, products, quotations, and orders.
- **Quotation Management:** Generate professional quotes with automatic subtotal, discount, and tax calculations.
- **Order Processing:** Seamless one-click conversion from an approved Quotation to a Confirmed Order.
- **Smart Dashboards:** Real-time metrics tailored to the logged-in user, pushing actionable items (like pending approvals) to the top of the queue.
- **Modern UI/UX:** Responsive, sidebar-based navigation with a professional, glassmorphism-inspired "Ocean Breeze" light theme.

## 🛠️ Technology Stack

- **Frontend:** HTML5, Vanilla CSS3 (Custom Design System), Vanilla JavaScript (ES6+), Fetch API.
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose ORM)
- **Authentication:** JWT (JSON Web Tokens) with HttpOnly cookies.

## ⚙️ Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas URI)

### 1. Clone the repository
```bash
git clone https://github.com/atul8660/quotation-order-system.git
cd quotation-order-system
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=development
```

### 3. Database Seeding (Optional)
To populate the database with test users (Admin, Manager, Sales):
```bash
node seed.js
```

### 4. Run the Application
You will need two terminal windows.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
*Serve the frontend directory using any static file server (e.g., Live Server, http-server, or Python).*
```bash
cd frontend
npx http-server -p 3000
```

Visit `http://localhost:3000/login` in your browser.

## 🧪 Test Accounts
If you ran the seed script, you can log in with:
- **Sales:** `sales@example.com` | Password: `password123`
- **Manager:** `manager@example.com` | Password: `password123`
- **Admin:** `admin@example.com` | Password: `password123`

## 📂 Project Structure
```text
├── backend/
│   ├── config/         # Database connection
│   ├── controllers/    # Route logic & business rules
│   ├── middleware/     # Auth & Role validation
│   ├── models/         # Mongoose Schemas (User, Quotation, Order, etc.)
│   ├── routes/         # Express API routes
│   └── server.js       # Entry point
└── frontend/
    ├── css/            # Style tokens and theme
    ├── js/             # API wrappers and DOM logic
    └── *.html          # UI Views
```
