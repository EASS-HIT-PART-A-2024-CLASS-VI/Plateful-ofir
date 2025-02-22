import React, { useState, forwardRef, useImperativeHandle } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TypingIndicator from "./TypingIndicator";
import sendIcon from "../assets/icons/send-image.png"
import "../App.css";


const ChatDrawer = forwardRef(({ isOpen, onClose }, ref) => {
  const [chatMessages, setChatMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // פונקציה להוספת הודעות לצ'אט
  const addMessage = (text, fromUser = false) => {
    setChatMessages((prev) => [...prev, { text, fromUser }]);
  };

  // פונקציה לשליטה באנימציית טעינה
  const setLoading = (value) => {
    setIsLoading(value);
  };

  // חשיפת הפונקציות להורה דרך ref
  useImperativeHandle(ref, () => ({
    addMessage,
    setLoading
  }));

  // שליחת הודעה לנתיב /chat
  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { text: input, fromUser: true };
    const updatedChat = [...chatMessages, userMsg];
    setChatMessages(updatedChat);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedChat }),
      });

      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      setChatMessages((prev) => [...prev, { text: data.answer, fromUser: false }]);
    } catch (err) {
      console.error("Error:", err);
      setChatMessages((prev) => [...prev, { text: "שגיאה בשליחת הודעה ל-AI", fromUser: false }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`chat-drawer ${isOpen ? "open" : ""}`}>
      {/* כותרת */}
      <div className="chat-header">
        <button onClick={onClose} className="chat-close-btn">✖</button>
        
      </div>

      {/* הודעות */}
      <div className="chat-messages">
        {chatMessages.map((msg, i) => (
          <div
            key={i}
            className={`chat-message ${msg.fromUser ? "user-message" : "bot-message"}`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
          </div>
        ))}

        {isLoading && (
          <div className="chat-loading">
            <TypingIndicator />
          </div>
        )}
      </div>

      {/* שורת קלט */}
      <div className="chat-input-container">
        <button onClick={sendMessage} disabled={isLoading} className="chat-send-btn">
            <img src={sendIcon} alt="send" className="sendIcon" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="הקלד הודעה..."
          className="chat-input"
        />
      </div>
    </div>
  );
});

export default ChatDrawer;
