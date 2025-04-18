import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Import axios

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Loading state for button
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true); // Start loading when the request is initiated

    try {
      // Make POST request using axios
      const res = await axios.post("/.netlify/functions/loginUser", {
        email,
        password,
      });

      if (res.status === 200) {
        // Save session information in localStorage
        const { sessionId, userId } = res.data; // Assuming the response contains sessionId and userId
        localStorage.setItem("sessionId", sessionId);
        localStorage.setItem("userId", userId);

        alert("Logged in successfully!");
        
        // Redirect to the session page with the sessionId
        navigate(`/session/${sessionId}`); 
      } else {
        alert(res.data.message || "Login failed."); // Show error message if login fails
      }
    } catch (err) {
      console.error(err);
      alert("Error logging in.");
    } finally {
      setIsLoading(false); // Reset loading state once request completes
    }
  };

  const handleSignupRedirect = () => {
    navigate("/signup"); // Redirect to signup page
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h2 className="text-3xl font-bold mb-6">Log In</h2>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-80"
      >
        <label className="block mb-2">
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border rounded mt-1"
          />
        </label>
        <label className="block mb-4">
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border rounded mt-1"
          />
        </label>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          disabled={isLoading} // Disable the button during loading
        >
          {isLoading ? "Logging in..." : "Log In"}
        </button>
        <p
          onClick={handleSignupRedirect}
          className="text-center mt-4 text-blue-600 hover:underline cursor-pointer"
        >
          Don't have an account? Sign Up
        </p>
      </form>
    </div>
  );
}

