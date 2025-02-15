import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function SignUp() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        mode: "cors",  // ✅ וודא שהבקשה מתבצעת עם CORS
      });
  
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Registration failed");
  
      toast.success("Registration successful! Please log in.");
      navigate("/login");
  
    } catch (error) {
      console.error("❌ Error registering:", error);
      toast.error("❌ Failed to register. Please try again.");
    }
  };  

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center">Sign Up</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Username" required className="border p-2 w-full" />
        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required className="border p-2 w-full" />
        <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" required className="border p-2 w-full" />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded w-full">Register</button>
      </form>
    </div>
  );
}
