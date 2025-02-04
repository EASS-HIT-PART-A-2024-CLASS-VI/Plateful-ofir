import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/recipes/")
      .then((response) => response.json())
      .then((data) => {
        setRecipes(data);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-center mt-10 text-blue-500">Loading recipes...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">Error: {error}</p>;

  return (
    <div className="text-center mt-10">
      <h2 className="text-3xl font-bold mb-4">Welcome to Plateful!</h2>
      <h3 className="text-2xl font-semibold mb-6">Explore our delicious recipes</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <Link to={`/recipes/${recipe.id}`} key={recipe.id} className="border p-4 rounded-lg shadow-md bg-white">
            <img src={recipe.image_url || "http://localhost:8000/static/default-recipe.jpg"} alt={recipe.name} className="w-full h-40 object-cover rounded-md" />
            <h4 className="text-xl font-bold mt-2">{recipe.name}</h4>
            <p className="text-gray-600">Cooking Time: {recipe.cooking_time} min</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
