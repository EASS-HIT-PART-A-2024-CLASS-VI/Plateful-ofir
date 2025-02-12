import React, { useState } from "react";

function CommentItem({ comment, onReply, level = 0 }) {
  const [isReplyBoxOpen, setIsReplyBoxOpen] = useState(false);
  const [replyText, setReplyText] = useState("");

  const handleSubmitReply = () => {
    if (!replyText.trim()) return;
    onReply(comment.id, replyText);
    setReplyText("");
    setIsReplyBoxOpen(false);
  };

  return (
    <div
      style={{
        marginLeft: `${level * 20}px`, // הזחה תלויה ברמת השרשור (20px לכל רמה)
        marginTop: "10px",
        padding: "5px",
        borderLeft: "2px solid #ccc" // קו שמדגיש את ההזחה
      }}
    >
      <div>
        <strong>👤 משתמש {comment.user_id}:</strong>
        <p>{comment.content}</p>
      </div>
      <button
        onClick={() => setIsReplyBoxOpen(!isReplyBoxOpen)}
        style={{
          marginTop: "5px",
          fontSize: "0.9rem",
          color: "#007bff",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0
        }}
      >
        {isReplyBoxOpen ? "בטל" : "השב"}
      </button>
      {isReplyBoxOpen && (
        <div style={{ marginTop: "5px" }}>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="כתוב תגובה..."
            style={{
              width: "100%",
              padding: "5px",
              marginBottom: "5px",
              fontSize: "0.9rem"
            }}
          ></textarea>
          <button
            onClick={handleSubmitReply}
            style={{
              fontSize: "0.9rem",
              backgroundColor: "#007bff",
              color: "white",
              padding: "5px 10px",
              border: "none",
              borderRadius: "3px",
              cursor: "pointer"
            }}
          >
            שלח תגובה
          </button>
        </div>
      )}
      {comment.replies && comment.replies.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          {comment.replies.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              onReply={onReply}
              level={level + 1} // מעבירים את הרמה +1 לכל תגובה ילד
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentItem;
