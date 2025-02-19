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
  const [sharedRecipes, setSharedRecipes] = useState([]);
  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    if (user) {
      fetchUserRecipes();
    }
  }, [user]);

  useEffect(() => {
    const fetchSharedRecipes = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/shared_recipes`);
        if (!response.ok) throw new Error("שגיאה בשליפת מתכונים משותפים");
        const data = await response.json();
        setSharedRecipes(data);
      } catch (error) {
        console.error("❌ שגיאה:", error);
      }
    };

    fetchSharedRecipes();
  }, [userId]);

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

      <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold">📢 מתכונים ששיתפו איתי</h1>
      {sharedRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {sharedRecipes.map((recipe) => (
            <div key={recipe.recipe_id} className="bg-white shadow-md rounded-lg overflow-hidden">
              <a href={`/recipes/${recipe.recipe_id}`} className="block">
                <img src={`/api${recipe.recipe_image}`} alt={recipe.recipe_name} className="w-full h-32 object-cover" />
              </a>
              <div className="p-4">
                <h3 className="text-lg font-bold">{recipe.recipe_name}</h3>
                <a href={`/recipes/${recipe.recipe_id}`} className="text-blue-500 mt-2 block">
                  צפה במתכון →
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 mt-4">אין שיתופים עדיין.</p>
      )}
    </div>

      {/* Create Recipe Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <CreateRecipe fetchUserRecipes={fetchUserRecipes} />
      </div>
    </div>
  );
}
