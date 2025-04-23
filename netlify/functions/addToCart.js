const connectToDatabase = require("../utils/db");
const User = require("../models/User");

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

    const { email, image, price } = JSON.parse(event.body);
    console.log("Parsed body:", { email, imageLength: image?.length, price });

    if (!email || !image || price === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields." }),
      };
    }

    const user = await User.findOne({ email });
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "User not found." }),
      };
    }

    user.cart.push({ image, price, addedAt: new Date() });
    await user.save();

    console.log(`✅ Item added to ${email}'s cart`);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Item added to cart!", cart: user.cart }),
    };
  } catch (error) {
    console.error("❌ Error adding to cart:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server error", error: error.message }),
    };
  }
};


