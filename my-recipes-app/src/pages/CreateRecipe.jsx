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
  const [ingredients, setIngredients] = useState([]);
  const userId = localStorage.getItem("user_id"); 
  const [timers, setTimers] = useState([]);

  const handleChange = (e) => {
    setNewRecipe({ ...newRecipe, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
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

  const addTimer = () => {
    setTimers([...timers, { step_number: "", duration: "", label: "" }]);
  };
  
  const handleTimerChange = (index, field, value) => {
    const updatedTimers = [...timers];
    updatedTimers[index][field] = value;
    setTimers(updatedTimers);
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (index === ingredients.length - 1) {
        addIngredient();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      toast.error("Please login to create a recipe.");
      return;
    }

    const formData = new FormData();
    Object.entries(newRecipe).forEach(([key, value]) => {
      formData.append(key, typeof value === "number" ? value.toString() : value);
    });
    formData.append("creator_id", userId);
    formData.append("ingredients", JSON.stringify(ingredients.map(ing => ({
      ...ing,
      quantity: parseFloat(ing.quantity)  
    }))));

    console.log("📤 Sending Recipe Data:", Object.fromEntries(formData));

    if (image) formData.append("image", image);

    try {
      const response = await fetch("http://localhost:8000/recipes/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("📥 Received Response:", data);  
      if (!response.ok) throw new Error(data.detail || "Failed to create recipe");

      toast.success("Recipe created successfully!");
      setNewRecipe({ name: "", preparation_steps: "", cooking_time: "", servings: "", categories: "", tags: "" });
      setImage(null);
      setIngredients([]);
      fetchUserRecipes();
    } catch (error) {
      console.error("❌ Error creating recipe:", error);
      toast.error(error.message || "Failed to create recipe.");
    }
};



  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">Create New Recipe</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-gray-700">Recipe Name:</label>
        <input type="text" name="name" value={newRecipe.name} onChange={handleChange} className="border p-2 w-full" placeholder="Recipe Name" required />

                {/* 🛒 הוספת מרכיבים למתכון */}
                <h3>🛒 Ingredients</h3>
        {ingredients.map((ingredient, index) => (
          <div key={index} className="flex gap-2 items-center">
            <input type="text" placeholder="Ingredient Name" value={ingredient.name} onChange={(e) => handleIngredientChange(index, "name", e.target.value)} onKeyDown={(e) => handleKeyDown(e, index)} className="border p-2 w-full" required />
            <input type="number" placeholder="Quantity" value={ingredient.quantity} onChange={(e) => handleIngredientChange(index, "quantity", e.target.value)} className="border p-2 w-20" required />
            <input type="text" placeholder="Unit" value={ingredient.unit} onChange={(e) => handleIngredientChange(index, "unit", e.target.value)} className="border p-2 w-20" required />
            <button type="button" onClick={() => removeIngredient(index)} className="bg-red-500 text-white px-2 py-1 rounded">🗑</button>
          </div>
        ))}
        
        <button type="button" onClick={addIngredient} className="bg-green-500 text-white px-4 py-2 rounded">➕ Add Ingredient</button>
        <label className="block text-gray-700">Preparation Steps:</label>
        <textarea name="preparation_steps" value={newRecipe.preparation_steps} onChange={handleChange} className="border p-2 w-full" placeholder="Preparation Steps" required />
        <label className="block text-gray-700">Cooking Time:</label>
        <input type="number" name="cooking_time" value={newRecipe.cooking_time} onChange={handleChange} className="border p-2 w-full" placeholder="Cooking Time (min)" required />
        <label className="block text-gray-700">Servings:</label>
        <input type="number" name="servings" value={newRecipe.servings} onChange={handleChange} className="border p-2 w-full" placeholder="Servings" required />
        <label className="block text-gray-700">Categories:</label>
        <input type="text" name="categories" value={newRecipe.categories} onChange={handleChange} className="border p-2 w-full" placeholder="Categories" required />
        <label className="block text-gray-700">Tags:</label>
        <input type="text" name="tags" value={newRecipe.tags} onChange={handleChange} className="border p-2 w-full" placeholder="Tags" />

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
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded w-full">Create Recipe</button>
      </form>
    </div>
  );
}
