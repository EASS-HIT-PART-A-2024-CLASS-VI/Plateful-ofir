import React, { useState, useEffect } from "react";
import ShoppingListImage from "./ShoppingListImage";
import "./ShoppingListImage.css"; 

const ShoppingListPopup = ({ recipeId, servings, isOpen, onClose }) => {
  const [ingredients, setIngredients] = useState([]);
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!recipeId) return;
    fetch(`/api/shopping-list/${recipeId}?servings=${servings}`)
      .then((response) => response.json())
      .then((data) => {
        if (data && data.shopping_list) {
          setIngredients(data.shopping_list);
          setIsLoading(false);
        } else {
          setError("לא התקבלו מרכיבים.");
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error("❌ שגיאה בשליפת רשימת קניות:", error);
        setError("לא ניתן לטעון את רשימת הקניות");
        setIsLoading(false);
      });
  }, [recipeId, servings]);

  const handleDownloadImage = async () => {
    if (!listRef.current) return;
    const canvas = await html2canvas(listRef.current, {
      backgroundColor: null, // רקע שקוף
      scale: 2, // שיפור איכות התמונה
    });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "shopping_list.png";
    link.click();
  };

  return (
    <div className={`fixed inset-0 bg-gray-700 bg-opacity-50 z-50 flex justify-center items-center ${!isOpen && "hidden"}`}>
      <div className="shopping-list-container">
        {/* אייקון X בפינה השמאלית העליונה */}
        <button className="close-btn" onClick={onClose}>✖</button>
        <h2 className="text-xl font-bold text-center"></h2>
        <div className="mt-4">
          {isLoading ? (
            <div className="text-center py-4">🔄 טוען רשימת קניות...</div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">{error}</div>
          ) : (
            <ShoppingListImage ingredients={ingredients} checkedItems={checkedItems} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ShoppingListPopup;
