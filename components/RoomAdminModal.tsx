
import React, { useState } from 'react';
import { Room, Booking } from '../types';

interface RoomAdminModalProps {
  room: Room;
  bookings: Booking[];
  onClose: () => void;
  onSubmit?: (room: Room) => void;
  isManager?: boolean;
}

const RoomAdminModal: React.FC<RoomAdminModalProps> = ({ room, bookings, onClose, onSubmit, isManager }) => {
  const [closedThrough, setClosedThrough] = useState(room.closed_through_date || '');
  
  const roomBookings = bookings.filter(b => b.room_id === room.id);
  const formatPrice = (price: number) => price.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleSave = () => {
    if (onSubmit) {
      onSubmit({
        ...room,
        closed_through_date: closedThrough || undefined
      });
    }
  };

  return (
    <div className="relative bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-300">
      <div className="bg-slate-50 px-10 py-8 border-b border-slate-200 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{room.name}</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Inventory Management Dashboard</p>
        </div>
        <button onClick={onClose} className="p-4 hover:bg-slate-100 rounded-2xl transition-all">
           <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      
      <div className="p-10 flex-1 overflow-y-auto space-y-10 no-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <img src={room.imageUrl} className="w-full h-48 object-cover rounded-3xl" alt={room.name} />
            
            <div className="space-y-4">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Standard Rate</p>
                <p className="text-2xl font-black text-slate-900">R{formatPrice(room.pricePerNightCents / 100)}</p>
              </div>
              
              {/* Maintenance Control Removed */}
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Stay Records</h3>
            <div className="bg-slate-50 rounded-[2rem] border border-slate-100 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {roomBookings.length === 0 ? (
                  <div className="p-20 text-center text-slate-300 italic text-sm font-light">No records identified for this unit.</div>
                ) : (
                  roomBookings.map(b => {
                    const outstanding = b.transactions.reduce((sum, t) => sum + t.amount_cents, 0);
                    const hasPayment = b.transactions.some(t => t.type === 'payment' && t.amount_cents < 0);
                    const status = outstanding <= 0 ? 'paid' : (hasPayment ? 'partial' : 'unpaid');

                    return (
                      <div key={b.id} className="p-6 flex justify-between items-center group hover:bg-white transition-all">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 text-sm">{b.guest_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{formatDate(b.check_in)} — {formatDate(b.check_out)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-slate-900 text-sm">R{formatPrice(Math.max(0, outstanding) / 100)}</p>
                          <span className={`text-[8px] font-black uppercase tracking-widest ${status === 'paid' ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {status === 'paid' ? 'Paid' : 'Balance Due'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomAdminModal;
