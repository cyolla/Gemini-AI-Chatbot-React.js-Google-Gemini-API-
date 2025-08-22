/*
GeminiChatBot.jsx

A React component for a Gemini AI Chatbot with:
- Chat history (persistent via localStorage)
- Theme switching (light/dark)
- Google Gemini API integration (configurable via env vars)
- Responsive UI with Tailwind CSS

Setup:
1. Install dependencies:
   npm install lucide-react
   (Make sure Tailwind is set up in your project)

2. Provide environment variables:
   REACT_APP_GEMINI_ENDPOINT = Gemini API endpoint (e.g. https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent)
   REACT_APP_GEMINI_API_KEY = your API key

3. Import and use: <GeminiChatBot />
*/

import React, { useState, useEffect, useRef } from "react";
import { Moon, Sun, Send } from "lucide-react";

export default function GeminiChatBot() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("gemini_chat_history");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const chatEndRef = useRef(null);

  const GEMINI_ENDPOINT = process.env.REACT_APP_GEMINI_ENDPOINT || "";
  const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "";

  useEffect(() => {
    localStorage.setItem("gemini_chat_history", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const resp = await fetch(GEMINI_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GEMINI_API_KEY}`,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: input }] }],
        }),
      });

      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`API error ${resp.status}: ${t}`);
      }

      const json = await resp.json();
      const reply = extractText(json);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Error: " + err.message }]);
    } finally {
      setLoading(false);
    }
  }

  function extractText(json) {
    if (json?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return json.candidates[0].content.parts[0].text;
    }
    return JSON.stringify(json);
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-lg font-semibold">Gemini AI Chatbot</h1>
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-4 py-2 rounded-2xl max-w-xs md:max-w-md whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-sky-600 text-white rounded-br-none"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-sm text-gray-500">Gemini is typing...</div>}
        <div ref={chatEndRef} />
      </main>

      {/* Input Area */}
      <footer className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
        <input
          type="text"
          className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="p-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </footer>
    </div>
  );
}
