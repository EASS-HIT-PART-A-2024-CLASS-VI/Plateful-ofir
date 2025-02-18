
import React, {
  useState,
  forwardRef,
  useImperativeHandle
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TypingIndicator from "./TypingIndicator"; // רכיב 3 הנקודות

const ChatDrawer = forwardRef(({ isOpen, onClose, title }, ref) => {
  const [chatMessages, setChatMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // -- פונקציית עזר להוספת הודעה לצ'אט
  const addMessage = (text, fromUser = false) => {
    setChatMessages((prev) => [...prev, { text, fromUser }]);
  };

  // -- פונקציית עזר לשליטה ב-loading (נציג את האנימציה)
  const setLoading = (value) => {
    setIsLoading(value);
  };

  // חושפים את הפונקציות אל ההורה דרך ref
  useImperativeHandle(ref, () => ({
    addMessage,
    setLoading
  }));

  // -- שליחת הודעה של המשתמש לנתיב /chat
  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { text: input, fromUser: true };
    const updatedChat = [...chatMessages, userMsg];
    setChatMessages(updatedChat);
    setInput("");
    setIsLoading(true); // כאן אנו מציגים את האנימציה

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedChat }),
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setChatMessages((prev) => [...prev, { text: data.answer, fromUser: false }]);
    } catch (err) {
      console.error("Error:", err);
      setChatMessages((prev) => [
        ...prev,
        { text: "שגיאה בשליחת הודעה ל-AI", fromUser: false },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div
      style={{
        display: isOpen ? "block" : "none",
        position: "fixed",
        right: 0,
        top: 0,
        bottom: 0,
        width: 400,
        border: "1px solid #ccc",
        backgroundColor: "white",
      }}
    >
      {/* כותרת */}
      <div style={{ padding: 10, borderBottom: "1px solid #ccc" }}>
        <h3>{title}</h3>
        <button onClick={onClose}>סגור</button>
      </div>

      {/* הודעות */}
      <div style={{ height: "70%", overflowY: "auto", padding: 10 }}>
        {chatMessages.map((msg, i) => (
          <div
            key={i}
            style={{
              backgroundColor: msg.fromUser ? "#cce5ff" : "#f8f9fa",
              textAlign: msg.fromUser ? "right" : "left",
              margin: "5px 0",
              padding: "8px",
              borderRadius: "5px",
            }}
          >
            <div dir="rtl" style={{ textAlign: "right" }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.text}
              </ReactMarkdown>
            </div>
          </div>
        ))}

        {/* אם isLoading = true -> מציגים את האנימציית 3 נקודות */}
        {isLoading && (
          <div
            style={{
              margin: "5px 0",
              padding: "8px",
              backgroundColor: "#f8f9fa",
              textAlign: "left",
              borderRadius: "5px",
              width: "auto",
              display: "inline-block",
            }}
          >
            <TypingIndicator />
          </div>
        )}
      </div>

      {/* שורת קלט */}
      <div style={{ borderTop: "1px solid #ccc", padding: 10 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="הקלד הודעה..."
          style={{ width: "70%", marginRight: 10 }}
        />
        <button onClick={sendMessage} disabled={isLoading}>
          שלח
        </button>
      </div>
    </div>
  );
});

export default ChatDrawer;
