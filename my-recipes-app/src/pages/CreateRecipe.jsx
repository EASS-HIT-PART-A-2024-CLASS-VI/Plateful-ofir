import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CreateRecipe() {
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState({
    name: "",
    preparation_steps: "",
    cooking_time: "",
    servings: "",
    categories: "",
    tags: "",
  });

  const [image, setImage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRecipe((prevRecipe) => ({
      ...prevRecipe,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const userId = localStorage.getItem("user_id"); // ✅ משיכת ה-ID של המשתמש
    console.log("📡 Sending user_id:", userId); // 🔍 בדיקה ראשונה
  
    if (!userId) {
      toast.error("❌ You must be logged in to create a recipe.");
      return;
    }
  
    const formData = new FormData();
    formData.append("name", recipe.name);
    formData.append("preparation_steps", recipe.preparation_steps);
    formData.append("cooking_time", recipe.cooking_time);
    formData.append("servings", recipe.servings);
    formData.append("categories", recipe.categories);
    formData.append("tags", recipe.tags);
    formData.append("creator_id", userId);  // ✅ בדיקה – האם נשלח נכון?
  
    if (image) formData.append("image", image);
  
    console.log("📡 Sending FormData:");
    for (let pair of formData.entries()) {
      console.log(`${pair[0]}: ${pair[1]}`);
    }
  
    try {
      const response = await fetch("http://localhost:8000/recipes/", {
        method: "POST",
        body: formData,
      });
  
      const data = await response.json();
      console.log("🔴 Server response:", data);
  
      if (!response.ok) throw new Error(data.detail || "Failed to create recipe");
  
      toast.success("Recipe created successfully!");
    } catch (error) {
      console.error("❌ Error creating recipe:", error);
      toast.error("❌ Failed to create recipe.");
    }
  };
  


  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-4 text-center">Create a New Recipe</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block font-semibold">Recipe Name:</label>
        <input type="text" name="name" value={recipe.name} onChange={handleChange} className="border p-2 w-full" placeholder="Enter recipe name" required />

        <label className="block font-semibold">Preparation Steps:</label>
        <textarea name="preparation_steps" value={recipe.preparation_steps} onChange={handleChange} className="border p-2 w-full" placeholder="Describe the steps" required />

        <label className="block font-semibold">Cooking Time (minutes):</label>
        <input type="number" name="cooking_time" value={recipe.cooking_time} onChange={handleChange} className="border p-2 w-full" placeholder="Enter cooking time in minutes" required />

        <label className="block font-semibold">Number of Servings:</label>
        <input type="number" name="servings" value={recipe.servings} onChange={handleChange} className="border p-2 w-full" placeholder="Enter number of servings" required />

        <label className="block font-semibold">Categories:</label>
        <input type="text" name="categories" value={recipe.categories} onChange={handleChange} className="border p-2 w-full" placeholder="e.g., Breakfast, Vegan" required />

        <label className="block font-semibold">Tags:</label>
        <input type="text" name="tags" value={recipe.tags} onChange={handleChange} className="border p-2 w-full" placeholder="e.g., Healthy, Quick" required />

        <label className="block font-semibold">Recipe Image:</label>
        <input type="file" onChange={handleImageChange} className="border p-2 w-full" accept="image/*" />

        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded w-full">Create Recipe</button>
      </form>
    </div>
  );
}
