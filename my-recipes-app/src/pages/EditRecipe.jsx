import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function EditRecipe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState({
    name: "",
    preparation_steps: "",
    cooking_time: 0,
    servings: 0,
    categories: "",
    tags: "",
    ingredients: [],
    timers: [],
  });

  useEffect(() => {
    fetch(`http://localhost:8000/recipes/${id}`)
      .then((response) => response.json())
      .then((data) => setRecipe(data))
      .catch((error) => console.error("❌ Error fetching recipe:", error));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRecipe((prevRecipe) => ({
      ...prevRecipe,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  
    const formattedRecipe = {
      name: recipe.name.trim() || "Untitled",
      preparation_steps: recipe.preparation_steps.trim() || "No steps provided",
      cooking_time: parseInt(recipe.cooking_time) || 0,
      servings: parseInt(recipe.servings) || 1,
      categories: recipe.categories.trim() || "Uncategorized",
      tags: recipe.tags.trim() || "",
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
      timers: Array.isArray(recipe.timers) ? recipe.timers : []
    };
  
    console.log("📡 Sending formatted data:", JSON.stringify(formattedRecipe));
  
    fetch(`http://localhost:8000/recipes/${id}?current_user_id=1`, { // 👈 שליחת ה-user ID
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formattedRecipe),
    })
      .then(async (response) => {
        const body = await response.json();
        console.log("🔴 Server response:", body);
        if (!response.ok) {
          console.error("❌ Error response from server:", body);
          throw new Error("Failed to update recipe");
        }
        return body;
      })
      .then(() => {
        toast.success("Recipe updated successfully!");
        navigate(`/recipes/${id}`);
      })
      .catch((error) => {
        console.error("❌ Error updating recipe:", error);
        toast.error("❌ Failed to update recipe. Please try again.");
      });
  };  
  

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-4 text-center">Edit Recipe</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <label className="block font-semibold">Recipe Name:</label>
        <input type="text" name="name" value={recipe.name} onChange={handleChange} className="border p-2 w-full" placeholder="Enter recipe name" required />

        <label className="block font-semibold">Preparation Steps:</label>
        <textarea name="preparation_steps" value={recipe.preparation_steps} onChange={handleChange} className="border p-2 w-full" placeholder="Describe the steps" required />

        <label className="block font-semibold">Cooking Time (minutes):</label>
        <input type="number" name="cooking_time" value={recipe.cooking_time} onChange={handleChange} className="border p-2 w-full" placeholder="Enter cooking time in minutes" required />

        <label className="block font-semibold">Number of Servings:</label>
        <input type="number" name="servings" value={recipe.servings} onChange={handleChange} className="border p-2 w-full" placeholder="Enter number of servings" required />

        <label className="block font-semibold">Categories (comma separated):</label>
        <input type="text" name="categories" value={recipe.categories} onChange={handleChange} className="border p-2 w-full" placeholder="e.g., Breakfast, Vegan" required />

        <label className="block font-semibold">Tags (comma separated):</label>
        <input type="text" name="tags" value={recipe.tags} onChange={handleChange} className="border p-2 w-full" placeholder="e.g., Healthy, Quick" required />

        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded w-full">Update Recipe</button>
      </form>
    </div>
  );
}
