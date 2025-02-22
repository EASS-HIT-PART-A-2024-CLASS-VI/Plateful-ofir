import { useState } from "react";
import { toast } from "react-toastify";
import timerIcon from '../assets/icons/timer-image.png';
import timeIcon from '../assets/icons/time-image.png';
import servingsIcon from '../assets/icons/serving-image.png';
import categoriesIcon from '../assets/icons/category-image.png';
import tagsIcon from '../assets/icons/tag-image.png';
import imageIcon from '../assets/icons/upload-image.png';
import deleteIcon from '../assets/icons/delete-image.png';
import addIcon from '../assets/icons/add-image.png';
import "../App.css";

export default function CreateRecipe({ fetchUserRecipes  = () => {}}) {
    // State for recipe details
  const [newRecipe, setNewRecipe] = useState({
    name: "",
    preparation_steps: "",
    cooking_time: "",
    servings: "",
    categories: "",
    tags: "",
  });
    // State for image upload
  const [image, setImage] = useState(null);
   // State for ingredients and timers
  const [ingredients, setIngredients] = useState([]);
  const [timers, setTimers] = useState([]);
  const userId = localStorage.getItem("user_id");

    // Handle input changes for recipe fields
  const handleChange = (e) => {
    setNewRecipe({ ...newRecipe, [e.target.name]: e.target.value });
  };

   // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

   //  Handle ingredient updates
  const handleIngredientChange = (index, field, value) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      [field]: value
  };
    setIngredients(updatedIngredients);
  };

    // Add a new ingredient
  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", quantity: "", unit: "" }]);
  };

    // Remove an ingredient
  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

   // Add a new timer
  const addTimer = () => {
    setTimers([...timers, { step_number: "", duration: "", label: "" }]);
  };

    // Handle timer updates
  const handleTimerChange = (index, field, value) => {
    const updatedTimers = [...timers];
    updatedTimers[index] = {
      ...updatedTimers[index],
      [field]: value
    };
    setTimers(updatedTimers);
  };

    // Remove a timer
  const removeTimer = (index) => {
    setTimers(timers.filter((_, i) => i !== index));
  };

    // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      if (!userId) {
        toast.error("Please login to create a recipe.");
        return;
      }
  
        // Format timers and ingredients before sending
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
  
      // Reset form
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
  
