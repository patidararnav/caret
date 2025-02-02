import { useState, useEffect } from "react";
import "./Popup.css";
import sendIcon from "../../assets/send_button.png";
import caretLogo from "../../assets/caretlogo.png";
import caretIcon from "../../assets/careticon.png";
import { generateResponse } from "../../services/openai";

interface ChatMessage {
  text: string;
  isUser: boolean;
}

interface ApiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const Popup: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getConversationHistory = (messages: ChatMessage[]): ApiMessage[] => {
    return messages.map(msg => ({
      role: msg.isUser ? "user" : "assistant",
      content: msg.text
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    
    const userMessage = { text: inputText, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const conversationHistory = getConversationHistory(messages);
      const response = await generateResponse(inputText, conversationHistory);
      const caretResponse = { text: response, isUser: false };
      setMessages(prev => [...prev, caretResponse]);
    } catch (error) {
      console.error('Error:', error);
      const errorResponse = { 
        text: "I apologize, but I encountered an error. Please try again.", 
        isUser: false 
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleHighlightChange = (request: any) => {
      if (request.action === "ASK_CARET" && request.data?.text) {
        console.log("Received 'ASK_CARET' message with text:", request.data.text);
        setInputText(prev => `${prev} ${request.data.text}`.trim());
      }
    };

    chrome.runtime.onMessage.addListener(handleHighlightChange);
    return () => {
      chrome.runtime.onMessage.removeListener(handleHighlightChange);
    };
  }, []);

  return (
    <div className="popup">
      <header className="header">
        <div className="logo">
          <img src={caretLogo} alt="Caret" className="logo-image" />
        </div>
      </header>
      
      <div className="chat-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}
          >
            {message.isUser ? null : (
              <div className="ai-icon">
                <img src={caretIcon} alt="Caret AI" className="ai-icon-image" />
              </div>
            )}
            <div className="message-content">{message.text}</div>
          </div>
        ))}
        {isLoading && (
          <div className="message ai-message">
            <div className="ai-icon">
              <img src={caretIcon} alt="Caret AI" className="ai-icon-image" />
            </div>
            <div className="message-content typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask anything..."
          className="message-input"
          rows={1}
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <button type="submit" className="send-button" disabled={isLoading}>
          <img src={sendIcon} alt="Send" className="send-icon" />
        </button>
      </form>
    </div>
  );
};

export default Popup;
