const mongoose = require("mongoose");

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

module.exports = mongoose.models.User || mongoose.model("User", userSchema);