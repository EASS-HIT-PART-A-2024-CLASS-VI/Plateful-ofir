import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function Register() {
  const navigate = useNavigate();

  // State for managing form data
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
    birthdate: "",
    gender: "",
    phone_number: "",
  });

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("📤 Sending registration data:", formData);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          password: formData.password,
          birthdate: formData.birthdate || null, // Optional fields default to null
          gender: formData.gender || null,
          phone_number: formData.phone_number || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Registration error:", errorData);
        throw new Error(errorData.detail || "Registration failed");
      }

      toast.success("✅ Registration successful! You can now log in.");
      navigate("/login");
    } catch (error) {
      console.error("❌ Error during registration:", error);
      toast.error("❌ Registration failed.");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">🔐 הרשמה</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* First Name Input */}
        <input
          type="text"
          name="first_name"
          placeholder="שם פרטי"
          value={formData.first_name}
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />

        {/* Last Name Input */}
        <input
          type="text"
          name="last_name"
          placeholder="שם משפחה"
          value={formData.last_name}
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />

        {/* Username Input */}
        <input
          type="text"
          name="username"
          placeholder="שם משתמש"
          value={formData.username}
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />

        {/* Email Input */}
        <input
          type="email"
          name="email"
          placeholder="מייל"
          value={formData.email}
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />

        {/* Password Input */}
        <input
          type="password"
          name="password"
          placeholder="סיסמה"
          value={formData.password}
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />

        {/* Birthdate Input */}
        <input
          type="date"
          name="birthdate"
          value={formData.birthdate}
          onChange={handleChange}
          className="border p-2 w-full"
        />

        {/* Gender Selection */}
        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className="border p-2 w-full"
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        {/* Phone Number Input (Optional) */}
        <input
          type="text"
          name="phone_number"
          placeholder="טלפון (אפציונלי)"
          value={formData.phone_number}
          onChange={handleChange}
          className="border p-2 w-full"
        />

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded w-full"
        >
          🔑 הרשם
        </button>
      </form>
    </div>
  );
}
