const mongoose = require("mongoose");

let conn = null;

// Extend schema to include a userId field
const cartItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to User model
    required: true,
    ref: "User",
  },
  image: String,
  price: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

let CartItem;

const connectToDatabase = async () => {
  if (conn) return conn;

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not defined");

  conn = await mongoose.connect(uri, {
    dbName: "bannerdb",
    serverSelectionTimeoutMS: 8000,
  });

  // Avoid model overwrite error
  CartItem = mongoose.models.CartItem || mongoose.model("CartItem", cartItemSchema);

  return conn;
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  try {
    await connectToDatabase();

    const { userId, image, price } = JSON.parse(event.body);

    if (!userId || !image || price === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields." }),
      };
    }

    const item = new CartItem({ userId, image, price });
    await item.save();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Canvas added to cart!", item }),
    };
  } catch (error) {
    console.error("Error saving to MongoDB:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server error.", error: error.message }),
    };
  }
};

