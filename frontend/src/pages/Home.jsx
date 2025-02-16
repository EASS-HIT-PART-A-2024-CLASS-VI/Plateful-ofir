import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [featuredRecipe, setFeaturedRecipe] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    fetch("/api/recipes/")
      .then((response) => response.json())
      .then((data) => {
        setRecipes(data);
        if (data.length > 0) {
          setFeaturedRecipe(data[0]); // מתכון ראשי
        }
      })
      .catch((error) => console.error("Error fetching recipes:", error));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4">
      
      {/* 🔍 חיפוש אלגנטי */}
      <div className="relative mt-12 mb-8 flex justify-center">
        <input
          type="text"
          placeholder="מה בא לך לבשל?"
          className="border px-5 py-3 rounded-full text-gray-700 shadow-md w-96 bg-white bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-[#457B9D] transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <i className="fas fa-search absolute right-4 top-3 text-gray-500"></i>
      </div>

      {/* 📸 באנר ראשי עם מתכון מוצג */}
      {featuredRecipe && (
        <div className="relative mt-10 rounded-lg overflow-hidden shadow-lg">
            <img
            src={featuredRecipe.image_url ? `/api${featuredRecipe.image_url}` : "/api/static/default-recipe.jpg"}
            alt={featuredRecipe.name}
            className="w-full h-[600px] object-cover transition-all duration-300 hover:scale-105"
            onError={(e) => {
                e.target.src = "/api/static/default-recipe.jpg"; // ✅ אם יש בעיה, נטען תמונת ברירת מחדל
            }}
            />
          <div className="absolute bottom-10 left-10 bg-white bg-opacity-80 px-10 py-6 rounded-lg shadow-md">
            <h2 className="text-4xl font-bold text-gray-900">{featuredRecipe.name}</h2>
            <p className="text-lg text-gray-700">{featuredRecipe.description || "מתכון מיוחד שכדאי לנסות!"}</p>
            <Link to={`/recipes/${featuredRecipe.id}`} className="inline-block mt-4 bg-[#457B9D] text-white px-6 py-3 rounded-full hover:bg-[#1D3557] transition">
              למתכון המלא
            </Link>
          </div>
        </div>
      )}

      {/* 🏷️ קטגוריות */}
      <div className="flex justify-center gap-4 mt-12">
        {["ארוחת בוקר", "ארוחת צהריים", "ארוחת ערב", "קינוחים", "בריא"].map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-6 py-3 rounded-full text-gray-700 shadow-md text-lg transition-all duration-200 ${
              selectedCategory === category ? "bg-[#457B9D] text-white shadow-lg" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* 🥗 תצוגת המתכונים */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
        {recipes.map((recipe) => (
          <Link to={`/recipes/${recipe.id}`} key={recipe.id} className="block rounded-lg shadow-md overflow-hidden bg-white hover:shadow-xl transition transform hover:scale-105 duration-200">
            <img
            src={featuredRecipe.image_url ? `/api${featuredRecipe.image_url}` : "/api/static/default-recipe.jpg"}
            alt={featuredRecipe.name}
            className="w-full h-[600px] object-cover transition-all duration-300 hover:scale-105"
            onError={(e) => {
                e.target.src = "/api/static/default-recipe.jpg"; // ✅ אם יש בעיה, נטען תמונת ברירת מחדל
            }}
            />
            <div className="p-5">
              <h4 className="text-xl font-bold text-gray-800">{recipe.name}</h4>
              <p className="text-md text-gray-500">⏳ זמן הכנה: {recipe.cooking_time} דקות</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
