const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1); // Stop the app if it can't connect
  }
};

connectDB();