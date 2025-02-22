import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/UserContext";
import editIcon from "../assets/icons/edit-image.png";  
import deleteIcon from "../assets/icons/delete-image.png";
import time from "../assets/icons/time-image.png"
import addIcon from "../assets/icons/add-image.png"
import "../App.css";



export default function UserDashboard() {
  const navigate = useNavigate(); // ✅ הגדרת navigate
  const { user } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sharedRecipes, setSharedRecipes] = useState([]);
  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    if (user) {
      console.log("🔍 User Data:", user);  // ✅ בדיקת הנתונים שמגיעים מהשרת
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

  const handleDeleteRecipe = async (recipeId) => {
    if (!window.confirm("❌ האם אתה בטוח שברצונך למחוק את המתכון הזה?")) return;

    const userId = localStorage.getItem("user_id"); // 🔹 שליפת ה-User ID מהאחסון המקומי

    try {
        const response = await fetch(`/api/recipes/${recipeId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${userId}`, // ✅ שולח את ה-User ID בכותרת
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("❌ שגיאה במחיקת המתכון");
        }

        toast.success("✅ המתכון נמחק בהצלחה!");
        setRecipes((prevRecipes) => prevRecipes.filter(recipe => recipe.id !== recipeId)); // ✅ מסיר מה-UI
    } catch (error) {
        toast.error("❌ לא ניתן למחוק את המתכון");
    }
};

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6"> שלום, {user?.first_name ? `${user.first_name} ${user.last_name}` : "משתמש"}!</h2>
      {/* Recipes Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="header-container">
      <h3 className="text-2xl font-bold mb-4">🍽️ המתכונים שלך</h3>
        {/* כפתור יצירת מתכון */}
        <button className="create-recipe-button" onClick={() => navigate("/create-recipe")}>
          <img src={addIcon} alt="Add Recipe"/>
          יצירת מתכון חדש
        </button>
      </div>
      <div className="recipe-container">
        {recipes.map((recipe) => (
          <div 
            key={recipe.id} 
            className="recipe-card"
            onClick={() => navigate(`/recipes/${recipe.id}`)}
          >
            {/* ✅ תמונת המתכון */}
            <img 
              src={`/api${recipe.image_url}`} 
              alt={recipe.name} 
              className="recipe-image"
            />

            {/* ✅ פרטי המתכון */}
            <div className="recipe-details">
              <h4 className="recipe-title">{recipe.name}</h4>
              <p className="recipe-category"> {recipe.categories}</p>
              <p  img src={time} alt="time" className="recipe-time"> {recipe.cooking_time} דקות</p>

              {/* ✅ אזור האייקונים (מופיעים רק כאשר מרחפים) */}
              <div className="recipe-icons">
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate(`/recipes/edit/${recipe.id}`); }} 
                  title="ערוך מתכון"
                >
                  <img src={editIcon} alt="Edit" className="icon-edit-delete" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteRecipe(recipe.id); }} 
                  title="מחק מתכון"
                >
                  <img src={deleteIcon} alt="Delete" className="icon-edit-delete" />
                </button>
              </div>
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
                  →צפה במתכון 
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 mt-4">אין שיתופים עדיין.</p>
      )}
    </div>
    </div>
  );
}
