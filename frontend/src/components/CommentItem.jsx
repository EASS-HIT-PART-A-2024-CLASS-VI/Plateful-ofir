import React, { useState } from "react";
import "../App.css";

export default function CommentItem({ comment, onReply, level = 0 }) {
  // State for reply text, reply name, and whether to show the reply box
  const [replyText, setReplyText] = useState("");
  const [replyName, setReplyName] = useState("");
  const [showReplyBox, setShowReplyBox] = useState(false);

  return (
    <div className={`comment-container level-${level}`}>
      {/* User details */}
      <div className="comment-header">
        <div className="comment-avatar">
          {comment.username ? comment.username.charAt(0).toUpperCase() : "?"}
        </div>
        <p className="comment-username">
          {comment.username ? comment.username : "Anonymous"}
        </p>
      </div>

      {/* Comment content */}
      <p className="comment-content">{comment.content}</p>

      {/* Reply button */}
      <p
        className="reply-button"
        onClick={() => setShowReplyBox(!showReplyBox)}
      >
        ✎ השב
      </p>

      {/* Reply input box */}
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
            placeholder="כתב תגובה..."
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

      {/* Nested comments (replies) */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="nested-comments">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
