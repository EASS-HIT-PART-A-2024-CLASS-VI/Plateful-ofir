import { useState } from "react";
import { toast } from "react-toastify";

export default function CreateRecipe({ fetchUserRecipes }) {
  const [newRecipe, setNewRecipe] = useState({
    name: "",
    preparation_steps: "",
    cooking_time: "",
    servings: "",
    categories: "",
    tags: "",
  });
  const [image, setImage] = useState(null);

  const handleChange = (e) => {
    setNewRecipe({ ...newRecipe, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem("user_id");

    if (!userId) {
      toast.error("Please login to create a recipe.");
      return;
    }

    const formData = new FormData();
    formData.append("name", newRecipe.name);
    formData.append("preparation_steps", newRecipe.preparation_steps);
    formData.append("cooking_time", newRecipe.cooking_time);
    formData.append("servings", newRecipe.servings);
    formData.append("categories", newRecipe.categories);
    formData.append("tags", newRecipe.tags);
    formData.append("creator_id", userId);
    if (image) formData.append("image", image);

    try {
      const response = await fetch("http://localhost:8000/recipes/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to create recipe");

      toast.success("Recipe created successfully!");
      setNewRecipe({ name: "", preparation_steps: "", cooking_time: "", servings: "", categories: "", tags: "" });
      setImage(null);
      fetchUserRecipes(); // רענון הרשימה אחרי יצירת מתכון חדש
    } catch (error) {
      toast.error(error.message || "Failed to create recipe.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">Create New Recipe</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="name" value={newRecipe.name} onChange={handleChange} className="border p-2 w-full" placeholder="Recipe Name" required />
        <textarea name="preparation_steps" value={newRecipe.preparation_steps} onChange={handleChange} className="border p-2 w-full" placeholder="Preparation Steps" required />
        <input type="number" name="cooking_time" value={newRecipe.cooking_time} onChange={handleChange} className="border p-2 w-full" placeholder="Cooking Time (min)" required />
        <input type="number" name="servings" value={newRecipe.servings} onChange={handleChange} className="border p-2 w-full" placeholder="Servings" required />
        <input type="text" name="categories" value={newRecipe.categories} onChange={handleChange} className="border p-2 w-full" placeholder="Categories" required />
        <input type="text" name="tags" value={newRecipe.tags} onChange={handleChange} className="border p-2 w-full" placeholder="Tags" />
        <input type="file" onChange={handleImageChange} className="w-full" accept="image/*" />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded w-full">Create Recipe</button>
      </form>
    </div>
  );
}
