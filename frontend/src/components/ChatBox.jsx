import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ChatBox.css";

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [botTyping, setBotTyping] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setBotTyping(true);

    try {
      const res = await axios.post("http://127.0.0.1:5000/ask", { query: input });

      const botMessage = { sender: "bot", text: res.data.response };
      setTimeout(() => {
        setMessages((prev) => [...prev, botMessage]);
        setBotTyping(false);
      }, 500); // Simulate delay
    } catch (err) {
      const errorMessage = { sender: "bot", text: "Error: Server not responding." };
      setMessages((prev) => [...prev, errorMessage]);
      setBotTyping(false);
    }
  };

  return (
    <div className="chat-container">
      <h2 className="chat-title">Crypto ChatBot</h2>
      <div className="chatbox">
        {messages.map((msg, index) => (
          <div key={index} className={`bubble ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        {botTyping && (
          <div className="bubble bot typing">...</div>
        )}
      </div>
      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me about crypto!"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatBox;
