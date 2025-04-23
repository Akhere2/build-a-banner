const mongoose = require("mongoose");

const connectToDatabase = async () => {
  if (mongoose.connection.readyState >= 1) {
    console.log("✅ Using existing MongoDB connection");
    return;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("❌ MONGO_URI is not defined");

  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(uri, {
      dbName: "bannerdb",
      serverSelectionTimeoutMS: 8000,
    });
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    throw err;
  }
};

module.exports = connectToDatabase;