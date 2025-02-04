import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedRating, setSelectedRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/recipes/")
      .then((response) => response.json())
      .then((data) => {
        setRecipes(data);
        setFilteredRecipes(data);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  // פונקציה לסינון מתכונים לפי חיפוש, קטגוריות ודירוג
  useEffect(() => {
    let filtered = recipes;

    if (searchTerm) {
      filtered = filtered.filter((recipe) =>
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((recipe) => recipe.categories.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (selectedRating !== null) {
      filtered = filtered.filter((recipe) => Math.floor(recipe.rating) === selectedRating);
    }

    setFilteredRecipes(filtered);
  }, [searchTerm, selectedCategory, selectedRating, recipes]);

  if (loading) return <p className="text-center mt-10 text-blue-500">Loading recipes...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">Error: {error}</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-4 text-center">Recipes</h2>

      {/* חיפוש */}
      <input
        type="text"
        placeholder="Search for a recipe..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border p-2 w-full mb-4 rounded"
      />

      {/* סינון לפי קטגוריה */}
      <div className="flex justify-center gap-4 mb-4">
        {["Breakfast", "Lunch", "Dinner"].map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category === selectedCategory ? "" : category)}
            className={`px-4 py-2 rounded ${selectedCategory === category ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* סינון לפי דירוג */}
      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
            className={`px-3 py-1 rounded ${selectedRating === rating ? "bg-yellow-500 text-white" : "bg-gray-200"}`}
          >
            {"⭐".repeat(rating)}
          </button>
        ))}
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {filteredRecipes.length > 0 ? (
    filteredRecipes.map((recipe) => (
      <li key={recipe.id} className="border p-4 rounded-lg shadow-lg bg-white">
        <img src={recipe.image_url || "http://localhost:8000/static/default-recipe.jpg"} alt={recipe.name} className="w-full h-40 object-cover rounded-md mb-2" />
        <h3 className="text-xl font-semibold text-gray-800">{recipe.name}</h3>
        <p className="text-sm text-gray-500">Cooking Time: {recipe.cooking_time} min</p>
        <p className="text-sm text-gray-500">Category: {recipe.categories}</p>
        <p className="text-sm text-gray-500">Rating: ⭐ {recipe.rating.toFixed(1)}</p>
        <Link to={`/recipes/${recipe.id}`} className="text-blue-500 mt-2 inline-block">
          View Details
        </Link>
      </li>
    ))
  ) : (
    <p className="text-center text-gray-600 col-span-2">No recipes found.</p>
  )}
</ul>
    </div>
  );
}
