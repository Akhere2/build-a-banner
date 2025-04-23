const mongoose = require("mongoose");
const User = require("../models/User"); // ✅ Use external schema

const connectToDatabase = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not defined");

  if (mongoose.connection.readyState === 0) {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(uri, {
      dbName: "bannerdb",
      serverSelectionTimeoutMS: 8000,
    });
    console.log("✅ Connected to MongoDB");
  }

  // Optional: verify connection is alive
  await mongoose.connection.db.admin().ping();
};

exports.handler = async (event) => {
  console.log("📥 Incoming request:", {
    method: event.httpMethod,
    body: event.body,
  });

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  try {
    await connectToDatabase();

    const { email } = JSON.parse(event.body);
    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Email is required" }),
      };
    }

    console.log(`🔍 Looking for user: ${email}`);
    const user = await User.findOne({ email });

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "User not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ cart: user.cart }),
    };
  } catch (err) {
    console.error("❌ Error retrieving cart:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server error", error: err.message }),
    };
  }
};