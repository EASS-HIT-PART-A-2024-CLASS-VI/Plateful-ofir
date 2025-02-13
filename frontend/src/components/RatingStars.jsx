import React, { useState } from "react";

export default function RatingStars({ currentRating, onRate }) {
  const [hover, setHover] = useState(null);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => onRate(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(null)}
          style={{
            cursor: "pointer",
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