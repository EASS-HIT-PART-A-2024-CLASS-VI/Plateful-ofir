import React, { useState, useEffect } from "react";
import ShoppingListImage from "./ShoppingListImage";
import "./ShoppingListImage.css";

const ShoppingListPopup = ({ recipeId, servings, isOpen, onClose }) => {
  // State to manage ingredients, loading status, and errors.
  const [ingredients, setIngredients] = useState([]);
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the shopping list when recipeId or servings change.
  useEffect(() => {
    if (!recipeId) return;
    fetch(`/api/shopping-list/${recipeId}?servings=${servings}`)
      .then((response) => response.json())
      .then((data) => {
        if (data && data.shopping_list) {
          setIngredients(data.shopping_list);
        } else {
          setError("No ingredients received.");
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching shopping list:", error);
        setError("Unable to load shopping list");
        setIsLoading(false);
      });
  }, [recipeId, servings]);

  // Download image function (currently not used; note: listRef is not defined here)
  const handleDownloadImage = async () => {
    if (!listRef.current) return;
    const canvas = await html2canvas(listRef.current, {
      backgroundColor: null, // Transparent background
      scale: 2, // Improve image quality
    });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "shopping_list.png";
    link.click();
  };

  return (
    <div
      className={`fixed inset-0 bg-gray-700 bg-opacity-50 z-50 flex justify-center items-center ${
        !isOpen && "hidden"
      }`}
    >
      <div className="shopping-list-container">
        {/* Close button */}
        <button className="close-btn" onClick={onClose}>
          ✖
        </button>
        <h2 className="text-xl font-bold text-center"></h2>
        <div className="mt-4">
          {isLoading ? (
            <div className="text-center py-4">Loading shopping list...</div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">{error}</div>
          ) : (
            <ShoppingListImage
              ingredients={ingredients}
              checkedItems={checkedItems}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ShoppingListPopup;
