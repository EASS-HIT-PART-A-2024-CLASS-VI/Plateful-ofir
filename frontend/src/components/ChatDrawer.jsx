import React, { useState, useEffect } from 'react';

const ChatDrawer = ({ isOpen, onClose, title, messages = [] }) => {
  const [input, setInput] = useState("");
  const [chatMessages, setChatMessages] = useState(messages);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setChatMessages(messages);
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, fromUser: true };
    setChatMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // API call placeholder
      setIsLoading(false);
    } catch (error) {
      console.error("Error sending message:", error);
      setChatMessages(prev => [...prev, { 
        text: "סליחה, הייתה שגיאה בעיבוד ההודעה שלך", 
        fromUser: false 
      }]);
      setIsLoading(false);
    }
  };

  // Function to process markdown-style formatting
  const processMarkdown = (text) => {
    // Split text into lines for processing
    return text.split('\n').map((line, index) => {
      // Handle headers
      if (line.startsWith('##')) {
        return (
          <h2 key={index} className="text-xl font-bold mt-4 mb-3">
            {line.replace(/^##\s*/, '')}
          </h2>
        );
      }
      
      // Handle single # headers
      if (line.startsWith('#')) {
        return (
          <h1 key={index} className="text-2xl font-bold mt-4 mb-3">
            {line.replace(/^#\s*/, '')}
          </h1>
        );
      }

      // Handle bullet points with asterisks
      if (line.trim().match(/^\*\s/)) {
        return (
          <li key={index} className="mr-4 mb-2">
            {line.replace(/^\*\s/, '')}
          </li>
        );
      }

      // Handle numbered items (e.g., "1. *")
      if (line.trim().match(/^\d+\.\s*\*/)) {
        return (
          <div key={index} className="mb-2 font-semibold">
            {line.replace(/\*/g, '')}
          </div>
        );
      }

      // Handle emphasized text with double asterisks
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <div key={index} className="mb-2">
            {parts.map((part, i) => (
              i % 2 === 0 ? part : <strong key={i}>{part}</strong>
            ))}
          </div>
        );
      }

      // Default paragraph handling
      return line.trim() ? (
        <p key={index} className="mb-2">
          {line}
        </p>
      ) : (
        <div key={index} className="h-2" /> // Empty line spacing
      );
    });
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-96 bg-white shadow-lg border-l transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ zIndex: 1000 }}
    >
      {/* Header */}
      <div className="p-4 bg-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button 
          onClick={onClose} 
          className="text-gray-600 hover:text-gray-800"
        >
          ×
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex flex-col h-[calc(100%-8rem)] overflow-y-auto p-4" dir="rtl">
        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg max-w-[85%] mb-3 ${
              msg.fromUser
                ? "ml-auto bg-blue-500 text-white"
                : "mr-auto bg-gray-50 border border-gray-200"
            }`}
          >
            <div className="text-right">
              {processMarkdown(msg.text)}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="mr-auto bg-gray-100 p-3 rounded-lg">
            <span className="animate-pulse">...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
        <div className="flex gap-2" dir="rtl">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="הקלד הודעה..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            dir="rtl"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            שלח
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatDrawer;