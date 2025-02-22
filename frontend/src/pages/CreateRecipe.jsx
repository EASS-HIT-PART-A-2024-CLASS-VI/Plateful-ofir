import { useState } from "react";
import { toast } from "react-toastify";

export default function CreateRecipe({ fetchUserRecipes  = () => {}}) {
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
  const [timers, setTimers] = useState([]);
  const userId = localStorage.getItem("user_id");

  const handleChange = (e) => {
    setNewRecipe({ ...newRecipe, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const handleIngredientChange = (index, field, value) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      [field]: value
  };
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
    updatedTimers[index] = {
      ...updatedTimers[index],
      [field]: value
    };
    setTimers(updatedTimers);
  };

  const removeTimer = (index) => {
    setTimers(timers.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      if (!userId) {
        toast.error("Please login to create a recipe.");
        return;
      }
  
      const formattedTimers = timers.map(timer => ({
        step_number: parseInt(timer.step_number, 10) || 0,
        duration: parseInt(timer.duration, 10) || 0,
        label: timer.label || ""
      }));

      const formattedIngredients = ingredients.map(ing => ({
        name: ing.name || "",
        quantity: parseFloat(ing.quantity) || 0,
        unit: ing.unit || ""
      }));

      const formData = new FormData();
      Object.entries(newRecipe).forEach(([key, value]) => {
        formData.append(key, value?.toString() || "");
      });

      formData.append("creator_id", userId);
      formData.append("ingredients", JSON.stringify(formattedIngredients));
      formData.append("timers", JSON.stringify(formattedTimers));

      if (image) {
        formData.append("image", image);
      }
  
      const response = await fetch("/api/recipes/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || "Failed to create recipe");
      }
  
      toast.success("Recipe created successfully!");
  
      // איפוס הטופס
      setNewRecipe({
        name: "",
        preparation_steps: "",
        cooking_time: "",
        servings: "",
        categories: "",
        tags: ""
      });
      setImage(null);
      setIngredients([]);
      setTimers([]);
  
      // וידוא שהפונקציה קיימת לפני הקריאה
      if (typeof fetchUserRecipes === 'function') {
        fetchUserRecipes();
      }

    } catch (error) {
      console.error("❌ Error creating recipe:", error);
      toast.error(error.message || "Failed to create recipe.");
    }
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">📖 יצירת מתכון חדש</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-gray-700">שם המתכון:</label>
        <input type="text" name="name" value={newRecipe.name} onChange={handleChange} className="border p-2 w-full" required />

        {/* 🛒 מרכיבים */}
        <h3>🛒 מרכיבים</h3>
        {ingredients.map((ingredient, index) => (
          <div key={index} className="flex gap-2 items-center">
            <input type="text" placeholder="שם מרכיב" value={ingredient.name} onChange={(e) => handleIngredientChange(index, "name", e.target.value)} className="border p-2 w-full" required />
            <input type="number" placeholder="כמות" value={ingredient.quantity} onChange={(e) => handleIngredientChange(index, "quantity", e.target.value)} className="border p-2 w-20" required />
            <input type="text" placeholder="יחידה" value={ingredient.unit} onChange={(e) => handleIngredientChange(index, "unit", e.target.value)} className="border p-2 w-20" required />
            <button type="button" onClick={() => removeIngredient(index)} className="bg-red-500 text-white px-2 py-1 rounded">🗑</button>
          </div>
        ))}
        <button type="button" onClick={addIngredient} className="bg-green-500 text-white px-4 py-2 rounded">➕ הוסף מרכיב</button>

        <label className="block text-gray-700">שלבי הכנה:</label>
        <textarea name="preparation_steps" value={newRecipe.preparation_steps} onChange={handleChange} className="border p-2 w-full" required />

        <label className="block text-gray-700">⏳ זמן הכנה:</label>
        <input type="number" name="cooking_time" value={newRecipe.cooking_time} onChange={handleChange} className="border p-2 w-full" required />

        <label className="block text-gray-700">🍽 מספר מנות:</label>
        <input type="number" name="servings" value={newRecipe.servings} onChange={handleChange} className="border p-2 w-full" required />

        <label className="block text-gray-700">📂 קטגוריות:</label>
        <input type="text" name="categories" value={newRecipe.categories} onChange={handleChange} className="border p-2 w-full" required />

        <label className="block text-gray-700">🏷️ תגיות:</label>
        <input type="text" name="tags" value={newRecipe.tags} onChange={handleChange} className="border p-2 w-full" />

        {/* ⏳ טיימרים */}
        <h3>⏳ טיימרים</h3>
        {timers.map((timer, index) => (
          <div key={index} className="flex gap-2 items-center">
            <input type="number" placeholder="שלב" value={timer.step_number} onChange={(e) => handleTimerChange(index, "step_number", e.target.value)} className="border p-2 w-20" required />
            <input type="number" placeholder="משך (דקות)" value={timer.duration} onChange={(e) => handleTimerChange(index, "duration", e.target.value)} className="border p-2 w-20" required />
            <input type="text" placeholder="תיאור" value={timer.label} onChange={(e) => handleTimerChange(index, "label", e.target.value)} className="border p-2 w-full" required />
            <button type="button" onClick={() => removeTimer(index)} className="bg-red-500 text-white px-2 py-1 rounded">🗑</button>
          </div>
        ))}
        <button type="button" onClick={addTimer} className="bg-green-500 text-white px-4 py-2 rounded">➕ הוסף טיימר</button>

        <label className="block text-gray-700">📸 העלאת תמונה:</label>
        {image && (
        <div className="mb-4">
          <img src={URL.createObjectURL(image)} alt="Uploaded" className="w-32 h-32 object-cover" /> {/* הקטנה של התמונה */}
        </div>
      )}
      <input type="file" onChange={handleImageChange} className="w-full" accept="image/*" />


        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded w-full">✅ שמור מתכון</button>
      </form>
    </div>
  );
}
