"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  TrendingUp,
  DollarSign,
  Clock,
  BarChart3,
  Sparkles,
  Send,
} from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const quickActions = [
  {
    icon: BarChart3,
    label: "Analyze Inventory",
    prompt:
      "Please analyze my current inventory. Look at what's in stock, identify any slow movers that have been sitting for a while, and give me actionable recommendations for optimizing my inventory.",
    color:
      "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300",
  },
  {
    icon: DollarSign,
    label: "Help Price a Watch",
    prompt:
      "I'm considering purchasing a watch and need help evaluating if it's a good deal. I'll describe the watch - please analyze based on my sales history and give me a recommended maximum purchase price.",
    color:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300",
  },
  {
    icon: Clock,
    label: "Find Slow Movers",
    prompt:
      "Which watches in my inventory have been in stock the longest? List them with how many days they've been sitting and suggest actions I could take - price reductions, different platforms, etc.",
    color:
      "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300",
  },
  {
    icon: TrendingUp,
    label: "Performance Review",
    prompt:
      "Give me a performance review of my watch business. Compare recent months, identify my best and worst performing brands, platforms, and any trends you notice in my margins.",
    color:
      "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300",
  },
];

const suggestedQuestions = [
  "What's my best performing brand?",
  "How did last month compare to the month before?",
  "What's my average margin on eBay vs other platforms?",
  "What's my total profit this year?",
  "Which source gives me the best deals?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    await sendMessage(input);
  }

  async function sendMessage(content: string) {
    const userMessage: Message = { role: "user", content };
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
    } catch {
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

  function handleQuickAction(prompt: string) {
    sendMessage(prompt);
  }

  function clearChat() {
    setMessages([]);
  }

  return (
    <main className="max-w-4xl mx-auto p-8 h-[calc(100vh-80px)] flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="text-yellow-500" size={28} />
            AI Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ask anything about your watch business
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear chat
          </button>
        )}
      </div>

      {messages.length === 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => handleQuickAction(action.prompt)}
                disabled={loading}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all hover:scale-[1.02] disabled:opacity-50 ${action.color}`}
              >
                <action.icon size={24} />
                <span className="text-sm font-medium text-center">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg p-4 mb-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare
              className="mx-auto text-gray-300 dark:text-gray-600 mb-4"
              size={48}
            />
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Ask me anything about your inventory, sales, or profits.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedQuestions.map((question, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(question);
                    inputRef.current?.focus();
                  }}
                  className="text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
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
                      ? "bg-black dark:bg-white text-white dark:text-black"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 text-gray-500 dark:text-gray-400">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce">●</span>
                    <span
                      className="animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    >
                      ●
                    </span>
                    <span
                      className="animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    >
                      ●
                    </span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your business..."
          className="flex-1 border dark:border-gray-700 dark:bg-gray-800 rounded-lg px-4 py-3"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          <Send size={18} />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </main>
  );
}
