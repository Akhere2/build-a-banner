const connectToDatabase = require("../utils/db");
const User = require("../models/User");

exports.handler = async (event) => {
  console.log("📥 Remove from cart request:", {
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

    const { email, index } = JSON.parse(event.body);

    if (!email || index === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields" }),
      };
    }

    const user = await User.findOne({ email });
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "User not found" }),
      };
    }

    if (index < 0 || index >= user.cart.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid cart index" }),
      };
    }

    user.cart.splice(index, 1);
    await user.save();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Item removed from cart", cart: user.cart }),
    };
  } catch (err) {
    console.error("❌ Error removing cart item:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server error", error: err.message }),
    };
  }
};
