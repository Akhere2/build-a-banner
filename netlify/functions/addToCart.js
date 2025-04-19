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
  if (!uri) throw new Error("MONGO_URI is not defined");

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

    const { email, image, price } = JSON.parse(event.body);

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

    const newItem = { image, price };
    user.cart.push(newItem);
    await user.save();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Item added to cart!", cart: user.cart }),
    };
  } catch (error) {
    console.error("Error updating user cart:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server error", error: error.message }),
    };
  }
};


