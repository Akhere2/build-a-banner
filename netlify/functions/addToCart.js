const mongoose = require("mongoose");

let conn = null; // global to prevent multiple connections in serverless

const cartItemSchema = new mongoose.Schema({
  image: String,
  price: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

let CartItem; // model will be initialized later

const connectToDatabase = async () => {
  const startTime = Date.now();
  if (conn) return conn;

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not defined");

  console.log("Connecting to MongoDB...");
  conn = await mongoose.connect(uri, {
    dbName: "bannerdb",
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log(`MongoDB connection time: ${Date.now() - startTime}ms`);

  // Reuse the model if it already exists
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
