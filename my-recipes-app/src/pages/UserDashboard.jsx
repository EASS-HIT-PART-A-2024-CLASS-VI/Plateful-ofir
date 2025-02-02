import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useContext } from "react";
import { UserContext } from "../context/UserContext";


export default function UserDashboard() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id"); // 👈 משיכת ה-ID של המשתמש המחובר
  console.log("🔍 Checking UserContext:", useContext(UserContext));

  const [userRecipes, setUserRecipes] = useState([]);
  const [newRecipe, setNewRecipe] = useState({
    name: "",
    preparation_steps: "",
    cooking_time: "",
    servings: "",
    categories: "",
    tags: "",
  });
  const [image, setImage] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("user_id"); // 👈 משיכת ה-ID של המשתמש המחובר
  
    if (!userId) {
      console.error("❌ No user ID found, redirecting to login.");
      toast.error("You must be logged in to view your recipes.");
      navigate("/login"); // 👈 נשלח את המשתמש למסך התחברות
      return;
    }
  
    fetch(`http://localhost:8000/users/${userId}/recipes`)
      .then((response) => {
        if (!response.ok) {
          return response.json().then((error) => {
            console.error("❌ Error fetching user recipes:", error);
            throw new Error(error.detail || "Failed to fetch recipes");
          });
        }
        return response.json();
      })
      .then((data) => {
        if (data.length === 0) {
          console.warn("ℹ️ No recipes found for this user.");
        }
        setUserRecipes(data);
      })
      .catch((error) => console.error("❌ Error fetching user recipes:", error));
  }, []);
  
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewRecipe((prevRecipe) => ({
      ...prevRecipe,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    for (let key in newRecipe) {
      formData.append(key, newRecipe[key]);
    }
    if (image) {
      formData.append("image", image);
    }

    try {
      const response = await fetch("http://localhost:8000/recipes/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to create recipe");

      toast.success("Recipe created successfully!");
      setShowForm(false);
      setNewRecipe({
        name: "",
        preparation_steps: "",
        cooking_time: "",
        servings: "",
        categories: "",
        tags: "",
      });
      setImage(null);

      // רענון רשימת המתכונים
      fetch(`http://localhost:8000/users/${userId}/recipes`)
        .then((response) => response.json())
        .then(setUserRecipes);
      
    } catch (error) {
      console.error("❌ Error creating recipe:", error);
      toast.error("❌ Failed to create recipe. Please try again.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-4 text-center">My Dashboard</h2>

      <button onClick={() => setShowForm(!showForm)} className="bg-green-500 text-white px-4 py-2 rounded w-full mb-4">
        {showForm ? "Cancel" : "Create New Recipe"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-100">
          <h3 className="text-2xl font-semibold text-center">Create a New Recipe</h3>

          <label className="block font-semibold">Recipe Name:</label>
          <input type="text" name="name" value={newRecipe.name} onChange={handleChange} className="border p-2 w-full" required />

          <label className="block font-semibold">Preparation Steps:</label>
          <textarea name="preparation_steps" value={newRecipe.preparation_steps} onChange={handleChange} className="border p-2 w-full" required />

          <label className="block font-semibold">Cooking Time (minutes):</label>
          <input type="number" name="cooking_time" value={newRecipe.cooking_time} onChange={handleChange} className="border p-2 w-full" required />

          <label className="block font-semibold">Number of Servings:</label>
          <input type="number" name="servings" value={newRecipe.servings} onChange={handleChange} className="border p-2 w-full" required />

          <label className="block font-semibold">Categories:</label>
          <input type="text" name="categories" value={newRecipe.categories} onChange={handleChange} className="border p-2 w-full" required />

          <label className="block font-semibold">Tags:</label>
          <input type="text" name="tags" value={newRecipe.tags} onChange={handleChange} className="border p-2 w-full" required />

          <label className="block font-semibold">Recipe Image:</label>
          <input type="file" onChange={handleImageChange} className="border p-2 w-full" accept="image/*" />

          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded w-full">Create Recipe</button>
        </form>
      )}

        <h3 className="text-2xl font-semibold mt-6">Your Recipes</h3>
        {userRecipes.length > 0 ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userRecipes.map((recipe) => (
            <li key={recipe.id} className="border p-4 rounded-lg shadow-lg bg-white">
                <h3 className="text-xl font-semibold text-gray-800">{recipe.name}</h3>
                <Link to={`/recipes/${recipe.id}`} className="text-blue-500">View</Link>
            </li>
            ))}
        </ul>
        ) : (
        <p className="text-center text-gray-600 mt-4">No recipes found. Start by creating a new one!</p>
        )}
    </div>
  );
}
