const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  console.log("📥 Stripe checkout request received:", {
    method: event.httpMethod,
    rawBody: event.body,
  });

  if (event.httpMethod !== "POST") {
    console.warn("⚠️ Invalid HTTP method:", event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    const { email, cart } = JSON.parse(event.body);
    console.log("🧾 Parsed checkout request:", { email, cartLength: cart.length });

    if (!email || !Array.isArray(cart) || cart.length === 0) {
      console.warn("❌ Invalid request — missing email or empty cart");
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing email or cart data" }),
      };
    }

    // Build Stripe line items
    const lineItems = cart.map((item, index) => {
      console.log(`🛒 Item ${index + 1}:`, {
        price: item.price,
        image: item.image?.substring(0, 50), // trim for logs
      });

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Custom Banner",
            images: [item.image], // must be HTTPS and public for Stripe to render
          },
          unit_amount: Math.round(item.price * 100), // ensure cents
        },
        quantity: 1,
      };
    });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer_email: email,
      success_url: `${process.env.CLIENT_URL}/success`,
      cancel_url: `${process.env.CLIENT_URL}/cart`,
    });

    console.log("✅ Stripe session created:", session.id);

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error("❌ Stripe checkout error:", {
      message: err.message,
      stack: err.stack,
    });

    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

