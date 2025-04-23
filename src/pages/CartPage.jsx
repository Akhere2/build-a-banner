import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { sessionId } = useParams();

  const fetchCart = async () => {
    const email = localStorage.getItem("userEmail");
    if (!email) {
      alert("Please log in.");
      return;
    }

    try {
      const res = await axios.post("/.netlify/functions/getCart", { email });
      setCartItems(res.data.cart || []);
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      alert("Error fetching cart");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (index) => {
    const email = localStorage.getItem("userEmail");
    try {
      await axios.post("/.netlify/functions/deleteFromCart", { email, index });
      const updatedItems = [...cartItems];
      updatedItems.splice(index, 1);
      setCartItems(updatedItems);
    } catch (error) {
      console.error("Failed to delete item:", error);
      alert("Failed to remove item from cart.");
    }
  };

  const handleCheckout = async () => {
    const email = localStorage.getItem("userEmail");
    try {
      const res = await axios.post("/.netlify/functions/createCheckoutSession", {
        email,
        cart: cartItems,
        sessionId, // include sessionId in the request if needed in backend
      });
      window.location.href = res.data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Failed to start checkout");
    }
  };

  useEffect(() => {
    const storedSessionId = localStorage.getItem("sessionId");
    const email = localStorage.getItem("userEmail");

    if (!email || storedSessionId !== sessionId) {
      alert("Invalid session. Redirecting to login.");
      return navigate("/login");
    }

    fetchCart();
  }, [sessionId, navigate]);

  if (loading) return <div className="p-4 text-center">Loading cart...</div>;

  if (cartItems.length === 0) {
    return (
      <div className="p-4 text-center">
        <p>Your cart is empty.</p>
        <button
          onClick={() => navigate(`/session/${sessionId}`)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Drawing
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Your Cart</h2>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {cartItems.map((item, idx) => (
          <div key={idx} className="border rounded shadow p-2">
            <img src={item.image} alt={`Cart Item ${idx}`} className="w-full h-48 object-contain" />
            <p className="mt-2 text-lg font-medium">Price: ${item.price}</p>
            <p className="text-sm text-gray-500">Added: {new Date(item.addedAt).toLocaleString()}</p>
            <button
              onClick={() => handleRemove(idx)}
              className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      {cartItems.length > 0 && (
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={handleCheckout}
            className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Checkout
          </button>
          <button
            onClick={() => navigate(`/session/${sessionId}`)}
            className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Drawing
          </button>
        </div>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={() => navigate(`/session/${sessionId}`)}
          className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Drawing
        </button>
      </div>
    </div>
  );
}
