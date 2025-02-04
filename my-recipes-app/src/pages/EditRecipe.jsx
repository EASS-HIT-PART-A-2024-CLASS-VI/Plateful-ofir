import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function EditRecipe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([]); 
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timers, setTimers] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:8000/recipes/${id}`)
      .then((response) => response.json())
      .then((data) => {
        console.log("📥 Loaded Recipe Data:", data);
        setRecipe(data);
        setIngredients(data.ingredients || []); 
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p className="text-center mt-10 text-blue-500">Loading recipe...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">Error: {error}</p>;
  if (!recipe) return <p className="text-center text-gray-500 mt-10">Recipe not found.</p>;

  const handleChange = (e) => {
    setRecipe({ ...recipe, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const addTimer = () => {
    setTimers([...timers, { step_number: "", duration: "", label: "" }]);
  };
  
  const handleTimerChange = (index, field, value) => {
    const updatedTimers = [...timers];
    updatedTimers[index][field] = value;
    setTimers(updatedTimers);
  };

  const handleIngredientChange = (index, field, value) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index][field] = value;
    setIngredients(updatedIngredients);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", quantity: "", unit: "" }]);
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem("user_id");

    if (!userId) {
      toast.error("Please login to edit this recipe.");
      return;
    }

    const formData = new FormData();
    Object.entries(recipe).forEach(([key, value]) => formData.append(key, value));
    formData.append("current_user_id", userId);
    formData.append("ingredients", JSON.stringify(ingredients)); // ✅ שליחת מצרכים כ-JSON
    if (image) formData.append("image", image);

    try {
      const response = await fetch(`http://localhost:8000/recipes/${id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to update recipe");

      toast.success("Recipe updated successfully!");
      navigate(`/recipes/${id}`);
    } catch (error) {
      toast.error(error.message || "Failed to update recipe.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">Edit Recipe</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-gray-700">Recipe Name:</label>
        <input type="text" name="name" value={recipe.name} onChange={handleChange} className="border p-2 w-full" placeholder="Recipe Name" required />
                {/* 🛒 עריכת רשימת מצרכים */}
                <h3>🛒 Ingredients</h3>
        {ingredients.map((ingredient, index) => (
          <div key={index} className="flex gap-2 items-center">
            <input type="text" placeholder="Ingredient Name" value={ingredient.name} onChange={(e) => handleIngredientChange(index, "name", e.target.value)} className="border p-2 w-full" required />
            <input type="number" placeholder="Quantity" value={ingredient.quantity} onChange={(e) => handleIngredientChange(index, "quantity", e.target.value)} className="border p-2 w-20" required />
            <input type="text" placeholder="Unit" value={ingredient.unit} onChange={(e) => handleIngredientChange(index, "unit", e.target.value)} className="border p-2 w-20" required />
            <button type="button" onClick={() => removeIngredient(index)} className="bg-red-500 text-white px-2 py-1 rounded">🗑</button>
          </div>
        ))}
        <button type="button" onClick={addIngredient} className="bg-green-500 text-white px-4 py-2 rounded">➕ Add Ingredient</button>
        <label className="block text-gray-700">Preparation Steps:</label>
        <textarea name="preparation_steps" value={recipe.preparation_steps} onChange={handleChange} className="border p-2 w-full" placeholder="Preparation Steps" required />
        <label className="block text-gray-700">Cookingtime:</label>
        <input type="number" name="cooking_time" value={recipe.cooking_time} onChange={handleChange} className="border p-2 w-full" placeholder="Cooking Time (min)" required />
        <label className="block text-gray-700">Servings:</label>
        <input type="number" name="servings" value={recipe.servings} onChange={handleChange} className="border p-2 w-full" placeholder="Servings" required />
        <label className="block text-gray-700">Categories:</label>
        <input type="text" name="categories" value={recipe.categories} onChange={handleChange} className="border p-2 w-full" placeholder="Categories" required />
        <label className="block text-gray-700">Tags:</label>
        <input type="text" name="tags" value={recipe.tags} onChange={handleChange} className="border p-2 w-full" placeholder="Tags" />

        {/* טיימרים */}
        <h3>⏳ Cooking Timers</h3>
        {timers.map((timer, index) => (
        <div key={index} className="flex gap-2 items-center">
            <input type="number" placeholder="Step Number" value={timer.step_number} onChange={(e) => handleTimerChange(index, "step_number", e.target.value)} className="border p-2 w-20" required />
            <input type="number" placeholder="Duration (min)" value={timer.duration} onChange={(e) => handleTimerChange(index, "duration", e.target.value)} className="border p-2 w-20" required />
            <input type="text" placeholder="Label" value={timer.label} onChange={(e) => handleTimerChange(index, "label", e.target.value)} className="border p-2 w-full" required />
            <button type="button" onClick={() => removeTimer(index)} className="bg-red-500 text-white px-2 py-1 rounded">🗑</button>
        </div>
        ))}
        <button type="button" onClick={addTimer} className="bg-green-500 text-white px-4 py-2 rounded">➕ Add Timer</button>

        <input type="file" onChange={handleImageChange} className="w-full" accept="image/*" />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded w-full">Update Recipe</button>
      </form>
    </div>
  );
}
