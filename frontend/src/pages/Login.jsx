import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/UserContext"; // ✅ Connect to User Context

export default function Login() {
  // State for user credentials and error messages
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setUser } = useAuth(); // ✅ Update logged-in user context
  const navigate = useNavigate();

  // Handle user login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 404) {
        // If user is not found, suggest registration
        const confirmRegister = window.confirm(
          "User not found. Would you like to register?"
        );
        if (confirmRegister) {
          await handleRegister();
        }
        return;
      }

      if (!response.ok) throw new Error("Invalid login credentials");

      const data = await response.json();
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user_id", data.user.id);

      // ✅ Update user in context
      setUser(data.user);

      navigate("/dashboard"); // ✅ Redirect to dashboard
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle user registration
  const handleRegister = async () => {
    try {
      const username = email.split("@")[0]; // ✅ Automatically generate username from email
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (!response.ok) throw new Error("Error during registration");

      alert("✅ Registration successful! Please log in.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
        התחבר
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-gray-700 mb-2">
            מייל
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-gray-700 mb-2">
            סיסמה
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded w-full hover:bg-blue-600 transition duration-200"
        >
          התחבר
        </button>
      </form>

      <p className="text-center text-gray-600 mt-4">
        אין לך משתמש?{" "}
        <Link to="/signup" className="text-blue-500 hover:underline">
          הרשם מכאן
        </Link>
      </p>
    </div>
  );
}
