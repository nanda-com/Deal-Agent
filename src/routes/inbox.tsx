import React from "react";

const chats = [
  {
    id: 1,
    name: "Rahul",
    platform: "WhatsApp",
    message: "I want pricing details",
    unread: 2,
  },
  {
    id: 2,
    name: "Sneha",
    platform: "Instagram",
    message: "Is this available?",
    unread: 1,
  },
  {
    id: 3,
    name: "Kiran",
    platform: "Facebook",
    message: "Need support",
    unread: 0,
  },
];

export default function InboxPage() {

  const [message, setMessage] = React.useState("");

  const [isTyping, setIsTyping] = React.useState(false);

  const [messages, setMessages] = React.useState([
    {
      text: "Hello 👋",
      sender: "ai",
    },
    {
      text: "How can we help you?",
      sender: "ai",
    },
  ]);

  const handleSend = () => {

    if (!message.trim()) return;

    const userMessage = {
      text: message,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);

    const currentMessage = message;

    setMessage("");

    setIsTyping(true);

    setTimeout(() => {

      setIsTyping(false);

      const aiReply = {
        text:
          "🤖 AI: Thanks for your message regarding '" +
          currentMessage +
          "'. Our team will contact you shortly.",
        sender: "ai",
      };

      setMessages((prev) => [...prev, aiReply]);

    }, 1500);
  };

  return (
    <div className="min-h-screen p-6 text-white">

      <h1 className="text-3xl font-bold mb-6">
        Unified Inbox
      </h1>

      {/* Chat Cards */}
      <div className="space-y-4 mb-8">

        {chats.map((chat) => (

          <div
            key={chat.id}
            className="glass rounded-2xl p-4 flex items-center justify-between"
          >

            <div>

              <h2 className="text-xl font-semibold">
                {chat.name}
              </h2>

              <p className="text-sm text-gray-300">
                {chat.platform}
              </p>

              <p className="mt-2">
                {chat.message}
              </p>

            </div>

            <div className="flex flex-col items-end gap-3">

              {chat.unread > 0 && (
                <span className="bg-pink-500 px-3 py-1 rounded-full text-sm">
                  {chat.unread} unread
                </span>
              )}

              <button
                onClick={() => {
                  alert(
                    "AI Reply: Thanks for contacting us."
                  );
                }}
                className="bg-cyan-500 hover:bg-cyan-400 transition px-4 py-2 rounded-xl"
              >
                AI Reply
              </button>

            </div>

          </div>

        ))}

      </div>

      {/* Messages */}
      <div className="glass rounded-2xl p-4 mb-6 space-y-4 min-h-[300px] max-h-[400px] overflow-y-auto">

        {messages.map((msg, index) => (

          <div
            key={index}
            className={`flex ${
              msg.sender === "user"
                ? "justify-end"
                : "justify-start"
            }`}
          >

            <div
              className={`px-4 py-3 rounded-2xl max-w-[70%] shadow-lg ${
                msg.sender === "user"
                  ? "bg-gradient-to-r from-purple-500 to-cyan-500"
                  : "bg-white/10 border border-white/10"
              }`}
            >
              {msg.text}
            </div>

          </div>

        ))}

        {isTyping && (
          <div className="text-sm text-gray-400 animate-pulse">
            🤖 AI is typing...
          </div>
        )}

      </div>

      {/* Input */}
      <div className="glass rounded-2xl p-4 flex gap-4 items-center">

        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
          placeholder="Type a reply..."
          className="flex-1 bg-transparent outline-none text-white"
        />

        <button
          onClick={handleSend}
          className="bg-gradient-to-r from-purple-500 to-cyan-500 px-6 py-3 rounded-2xl hover:opacity-90 transition"
        >
          Send
        </button>

      </div>

    </div>
  );
}