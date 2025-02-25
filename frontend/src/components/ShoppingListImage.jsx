import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import "./ShoppingListImage.css";
import shoppingPhoto from "../assets/icons/shopping-cart-guy.png";
import downloadIcon from "../assets/icons/download-image.png";

const ShoppingListImage = ({ ingredients, onClose }) => {
  const listRef = useRef(null);
  const [checkedItems, setCheckedItems] = useState(new Set());

  // Update state when a checkbox is toggled
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

    // Clone the list and remove items that are checked
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
        {/* Shopping list header */}
        <div className="shopping-list-header">🛒 רשימת קניות</div>

        {/* Ingredients list */}
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

        {/* Footer image */}
        <div className="shopping-list-footer">
          <img src={shoppingPhoto} alt="Shopping cart guy" />
        </div>
      </div>

      <div className="download-btn-container">
        <button onClick={handleDownloadImage}>
          <img src={downloadIcon} alt="Download" className="download-icon" />
        </button>
      </div>
    </div>
  );
};

export default ShoppingListImage;
