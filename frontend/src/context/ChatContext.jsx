import React, { createContext, useContext, useState, useRef } from 'react';
import ChatDrawer from '../components/ChatDrawer';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatRef = useRef(null);

  const openChat = (message) => {
    setIsChatOpen(true);
    if (message && chatRef.current) {
      chatRef.current.addMessage(message, false);
    }
  };

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

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};