import React, { createContext, useContext, useState, useRef } from "react";
import ChatDrawer from "../components/ChatDrawer";

// Create a context for chat functionality
const ChatContext = createContext();

export function ChatProvider({ children }) {
  // State to control whether the chat drawer is open
  const [isChatOpen, setIsChatOpen] = useState(false);
  // Reference to access ChatDrawer methods
  const chatRef = useRef(null);

  // Function to open the chat and add an initial message (if provided)
  const openChat = (message) => {
    setIsChatOpen(true);
    if (message && chatRef.current) {
      chatRef.current.addMessage(message, false);
    }
  };

  // Function to close the chat drawer
  const closeChat = () => {
    setIsChatOpen(false);
  };

  return (
    <ChatContext.Provider value={{ isChatOpen, openChat, closeChat, chatRef }}>
      {children}
      <ChatDrawer
        ref={chatRef}
        isOpen={isChatOpen}
        onClose={closeChat}
        title="עוזר מתכונים"
      />
    </ChatContext.Provider>
  );
}

// Custom hook to access the chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
