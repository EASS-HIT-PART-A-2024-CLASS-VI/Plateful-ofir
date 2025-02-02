import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import CreateRecipe from "./CreateRecipe"; // ✅ טוען את יצירת המתכון כקומפוננטה נפרדת

export default function UserDashboard() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchUserRecipes();
    fetchNotifications();
  }, []);

  const fetchUserRecipes = async () => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      toast.error("Please login to view your recipes");
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/users/${userId}/recipes`);
      if (!response.ok) throw new Error("Failed to fetch recipes");
      const data = await response.json();
      setRecipes(data);
    } catch (error) {
      toast.error("Failed to load recipes");
    }
  };

  const fetchNotifications = async () => {
    const userId = localStorage.getItem("user_id");
    try {
      const response = await fetch(`http://localhost:8000/users/${userId}/notifications`);
      if (!response.ok) throw new Error("Failed to fetch notifications");
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      toast.error("Failed to load notifications");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Your Dashboard</h2>

      {/* Notifications */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold">Notifications</h3>
        {notifications.length > 0 ? (
          notifications.map((notif, index) => (
            <p key={index} className="text-gray-600">{notif.message}</p>
          ))
        ) : (
          <p className="text-gray-500">No new notifications</p>
        )}
      </div>

      {/* User Recipes */}
      <h3 className="text-2xl font-bold mb-4">Your Recipes</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="border rounded p-4">
            <h4 className="font-bold">{recipe.name}</h4>
            <p className="text-gray-600">Categories: {recipe.categories}</p>
            <p className="text-gray-600">Cooking Time: {recipe.cooking_time} min</p>
            <button onClick={() => navigate(`/recipes/${recipe.id}`)} className="text-blue-500">View</button>
            <button onClick={() => navigate(`/recipes/edit/${recipe.id}`)} className="text-green-500 ml-2">Edit</button>
          </div>
        ))}
      </div>

      {/* Create Recipe */}
      <CreateRecipe fetchUserRecipes={fetchUserRecipes} />
    </div>
  );
}
