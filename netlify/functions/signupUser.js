const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const uri = process.env.MONGO_URI;

// Check if MONGO_URI is set properly
if (!uri) {
  console.error("MongoDB URI is missing! Please set the MONGO_URI environment variable.");
  process.exit(1); // Exit the process if MongoDB URI is not set
}

// Define a User schema using Mongoose
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Check if the model is already defined to avoid overwriting it
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
    // Connect to the MongoDB database using Mongoose
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: "User already exists" }),
      };
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with hashed password
    const newUser = new User({
      email,
      password: hashedPassword,
    });

    // Save the user to the database
    await newUser.save();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User created", id: newUser._id }),
    };
  } catch (err) {
    console.error("Error in creating user:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error", details: err.message }),
    };
  } finally {
    // Close the Mongoose connection
    mongoose.connection.close();
  }
};
