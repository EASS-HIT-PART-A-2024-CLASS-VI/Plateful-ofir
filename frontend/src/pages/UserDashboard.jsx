import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✅ הוספת useNavigate
import { toast } from "react-toastify";
import { useAuth } from "../context/UserContext";
import CreateRecipe from "./CreateRecipe";

export default function UserDashboard() {
  const navigate = useNavigate(); // ✅ הגדרת navigate
  const { user } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserRecipes();
    }
  }, [user]);

  const fetchUserRecipes = async () => {
    try {
      const response = await fetch(`/api/users/${user.id}/recipes`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        }
      });

      if (!response.ok) throw new Error("Failed to fetch recipes");

      const data = await response.json();
      setRecipes(data);
    } catch (error) {
      toast.error("שגיאה בטעינת המתכונים");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-2xl text-blue-500">טוען...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">  שלום, {user.first_name} {user.last_name}!</h2>

      {/* Recipes Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-2xl font-bold mb-4">🍽️ המתכונים שלך</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="border rounded p-4 hover:shadow-lg transition duration-200">
              <h4 className="font-bold text-lg">{recipe.name}</h4>
              <p className="text-gray-600">📂 קטגוריות: {recipe.categories}</p>
              <p className="text-gray-600">⏳ זמן הכנה: {recipe.cooking_time} דקות</p>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => navigate(`/recipes/${recipe.id}`)} // ✅ שימוש ב- navigate
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                >
                  צפייה
                </button>
                <button
                  onClick={() => navigate(`/recipes/edit/${recipe.id}`)} // ✅ שימוש ב- navigate
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                >
                  עריכה
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Recipe Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <CreateRecipe fetchUserRecipes={fetchUserRecipes} />
      </div>
    </div>
  );
}
