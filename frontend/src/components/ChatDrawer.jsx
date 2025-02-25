import React, { useState, forwardRef, useImperativeHandle } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TypingIndicator from "./TypingIndicator";
import sendIcon from "../assets/icons/send-image.png";
import "../App.css";

const ChatDrawer = forwardRef(({ isOpen, onClose }, ref) => {
  // State to manage chat messages, input text, and loading status.
  const [chatMessages, setChatMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Function to add a message to the chat.
  const addMessage = (text, fromUser = false) => {
    setChatMessages((prev) => [...prev, { text, fromUser }]);
  };

  // Function to update the loading state.
  const setLoading = (value) => {
    setIsLoading(value);
  };

  // Expose functions to parent components via ref.
  useImperativeHandle(ref, () => ({
    addMessage,
    setLoading,
  }));

  // Send a message to the /api/chat endpoint.
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
      setChatMessages((prev) => [
        ...prev,
        { text: data.answer, fromUser: false },
      ]);
    } catch (err) {
      console.error("Error:", err);
      setChatMessages((prev) => [
        ...prev,
        { text: "Error sending message to AI", fromUser: false },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`chat-drawer ${isOpen ? "open" : ""}`}>
      {/* Header with close button */}
      <div className="chat-header">
        <button onClick={onClose} className="chat-close-btn">
          ✖
        </button>
      </div>

      {/* Chat messages area */}
      <div className="chat-messages">
        {chatMessages.map((msg, i) => (
          <div
            key={i}
            className={`chat-message ${
              msg.fromUser ? "user-message" : "bot-message"
            }`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {msg.text}
            </ReactMarkdown>
          </div>
        ))}

        {isLoading && (
          <div className="chat-loading">
            <TypingIndicator />
          </div>
        )}
      </div>

      {/* Input area with send button */}
      <div className="chat-input-container">
        <button
          onClick={sendMessage}
          disabled={isLoading}
          className="chat-send-btn"
        >
          <img src={sendIcon} alt="send" className="sendIcon" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="chat-input"
        />
      </div>
    </div>
  );
});

export default ChatDrawer;
