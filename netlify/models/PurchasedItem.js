const mongoose = require("mongoose");

const purchasedItemSchema = new mongoose.Schema({
  email: String,
  image: String,
  price: Number,
  phone: String,
  address: String,
  purchasedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.PurchasedItem || mongoose.model("PurchasedItem", purchasedItemSchema);