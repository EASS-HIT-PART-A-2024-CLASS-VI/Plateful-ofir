import React, { useState } from "react";

export default function RatingStars({ currentRating, onRate, readOnly = false }) {
  const [hover, setHover] = useState(null);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => !readOnly && onRate && onRate(star === currentRating ? null : star)} // ✅ רק אם זה לא readOnly
          onMouseEnter={() => !readOnly && setHover(star)} // ✅ רק אם זה לא readOnly
          onMouseLeave={() => !readOnly && setHover(null)} // ✅ רק אם זה לא readOnly
          style={{
            cursor: readOnly ? "default" : "pointer", // ❌ אין אפשרות ללחוץ במצב readOnly
            fontSize: "30px",
            color: star <= (hover || currentRating) ? "#FFD700" : "#E0E0E0",
            transition: "color 0.2s ease-in-out"
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}
