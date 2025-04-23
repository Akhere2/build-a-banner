const stripe = require("stripe")(process.env.SECRET_STRIPE_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    const { email, cart, sessionId } = JSON.parse(event.body);
    console.log("🧾 Parsed checkout request:", { email, cartLength: cart.length, sessionId });

    if (!email || !Array.isArray(cart) || cart.length === 0 || !sessionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing email, cart data, or sessionId" }),
      };
    }

    const lineItems = cart.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Custom Banner",
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer_email: email,
      shipping_address_collection: {
        allowed_countries: ["US", "CA"],
      },
      success_url: `${process.env.CLIENT_URL}/success`,
      cancel_url: `${process.env.CLIENT_URL}/cart/${sessionId}`, // 👈 dynamic sessionId used here
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error("❌ Stripe checkout error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};