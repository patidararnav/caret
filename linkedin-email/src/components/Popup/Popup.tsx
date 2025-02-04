import { useState, useEffect, useRef } from "react";
import "./Popup.css";
import sendIcon from "../../assets/send_button.png";
import caretLogo from "../../assets/caretlogo.png";
import caretIcon from "../../assets/careticon.png";
import { generateResponse } from "../../services/openai";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

const Popup: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedText, setSelectedText] = useState<string>("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Scroll when messages change or loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: inputText };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const conversationHistory = messages;
      const response = await generateResponse(
        inputText,
        selectedText,
        conversationHistory
      );
      const caretResponse: Message = { role: "assistant", content: response };
      setMessages((prev) => [...prev, caretResponse]);
      setSelectedText("");
    } catch (error) {
      console.error("Error:", error);
      const errorResponse: Message = {
        role: "assistant",
        content: "I apologize, but I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkStoredText = async () => {
      const result = await chrome.storage.local.get("selectedText");
      if (result.selectedText) {
        setSelectedText(result.selectedText);
        await chrome.storage.local.remove("selectedText");
      }
    };
    checkStoredText();

    // Listen for storage changes
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.selectedText?.newValue) {
        setSelectedText(changes.selectedText.newValue);
        // Clear the storage after reading
        chrome.storage.local.remove("selectedText");
      }
    };

    // Listen for new selected text messages
    const handleMessage = (request: any) => {
      if (request.action === "NEW_SELECTED_TEXT" && request.data?.text) {
        setSelectedText(request.data.text);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    chrome.runtime.onMessage.addListener(handleMessage);
    
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  return (
    <div className="popup">
      <header className="header">
        <div className="logo">
          <img src={caretLogo} alt="Caret" className="logo-image" />
        </div>
      </header>

      <div className="chat-container" ref={chatContainerRef}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${
              message.role === "user" ? "user-message" : "ai-message"
            }`}
          >
            {message.role === "user" ? null : (
              <div className="ai-icon">
                <img src={caretIcon} alt="Caret AI" className="ai-icon-image" />
              </div>
            )}
            <div className="message-content">{message.content}</div>
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

      <div className="bottom-container">
        {selectedText && (
          <div className="selected-text-container">
            <div className="selected-text-header">
              <div className="selected-text-content">{selectedText}</div>
              <button 
                className="clear-text-button" 
                onClick={() => setSelectedText("")}
                aria-label="Clear selected text"
              >
                ×
              </button>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="input-form">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask anything..."
            className="message-input"
            rows={1}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
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
    </div>
  );
};

export default Popup;
