const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  const { email, password } = JSON.parse(event.body);

  try {
    await client.connect();
    const db = client.db("build-a-banner");
    const users = db.collection("users");

    const user = await users.findOne({ email });

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

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Login successful", userId: user._id }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error", details: err.message }),
    };
  } finally {
    await client.close();
  }
};