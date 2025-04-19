const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid"); // Import uuid to generate session IDs

const uri = process.env.MONGO_URI;

// Define User schema & model
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Prevent model overwrite in dev
const User = mongoose.models.User || mongoose.model("User", userSchema);

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  const { email, password } = JSON.parse(event.body);

  try {
    // Connect to MongoDB
    await mongoose.connect(uri);

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

    // Generate a unique session ID using UUID
    const sessionId = uuidv4();

    // Optionally, store the session ID in a session collection in MongoDB for future validation (not shown here)

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Login successful",
        userId: user._id,       // Keep this if you still use userId anywhere
        sessionId: sessionId,
        email: user.email       // ✅ Add this
      }),
    };
  } catch (err) {
    console.error("Login error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error", details: err.message }),
    };
  } finally {
    await mongoose.connection.close();
  }
};