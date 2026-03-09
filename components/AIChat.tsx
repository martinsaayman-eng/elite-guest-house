import React, { useState, useRef, useEffect } from 'react';
import { getGeminiResponse } from '../services/geminiService';
import { GUEST_HOUSE_NAME } from '../constants';
import { Booking, Room } from '../types';

interface AIChatProps {
  bookings?: Booking[];
  rooms?: Room[];
  settings?: { name: string };
}

const AIChat: React.FC<AIChatProps> = ({ bookings = [], rooms = [], settings }) => {
  const businessName = settings?.name || GUEST_HOUSE_NAME;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
    { role: 'ai', content: `Management Assistant active for ${businessName}. I have access to current stay logs and room inventory. How can I assist?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const context = {
        guestHouseName: businessName,
        roomInventory: rooms.map(r => ({ name: r.name, rate: r.pricePerNightCents / 100 })),
        activeBookings: bookings.filter(b => b.status !== 'cancelled').map(b => {
          const balance = b.transactions.reduce((sum, t) => sum + t.amount_cents, 0);
          const paymentSum = b.transactions
            .filter(t => t.type === 'payment' || t.type === 'reversal')
            .reduce((sum, t) => sum + t.amount_cents, 0);
          const status = balance <= 0 ? 'paid' : (paymentSum !== 0 ? 'partial' : 'unpaid');

          return {
            guest: b.guest_name,
            room: rooms.find(r => r.id === b.room_id)?.name,
            dates: `${b.check_in} to ${b.check_out}`,
            payment: status,
            balance: balance / 100
          };
        })
      };
      const aiResponse = await getGeminiResponse(userMsg, context);
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse || "I encountered an error processing your management query." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "Management AI link interrupted. Please verify connection." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white w-[22rem] sm:w-[26rem] h-[34rem] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-6 duration-300">
          <div className="bg-slate-900 p-6 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center font-black italic shadow-lg">M</div>
               <div>
                  <h3 className="text-sm font-black uppercase tracking-widest">Management AI</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">Inventory Sync Active</span>
                  </div>
               </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-xl transition-all">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-50/30">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed font-medium shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 flex gap-1 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-100" />
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-200 shrink-0 bg-white">
             <div className="flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Query guest invoices or inventory..."
                  className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-3 text-xs font-bold focus:ring-2 focus:ring-slate-900 outline-none placeholder:text-slate-400 transition-all"
                />
                <button onClick={handleSend} disabled={isLoading} className="bg-slate-900 text-white p-3 rounded-2xl hover:bg-blue-600 transition-all active:scale-90 shadow-md disabled:opacity-50">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                </button>
             </div>
          </div>
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl hover:bg-blue-600 transition-all active:scale-90 flex items-center gap-3 group">
          <div className="relative">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 01-2-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full border-2 border-slate-900 animate-ping" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Management AI</span>
        </button>
      )}
    </div>
  );
};

export default AIChat;
