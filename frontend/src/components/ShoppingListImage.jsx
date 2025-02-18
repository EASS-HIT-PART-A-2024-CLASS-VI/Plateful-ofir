import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import "./ShoppingListImage.css";
import shoppingPhoto from "../assets/shopping-cart-guy.png";

const ShoppingListImage = ({ ingredients, onClose }) => {
  const listRef = useRef(null);
  const [checkedItems, setCheckedItems] = useState(new Set());

  // ✅ עדכון סטייט בלחיצה על הצ'קבוקס
  const handleItemToggle = (itemName) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemName)) {
        newSet.delete(itemName);
      } else {
        newSet.add(itemName);
      }
      return newSet;
    });
  };

  const handleDownloadImage = async () => {
    if (!listRef.current) return;

    // יצירת עותק של האלמנט מבלי המוצרים שסומנו
    const filteredList = listRef.current.cloneNode(true);
    const items = filteredList.querySelectorAll(".shopping-list-item");

    items.forEach((item) => {
      const label = item.querySelector("label");
      if (checkedItems.has(label.textContent.split(" - ")[0])) {
        item.remove();
      }
    });

    document.body.appendChild(filteredList);
    const canvas = await html2canvas(filteredList);
    document.body.removeChild(filteredList);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "shopping_list.png";
    link.click();
  };

  return (
    <div className="shopping-list-container-small">
      <div ref={listRef} className="shopping-list-paper">
        {/* כותרת רשימת קניות */}
        <div className="shopping-list-header">🛒 רשימת קניות</div>

        {/* רשימת המצרכים */}
        <ul className="shopping-list-items">
          {ingredients.map((item, index) => (
            <li key={index} className="shopping-list-item">
              <label>
                <input
                  type="checkbox"
                  checked={checkedItems.has(item.name)}
                  onChange={() => handleItemToggle(item.name)}
                />
                {item.name} - {item.quantity} {item.unit}
              </label>
            </li>
          ))}
        </ul>

        {/* תמונת הדמות עם העגלה - חלק מהרקע הצהוב */}
        <div className="shopping-list-footer">
          <img src={shoppingPhoto} alt="Shopping cart guy" />
        </div>
        </div>

      <div className="download-btn-container"/>
        <button onClick={handleDownloadImage} className="download-btn">
            📸 הורד כתמונה
        </button>
    </div>
  );
};

export default ShoppingListImage;
