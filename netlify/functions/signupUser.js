const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

const uri = process.env.MONGO_URI;

// Check if MONGO_URI is set properly
if (!uri) {
  console.error("MongoDB URI is missing! Please set the MONGO_URI environment variable.");
  process.exit(1); // Exit the process if MongoDB URI is not set
}

let client;

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  const { email, password } = JSON.parse(event.body);

  try {
    // Initialize MongoDB client if not already initialized
    if (!client) {
      client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    // Ensure that the client is connected before performing any operations
    if (!client.isConnected()) {
      await client.connect();
    }

    const db = client.db("build-a-banner");
    const users = db.collection("users");

    // Check if user already exists
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: "User already exists" }),
      };
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with hashed password
    const result = await users.insertOne({
      email,
      password: hashedPassword, // Save the hashed password
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User created", id: result.insertedId }),
    };
  } catch (err) {
    console.error("Error in creating user:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error", details: err.message }),
    };
  } finally {
    // Ensure the client is closed properly after the operation
    if (client && client.isConnected()) {
      await client.close();
    }
  }
};