// Verification that the function exists before calling
      if (typeof fetchUserRecipes === 'function') {
        fetchUserRecipes();
      }

    } catch (error) {
      console.error("❌ Error creating recipe:", error);
      toast.error(error.message || "Failed to create recipe.");
    }
  };
  
 
  return (
    // Main container for the recipe form
    <div className="recipe-form-container">
      {/* Form header with recipe icon */}
      <h2 className="recipe-title"> יצירת מתכון חדש</h2>
  
      {/* Main form element */}
      <form onSubmit={handleSubmit} className="recipe-form">
        {/* Recipe name input section */}
        <label className="form-label">שם המתכון:</label>
        <input 
          type="text" 
          name="name" 
          value={newRecipe.name} 
          onChange={handleChange} 
          className="form-input" 
          required 
        />
  
        {/* Ingredients section */}
        <label className="recipe-title"> מרכבים:</label>
        {/* Dynamic ingredients list with add/remove functionality */}
        {ingredients.map((ingredient, index) => (
          <div key={index} className="ingredient-container">
            {/* Ingredient name input */}
            <input 
              type="text" 
              placeholder="שם המרכיב" 
              value={ingredient.name} 
              onChange={(e) => handleIngredientChange(index, "name", e.target.value)} 
              className="form-input" 
              required 
            />
            {/* Quantity input */}
            <input 
              type="number" 
              placeholder="כמות" 
              value={ingredient.quantity} 
              onChange={(e) => handleIngredientChange(index, "quantity", e.target.value)} 
              className="form-input-small" 
              required 
            />
            {/* Unit input */}
            <input 
              type="text" 
              placeholder="יחידת מידה" 
              value={ingredient.unit} 
              onChange={(e) => handleIngredientChange(index, "unit", e.target.value)} 
              className="form-input-small" 
              required 
            />
            {/* Delete ingredient button */}
            <button 
              type="button" 
              onClick={() => removeIngredient(index)} 
              className="btn btn-delete"
            >
              <img src={deleteIcon} alt="Delete" className="icon-edit-create" />
            </button>
          </div>
        ))}
        {/* Add new ingredient button */}
        <button 
          type="button" 
          onClick={addIngredient} 
          className="btn btn-add"
        >
          <img src={addIcon} alt="Add" className="icon-edit-create" /> הוסף מרכיב
        </button>
  
        {/* Preparation steps section */}
        <label className="form-label">אופן הכנה:</label>
        <textarea 
          name="preparation_steps" 
          value={newRecipe.preparation_steps} 
          onChange={handleChange} 
          className="form-input" 
          required 
        />
  
        {/* Cooking time section */}
        <div className="icon-label">
          <img src="../assets/icons/time-image.png" alt="Cooking Time" className="icon" />
          <label> זמן הכנה:</label>
        </div>
        <input 
          type="number" 
          name="cooking_time" 
          value={newRecipe.cooking_time} 
          onChange={handleChange} 
          className="form-input" 
          required 
        />
  
        {/* Servings section */}
        <label className="form-label">
          <img src={servingsIcon} alt="Servings" className="icon-edit-create" /> כמות מנות:
        </label>
        <input 
          type="number" 
          name="servings" 
          value={newRecipe.servings} 
          onChange={handleChange} 
          className="form-input" 
          required 
        />
  
        {/* Categories section */}
        <label className="form-label">
          <img src={categoriesIcon} alt="Categories" className="icon-edit-create" /> קטגוריה:
        </label>
        <input 
          type="text" 
          name="categories" 
          value={newRecipe.categories} 
          onChange={handleChange} 
          className="form-input" 
          required 
        />
  
        {/* Tags section */}
        <label className="form-label">
          <img src={tagsIcon} alt="Tags" className="icon-edit-create" /> תגית:
        </label>
        <input 
          type="text" 
          name="tags" 
          value={newRecipe.tags} 
          onChange={handleChange} 
          className="form-input" 
        />
  
        {/* Timers section */}
        <label className="form-label">
          <img src={timerIcon} alt="Timers" className="icon-edit-create" /> טיימרים
        </label>
        {/* Dynamic timers list with add/remove functionality */}
        {timers.map((timer, index) => (
          <div key={index} className="timer-container">
            {/* Step number input */}
            <input 
              type="number" 
              placeholder="מס' שלב" 
              value={timer.step_number} 
              onChange={(e) => handleTimerChange(index, "step_number", e.target.value)} 
              className="form-input-small" 
              required 
            />
            {/* Duration input */}
            <input 
              type="number" 
              placeholder="זמן (דקות)" 
              value={timer.duration} 
              onChange={(e) => handleTimerChange(index, "duration", e.target.value)} 
              className="form-input-small" 
              required 
            />
            {/* Timer description input */}
            <input 
              type="text" 
              placeholder="תיאור" 
              value={timer.label} 
              onChange={(e) => handleTimerChange(index, "label", e.target.value)} 
              className="form-input" 
              required 
            />
            {/* Delete timer button */}
            <button 
              type="button" 
              onClick={() => removeTimer(index)} 
              className="btn btn-delete"
            >
              <img src={deleteIcon} alt="Delete" className="icon-edit-create" />
            </button>
          </div>
        ))}
        {/* Add new timer button */}
        <button 
          type="button" 
          onClick={addTimer} 
          className="btn btn-add"
        >
          <img src={addIcon} alt="Add" className="icon-edit-create" /> הוסף טיימר
        </button>
  
        {/* Image upload section */}
        <label className="form-label">
          <img src={imageIcon} alt="Image" className="icon-edit-create" /> העלה תמונה:
        </label>
        {/* Image preview */}
        {image && (
          <div className="image-preview">
            <img 
              src={URL.createObjectURL(image)} 
              alt="Uploaded" 
            />
          </div>
        )}
        {/* Image upload input */}
        <input 
          type="file" 
          onChange={handleImageChange} 
          className="form-input" 
          accept="image/*" 
        />
  
        {/* Submit button */}
        <button type="submit" className="btn btn-submit"> שמור מתכון</button>
      </form>
    </div>
  );
}