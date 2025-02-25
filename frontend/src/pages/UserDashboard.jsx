import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/UserContext";
import editIcon from "../assets/icons/edit-image.png";
import deleteIcon from "../assets/icons/delete-image.png";
import time from "../assets/icons/time-image.png";
import addIcon from "../assets/icons/add-image.png";
import "../App.css";

export default function UserDashboard() {
  const navigate = useNavigate(); // ✅ Initialize navigation
  const { user } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sharedRecipes, setSharedRecipes] = useState([]);
  const userId = localStorage.getItem("user_id");

  // Fetch user recipes when the component mounts or user data changes
  useEffect(() => {
    if (user) {
      console.log("🔍 User Data:", user); // ✅ Debugging user data from server
      fetchUserRecipes();
    }
  }, [user]);

  // Fetch shared recipes
  useEffect(() => {
    const fetchSharedRecipes = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/shared_recipes`);
        if (!response.ok) throw new Error("Error fetching shared recipes");
        const data = await response.json();
        setSharedRecipes(data);
      } catch (error) {
        console.error("❌ Error:", error);
      }
    };

    fetchSharedRecipes();
  }, [userId]);

  // Function to fetch recipes created by the user
  const fetchUserRecipes = async () => {
    try {
      const response = await fetch(`/api/users/${user.id}/recipes`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch recipes");

      const data = await response.json();
      setRecipes(data);
    } catch (error) {
      toast.error("Error loading recipes");
    } finally {
      setLoading(false);
    }
  };

  // Display a loading message while fetching data
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-2xl text-blue-500">Loading...</div>
      </div>
    );
  }

  // Function to delete a recipe
  const handleDeleteRecipe = async (recipeId) => {
    if (!window.confirm("❌ Are you sure you want to delete this recipe?"))
      return;

    const userId = localStorage.getItem("user_id"); // 🔹 Retrieve User ID from local storage

    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${userId}`, // ✅ Send User ID in the header
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("❌ Error deleting the recipe");
      }

      toast.success("✅ Recipe successfully deleted!");
      setRecipes((prevRecipes) =>
        prevRecipes.filter((recipe) => recipe.id !== recipeId)
      ); // ✅ Remove from UI
    } catch (error) {
      toast.error("❌ Unable to delete the recipe");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">
        שלום, {user?.first_name ? `${user.first_name}` : "משתמש יקר"}!
      </h2>

      {/* Recipes Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="header-container">
          <h3 className="text-2xl font-bold mb-4">🍽️ המתכונים שלך</h3>

          {/* Create Recipe Button */}
          <button
            className="create-recipe-button"
            onClick={() => navigate("/create-recipe")}
          >
            <img src={addIcon} alt="Add Recipe" />
            יצירת מתכון
          </button>
        </div>

        {/* Recipe Grid */}
        <div className="recipe-container">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="recipe-card"
              onClick={() => navigate(`/recipes/${recipe.id}`)}
            >
              {/* ✅ Recipe Image */}
              <img
                src={`/api${recipe.image_url}`}
                alt={recipe.name}
                className="recipe-image"
              />

              {/* ✅ Recipe Details */}
              <div className="recipe-details">
                <h4 className="recipe-title">{recipe.name}</h4>
                <p className="recipe-category"> {recipe.categories}</p>
                <p className="recipe-time">
                  <img src={time} alt="Time" className="icon-style" />
                  {recipe.cooking_time} דקות
                </p>

                {/* ✅ Edit & Delete Icons (Shown on Hover) */}
                <div className="recipe-icons">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/recipes/edit/${recipe.id}`);
                    }}
                    title="Edit Recipe"
                  >
                    <img
                      src={editIcon}
                      alt="Edit"
                      className="icon-edit-delete"
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRecipe(recipe.id);
                    }}
                    title="Delete Recipe"
                  >
                    <img
                      src={deleteIcon}
                      alt="Delete"
                      className="icon-edit-delete"
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shared Recipes Section */}
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold">📢מתכונים ששותפו איתי</h1>

        {sharedRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {sharedRecipes.map((recipe) => (
              <div
                key={recipe.recipe_id}
                className="bg-white shadow-md rounded-lg overflow-hidden"
              >
                <a href={`/recipes/${recipe.recipe_id}`} className="block">
                  <img
                    src={`/api${recipe.recipe_image}`}
                    alt={recipe.recipe_name}
                    className="w-full h-32 object-cover"
                  />
                </a>
                <div className="p-4">
                  <h3 className="text-lg font-bold">{recipe.recipe_name}</h3>
                  <a
                    href={`/recipes/${recipe.recipe_id}`}
                    className="text-blue-500 mt-2 block"
                  >
                    צפה במתכון →
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 mt-4">אין מתכונים משותפים עדיין</p>
        )}
      </div>
    </div>
  );
}
