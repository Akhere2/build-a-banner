// netlify-functions/cart.js
const mongoose = require("mongoose");
//const { Handler } = require("@netlify/functions");
//const cors = require("cors");

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI; // Get the MongoDB URI from environment variable
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const cartItemSchema = new mongoose.Schema({
  image: String,
  price: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CartItem = mongoose.model("CartItem", cartItemSchema);

const handler = async (event, context) => {
  if (event.httpMethod === "POST") {
    try {
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
        body: JSON.stringify({ message: "Server error." }),
      };
    }
  }
  
  return {
    statusCode: 405,
    body: JSON.stringify({ message: "Method Not Allowed" }),
  };
};

module.exports.handler = handler;