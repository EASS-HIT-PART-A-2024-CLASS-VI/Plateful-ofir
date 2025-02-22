import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import filterIcon from "../assets/icons/filter-image.png"; // 📌 אייקון פילטר

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedRating, setSelectedRating] = useState(null);
  const [hoveredRating, setHoveredRating] = useState(null); // ⭐ מעקב אחר הכוכבים שעומדים עליהם
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const filterButtonRef = useRef(null);

  useEffect(() => {
    fetch("/api/recipes/")
      .then((response) => response.json())
      .then((data) => {
        setRecipes(data);
        setFilteredRecipes(data);
        setLoading(false);
        const uniqueCategories = [...new Set(data.map((r) => r.categories))];
        setCategories(uniqueCategories);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let filtered = recipes;

    if (searchTerm) {
      filtered = filtered.filter((recipe) =>
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((recipe) =>
        recipe.categories.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (selectedRating !== null) {
      filtered = filtered.filter(
        (recipe) => Math.floor(recipe.rating) === selectedRating
      );
    }

    setFilteredRecipes(filtered);
  }, [searchTerm, selectedCategory, selectedRating, recipes]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target) &&
        !filterButtonRef.current.contains(event.target)
      ) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (loading)
    return <p className="text-center mt-10 text-blue-500">טוען מתכונים...</p>;
  if (error)
    return (
      <p className="text-center text-red-500 mt-10">שגיאה: {error}</p>
    );

  return (
    <div className="recipes-container">
      <h2 className="recipes-title">📖 כל המתכונים</h2>

      {/* 🔍 שדה חיפוש + כפתור פילטר */}
      <div className="search-filter-container">
        <input
          type="text"
          placeholder="🔎 חפש מתכון..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button
          className="filter-button"
          ref={filterButtonRef}
          onClick={() => setFilterOpen(!filterOpen)}
        >
          <img src={filterIcon} alt="Filter" className="filter-icon" />
        </button>
      </div>

      {/* 🔽 תפריט פילטר (יופיע מתחת לכפתור) */}
      {filterOpen && (
        <div
          className="filter-dropdown"
          ref={filterRef}
          style={{
            position: "absolute",
            top: filterButtonRef.current
              ? filterButtonRef.current.getBoundingClientRect().bottom + window.scrollY + 10
              : "50px",
            left: filterButtonRef.current
              ? filterButtonRef.current.getBoundingClientRect().left
              : "520",
          }}
        >
          {/* קטגוריות */}
          <div className="filter-section">
            <h4>📂 קטגוריות</h4>
            <div className="filter-grid">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() =>
                    setSelectedCategory(selectedCategory === category ? "" : category)
                  }
                  className={`filter-box ${
                    selectedCategory === category ? "selected" : ""
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* דירוג */}
          <div className="filter-section">
            <h4>⭐ דירוג</h4>
            <div className="filter-stars">
              {[1, 2, 3, 4, 5].map((rating) => (
                <span
                  key={rating}
                  className={`star ${
                    hoveredRating >= rating || selectedRating >= rating
                      ? "filled"
                      : ""
                  }`}
                  onMouseEnter={() => setHoveredRating(rating)}
                  onMouseLeave={() => setHoveredRating(null)}
                  onClick={() =>
                    setSelectedRating(selectedRating === rating ? null : rating)
                  }
                >
                  ⭐
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 📜 רשימת מתכונים */}
      <div className="recipe-grid">
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map((recipe) => (
            <Link to={`/recipes/${recipe.id}`} key={recipe.id} className="recipe-card">
              <img
                src={`/api${recipe.image_url}`}
                alt={recipe.name}
                className="recipe-image"
                onError={(e) => {
                  e.target.src = "/api/static/default-recipe.jpg";
                }}
              />
              <div className="recipe-details">
                <h3 className="recipe-title">{recipe.name}</h3>
                <p className="recipe-category">📂 {recipe.categories}</p>
                <p className="recipe-time">⏳ {recipe.cooking_time} דקות</p>
                <p className="recipe-rating">⭐ {recipe.rating.toFixed(1)}</p>
              </div>
            </Link>
          ))
        ) : (
          <p className="no-recipes">❌ לא נמצאו מתכונים.</p>
        )}
      </div>
    </div>
  );
}
