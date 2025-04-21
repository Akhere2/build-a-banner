const mongoose = require("mongoose");

let conn = null;

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
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
  conn = await mongoose.connect(uri, {
    dbName: "bannerdb",
    serverSelectionTimeoutMS: 8000,
  });

  User = mongoose.models.User || mongoose.model("User", userSchema);
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

    user.cart.splice(index, 1);
    await user.save();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Item removed from cart" }),
    };
  } catch (err) {
    console.error("Error removing cart item:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server error", error: err.message }),
    };
  }
};
