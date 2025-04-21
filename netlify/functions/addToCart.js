const mongoose = require("mongoose");

let conn = null;

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

const connectToDatabase = async () => {
  if (conn) return conn;

  const uri = process.env.MONGO_URI;
  console.log("Connecting to MongoDB...");
  if (!uri) throw new Error("MONGO_URI is not defined");

  try {
    conn = await mongoose.connect(uri, {
      dbName: "bannerdb", // ✅ explicitly set database
      serverSelectionTimeoutMS: 8000,
    });
    console.log("✅ Connected to MongoDB");

    User = mongoose.models.User || mongoose.model("User", userSchema);
    return conn;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
};

exports.handler = async (event) => {
  console.log("Incoming request:", {
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

    const { email, image, price } = JSON.parse(event.body);
    console.log("Parsed body:", { email, imageLength: image?.length, price });

    if (!email || !image || price === undefined) {
      console.warn("Missing one or more required fields.");
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields." }),
      };
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.warn(`No user found with email: ${email}`);
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "User not found." }),
      };
    }

    // ✅ Ensure cart is initialized
    if (!Array.isArray(user.cart)) {
      user.cart = [];
    }

    const newItem = { image, price, addedAt: new Date() };
    user.cart.push(newItem);
    await user.save();

    console.log(`✅ Item added to ${email}'s cart`);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Item added to cart!", cart: user.cart }),
    };
  } catch (error) {
    console.error("❌ Error in handler:", {
      message: error.message,
      stack: error.stack,
    });

    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server error", error: error.message }),
    };
  }
};



