const mongoose = require("mongoose");

//let conn = null;

// Define schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  cart: [
    {
      image: String,
      price: Number,
      addedAt: { type: Date, default: Date.now },
    },
  ],
});

let User;

// Connect to MongoDB
const connectToDatabase = async () => {
    if (mongoose.connection.readyState === 1) {
      console.log("✅ Reusing existing MongoDB connection");
      return;
    }
  
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error("❌ MONGO_URI is not defined");
      throw new Error("MONGO_URI is not defined");
    }
  
    try {
      console.log("🔌 Connecting to MongoDB...");
      await mongoose.connect(uri, {
        dbName: "bannerdb",
        serverSelectionTimeoutMS: 8000,
      });
      console.log("✅ Connected to MongoDB");
  
      User = mongoose.models.User || mongoose.model("User", userSchema);
      return;
    } catch (err) {
      console.error("❌ MongoDB connection error:", err);
      throw err;
    }
  };

exports.handler = async (event) => {
  console.log("📥 Incoming request:", {
    method: event.httpMethod,
    body: event.body,
  });

  if (event.httpMethod !== "POST") {
    console.warn("⚠️ Invalid HTTP method:", event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  try {
    await connectToDatabase();

    const body = JSON.parse(event.body);
    console.log("📦 Parsed body:", body);

    const { email } = body;

    if (!email) {
      console.warn("⚠️ Missing email in request");
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Email is required" }),
      };
    }

    console.log(`🔍 Searching for user with email: ${email}`);
    const user = await User.findOne({ email });

    if (!user) {
      console.warn(`❌ No user found with email: ${email}`);
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "User not found" }),
      };
    }



    return {
      statusCode: 200,
      body: JSON.stringify({ cart: user.cart }),
    };
  } catch (error) {
    console.error("❌ Error retrieving cart:", {
      message: error.message,
      stack: error.stack,
    });
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server error", error: error.message }),
    };
  }
};
