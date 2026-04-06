'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { createChatSession, sendChatMessage, useFAQs } from '@/hooks/use-chat';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { faqs } = useFAQs();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, isTyping]);

  const handleOpen = async () => {
    setIsOpen(true);
    if (!sessionId) {
      try {
        const res = await createChatSession();
        setSessionId(res.data.id);
      } catch {}
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !sessionId) return;
    const msg = input.trim();
    setInput('');
    setLocalMessages(prev => [...prev, { sender_type: 'customer', message: msg, created_at: new Date() }]);
    setIsTyping(true);
    try {
      const res = await sendChatMessage(sessionId, msg);
      setIsTyping(false);
      if (res.data?.botReply?.reply) {
        setLocalMessages(prev => [...prev, {
          sender_type: 'bot',
          message: res.data.botReply.reply,
          created_at: new Date(),
          source: res.data.botReply.source,
        }]);
      }
    } catch {
      setIsTyping(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button onClick={handleOpen} className="fixed bottom-6 right-6 bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 z-50 transition-all hover:scale-105 group">
          <MessageCircle size={24} />
          <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <Sparkles size={8} /> AI
          </span>
        </button>
      )}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-slate-200" style={{ height: '500px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} />
              <div>
                <span className="font-semibold text-sm">AI Chat Support</span>
                <p className="text-[10px] text-white/70">Powered by AI</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {localMessages.length === 0 && (
              <div className="text-center text-slate-500 text-sm">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Sparkles size={20} className="text-indigo-600" />
                </div>
                <p className="font-medium text-slate-700 mb-1">Hi! How can I help you?</p>
                <p className="text-xs text-slate-400 mb-3">Ask me anything about orders, products, shipping...</p>
                {faqs.slice(0, 3).map((faq: any) => (
                  <button
                    key={faq.id}
                    className="block w-full text-left bg-white border border-slate-200 rounded-xl px-3 py-2 mb-1.5 text-xs hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                    onClick={() => { setInput(faq.question); }}
                  >
                    {faq.question}
                  </button>
                ))}
              </div>
            )}
            {localMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  msg.sender_type === 'customer'
                    ? 'bg-indigo-600 text-white rounded-br-md'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md shadow-sm'
                }`}>
                  {msg.sender_type === 'bot' && (
                    <div className="flex items-center gap-1 mb-1">
                      <Sparkles size={10} className="text-purple-500" />
                      <span className="text-[10px] font-medium text-purple-600">AI</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={10} className="text-purple-500" />
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-200 bg-white">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button onClick={handleSend} className="bg-indigo-600 text-white rounded-xl px-3.5 py-2.5 hover:bg-indigo-700 transition-colors">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
