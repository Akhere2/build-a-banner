const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const mongoose = require("mongoose");
const PurchasedItem = require("../models/PurchasedItem"); // ✅ you already imported this

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let sig = event.headers["stripe-signature"];
  let body = event.body;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object;
    const email = session.customer_email;

    try {
      await mongoose.connect(process.env.MONGO_URI, { dbName: "bannerdb" });

      const User = mongoose.models.User || mongoose.model("User"); // ✅ define only User if needed

      const user = await User.findOne({ email });
      const itemsToMove = user.cart || [];

      for (const item of itemsToMove) {
        await PurchasedItem.create({
          email,
          image: item.image,
          price: item.price,
          shipping: session.customer_details.address,
          phone: session.customer_details.phone,
        });
      }

      user.cart = [];
      await user.save();
    } catch (err) {
      console.error("Error processing completed checkout:", err);
    }
  }

  return { statusCode: 200, body: "Success" };
};

