'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createChatSession, sendChatMessage, useChatMessages, useFAQs } from '@/hooks/use-chat';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { faqs } = useFAQs();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

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
    try {
      const res = await sendChatMessage(sessionId, msg);
      if (res.data?.botReply?.reply) {
        setLocalMessages(prev => [...prev, { sender_type: 'bot', message: res.data.botReply.reply, created_at: new Date() }]);
      }
    } catch {}
  };

  return (
    <>
      {!isOpen && (
        <button onClick={handleOpen} className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 z-50">
          <MessageCircle size={24} />
        </button>
      )}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 bg-white rounded-xl shadow-2xl z-50 flex flex-col" style={{ height: '480px' }}>
          <div className="bg-blue-600 text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
            <span className="font-semibold">Chat Support</span>
            <button onClick={() => setIsOpen(false)}><X size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {localMessages.length === 0 && (
              <div className="text-center text-gray-500 text-sm">
                <p className="mb-2">Hi! How can I help you?</p>
                {faqs.slice(0, 3).map((faq: any) => (
                  <button key={faq.id} className="block w-full text-left bg-gray-100 rounded-lg px-3 py-2 mb-1 text-xs hover:bg-gray-200" onClick={() => { setInput(faq.question); }}>
                    {faq.question}
                  </button>
                ))}
              </div>
            )}
            {localMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.sender_type === 'customer' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 border-t flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Type a message..." className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <button onClick={handleSend} className="bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700"><Send size={16} /></button>
          </div>
        </div>
      )}
    </>
  );
}
