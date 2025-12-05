"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages([
          ...newMessages,
          { role: "assistant", content: `Error: ${data.error}` },
        ]);
      } else {
        setMessages([
          ...newMessages,
          { role: "assistant", content: data.response },
        ]);
      }
    } catch (error) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Failed to get response. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const suggestedQuestions = [
    "What's my best performing brand?",
    "How did last month compare to the month before?",
    "What's my average margin on eBay vs other platforms?",
    "Which watches have been in stock the longest?",
    "What's my total profit this year?",
  ];

  return (
    <main className="max-w-4xl mx-auto p-8 h-[calc(100vh-80px)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-3xl font-bold">Business Chat</h1>
        <p className="text-gray-600">Ask anything about your watch business</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white border rounded-lg p-4 mb-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-6">
              Ask me anything about your inventory, sales, or profits.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedQuestions.map((question, i) => (
                <button
                  key={i}
                  onClick={() => setInput(question)}
                  className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-gray-700"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, i) => (
              <div
                key={i}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {message.content.split("\n").map((line, j) => (
                    <p key={j} className={j > 0 ? "mt-2" : ""}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2 text-gray-500">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your business..."
          className="flex-1 border rounded-lg px-4 py-3"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </main>
  );
}
