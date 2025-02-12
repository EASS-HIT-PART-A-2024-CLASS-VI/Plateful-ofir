// RatingStars.jsx
import React, { useState } from "react";

export default function RatingStars({ currentRating, onRate }) {
  const [hoverRating, setHoverRating] = useState(0);

  // פונקציה שתצבע את הכוכבים לפי hoverRating (אם > 0), אחרת לפי currentRating
  const getDisplayedRating = () => {
    return hoverRating > 0 ? hoverRating : currentRating;
  };

  const renderStars = () => {
    const displayed = getDisplayedRating();
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          style={{
            cursor: "pointer",
            color: i <= displayed ? "gold" : "gray",
            fontSize: "24px",
            marginRight: "5px",
          }}
          // בלחיצה נזמין onRate(i)
          onClick={() => onRate(i)}
          // כשהעכבר מעל כוכב זה – נעדכן hoverRating
          onMouseEnter={() => setHoverRating(i)}
          // וכשיוצאים מהכוכב (mouseLeave) נאפס
          onMouseLeave={() => setHoverRating(0)}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  return <div>{renderStars()}</div>;
}
