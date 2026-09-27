const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const User = require("./models/User");
const connectDB = require("./config/db");

const seedUsers = async () => {
    try {
        await connectDB();
        
        const count = await User.countDocuments();
        if (count === 0) {
            console.log("No users found. Seeding test accounts...");
            const hashedPassword = await bcrypt.hash("password123", 10);
            
            await User.insertMany([
                { name: "Admin User", email: "admin@example.com", password: hashedPassword, role: "ADMIN" },
                { name: "Sales User", email: "sales@example.com", password: hashedPassword, role: "SALES" },
                { name: "Manager User", email: "manager@example.com", password: hashedPassword, role: "MANAGER" }
            ]);
            console.log("Test accounts seeded successfully!");
        } else {
            console.log(`Found ${count} users. No seeding needed.`);
        }
        
        process.exit(0);
    } catch (err) {
        console.error("Seeding error:", err);
        process.exit(1);
    }
};

seedUsers();
