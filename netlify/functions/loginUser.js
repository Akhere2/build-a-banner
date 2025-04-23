const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const connectToDatabase = require("../utils/db");
const User = require("../models/User");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  try {
    await connectToDatabase();

    const { email, password } = JSON.parse(event.body);

    const user = await User.findOne({ email });

    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "User not found" }),
      };
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Invalid credentials" }),
      };
    }

    const sessionId = uuidv4();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Login successful",
        userId: user._id,
        sessionId,
        email: user.email,
      }),
    };
  } catch (err) {
    console.error("Login error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error", details: err.message }),
    };
  }
};
