import React, { useState, useRef, useEffect } from "react";
import { FileText } from "lucide-react";
import { DocumentItem, ChatMessage } from "../types";
import { Send as SendIcon, Trash2 as TrashIcon, User as UserIcon, Bot as BotIcon, Sparkles as SparklesIcon } from "lucide-react";

interface TutorChatPageProps {
  activeDoc: DocumentItem | null;
  chatHistory: ChatMessage[];
  onSendMessage: (msg: string) => Promise<void>;
  isSending: boolean;
  onClearHistory: () => void;
}

export default function TutorChatPage({
  activeDoc,
  chatHistory,
  onSendMessage,
  isSending,
  onClearHistory,
}: TutorChatPageProps) {
  const [userInput, setUserInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  if (!activeDoc) {
    return (
      <div className="py-16 text-center bg-white rounded-2xl border border-slate-100 shadow-3xs max-w-xl mx-auto px-6 mt-10">
        <FileText className="w-16 h-16 text-slate-205 mx-auto stroke-[1.2]" />
        <h3 className="font-display font-semibold text-slate-800 text-lg mt-4">No active study document</h3>
        <p className="text-sm text-slate-400 mt-2">
          Select or upload your notes in the <strong>Dashboard</strong> to enable private tutoring chat.
        </p>
      </div>
    );
  }

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || isSending) return;

    const msg = userInput;
    setUserInput("");
    await onSendMessage(msg);
  };

  const handleStarterClick = async (prompt: string) => {
    if (isSending) return;
    await onSendMessage(prompt);
  };

  // Tailored dynamic study starters based on active metadata
  const starters = [
    `Summarize the key takeaways of "${activeDoc.metadata.title}" in simple words.`,
    `Explain the most critical definition relevant to "${activeDoc.metadata.topic}".`,
    `Can you draft a sample essay exam question based on this text and outline the perfect answer?`,
    `Give me a simple real-world example explaining the central thesis of this study material.`,
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start h-[calc(100vh-180px)] min-h-[460px]">
      {/* Starting suggestions sidebar panel on desktop */}
      <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs space-y-4 h-full overflow-y-auto flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 border-b border-slate-50 pb-2">
            <SparklesIcon className="w-4 h-4 text-indigo-505 animate-pulse-subtle" />
            <h3 className="font-display font-bold text-xs text-slate-400 uppercase tracking-wider">AI Tutor Suggestions</h3>
          </div>
          <p className="text-2xs text-slate-405 leading-relaxed font-sans">
            Your tutor is strictly grounded on <strong>{activeDoc.metadata.title}</strong>. Ask questions to demystify complex terms, list exam formulas, or outline key terms.
          </p>

          <div className="space-y-2 pt-2">
            {starters.map((starter, sIdx) => (
              <button
                key={sIdx}
                onClick={() => handleStarterClick(starter)}
                disabled={isSending}
                className="w-full text-left p-3 bg-slate-50/50 hover:bg-indigo-50/40 hover:border-indigo-200 transition text-[11px] leading-relaxed text-slate-650 rounded-xl border border-slate-100 font-sans block active:scale-[0.98]"
              >
                💡 {starter}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold uppercase">
            ● Grounded Live
          </span>
          {chatHistory.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline flex items-center gap-1"
            >
              <TrashIcon className="w-3.5 h-3.5" /> Clear Chat
            </button>
          )}
        </div>
      </div>

      {/* Main chat box container */}
      <div className="lg:col-span-3 bg-white border border-slate-100 rounded-2xl shadow-3xs flex flex-col h-full overflow-hidden">
        {/* Chat window viewport */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto min-h-0 bg-slate-50/20">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <BotIcon className="w-12 h-12 text-slate-250 animate-pulse-subtle stroke-[1.2]" />
              <h4 className="font-display font-bold text-slate-700 text-sm mt-3">Your private study tutor</h4>
              <p className="text-xs text-slate-400 max-w-[280px] mt-1.5 leading-relaxed font-sans">
                Greetings! Ask me anything regarding <strong>{activeDoc.metadata.title}</strong>, and I will outline detailed explanations in student-friendly summaries.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {chatHistory.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div key={msg.id} className={`flex gap-3.5 items-start ${isUser ? "flex-row-reverse" : ""}`}>
                    {/* Icon tag */}
                    <div className={`p-2 rounded-xl shrink-0 ${isUser ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                      {isUser ? <UserIcon className="w-4 h-4" /> : <BotIcon className="w-4 h-4" />}
                    </div>

                    {/* Bubble card */}
                    <div className={`p-4 rounded-2xl max-w-[80%] space-y-1 ${
                      isUser 
                        ? "bg-indigo-50/40 text-slate-800 border border-indigo-120/40" 
                        : "bg-white text-slate-705 border border-slate-150/65 shadow-2xs"
                    }`}>
                      <p className="text-xs leading-relaxed font-sans whitespace-pre-line">{msg.text}</p>
                      <span className="text-[9px] text-slate-350 block text-right select-none font-mono mt-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {isSending && (
            <div className="flex gap-3.5 items-start">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-600 shrink-0">
                <BotIcon className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-100 max-w-[80%] flex items-center gap-2 italic text-xs text-slate-400">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
                <span>Tutor is inspecting document indices...</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Message Input Box footer */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white flex gap-2.5 items-center">
          <input
            type="text"
            disabled={isSending}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={`Ask your tutor regarding "${activeDoc.metadata.topic}"...`}
            className="flex-1 bg-slate-50 border border-slate-201 text-xs rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
          />
          <button
            type="submit"
            disabled={!userInput.trim() || isSending}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-150 disabled:text-slate-400 text-white rounded-xl transition shadow-2xs cursor-pointer focus:outline-none flex items-center justify-center shrink-0"
          >
            <SendIcon className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
