const mongoose = require("mongoose");

let conn = null;

const cartItemSchema = new mongoose.Schema({
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

  console.log("Connecting to MongoDB...");
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not defined");

  const start = Date.now();

  conn = await mongoose.connect(uri, {
    dbName: "bannerdb",
    serverSelectionTimeoutMS: 8000, // try to connect faster/fail sooner
  });

  const duration = Date.now() - start;
  console.log(`Connected to MongoDB in ${duration}ms`);

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
    const { image, price } = JSON.parse(event.body);

    const item = new CartItem({ image, price });
    await item.save();

    console.log("Item saved to MongoDB");

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Canvas added to cart!" }),
    };
  } catch (error) {
    console.error("Error saving to MongoDB:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server error.", error: error.message }),
    };
  }
};

