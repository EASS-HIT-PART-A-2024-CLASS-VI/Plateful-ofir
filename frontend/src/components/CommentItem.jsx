import React, { useState } from "react";
import "../App.css"; // קישור לקובץ ה-CSS

export default function CommentItem({ comment, onReply, level = 0 }) {
  const [replyText, setReplyText] = useState("");
  const [replyName, setReplyName] = useState("");
  const [showReplyBox, setShowReplyBox] = useState(false);

  return (
    <div className={`comment-container level-${level}`}>
      {/* 🔹 פרטי המשתמש */}
      <div className="comment-header">
        <div className="comment-avatar">
          {comment.username ? comment.username.charAt(0).toUpperCase() : "?"}
        </div>
        <p className="comment-username">
          {comment.username ? comment.username : "משתמש אנונימי"}
        </p>
      </div>

      {/* 🔹 תוכן התגובה */}
      <p className="comment-content">{comment.content}</p>

      {/* 🔹 כפתור השב */}
      <p className="reply-button" onClick={() => setShowReplyBox(!showReplyBox)}>
        ✎ השב
      </p>

      {/* 🔹 תיבת תגובה */}
      {showReplyBox && (
        <div className="reply-box">
          <input
            type="text"
            value={replyName}
            onChange={(e) => setReplyName(e.target.value)}
            placeholder="שם"
            className="comment-input"
          />
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="כתוב תגובה..."
            className="comment-textarea"
          />
          <button
            onClick={() => {
              onReply(comment.id, replyText, replyName);
              setReplyText("");
              setReplyName("");
            }}
            className="comment-submit"
          >
            שלח תגובה
          </button>
        </div>
      )}

      {/* 🔹 תגובות מקוננות */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="nested-comments">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} onReply={onReply} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
