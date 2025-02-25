import React, { useState } from "react";

export default function RatingStars({
  currentRating,
  onRate,
  readOnly = false,
}) {
  // State to track the star currently hovered over
  const [hover, setHover] = useState(null);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          // Only allow clicks and hover effects if not in readOnly mode
          onClick={() =>
            !readOnly && onRate && onRate(star === currentRating ? null : star)
          }
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(null)}
          style={{
            cursor: readOnly ? "default" : "pointer", // Change cursor based on readOnly status
            fontSize: "30px",
            // Highlight the star if its value is less than or equal to the hovered value or the current rating
            color: star <= (hover || currentRating) ? "#FFD700" : "#E0E0E0",
            transition: "color 0.2s ease-in-out",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}
