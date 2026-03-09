import React, { useState } from 'react';
import { Room, Booking, LedgerTransaction } from '../types';
import Calendar from './Calendar';
import { VAT_RATE } from '../src/constants';

interface BookingModalProps {
  room: Room;
  bookings: Booking[];
  onClose: () => void;
  onSubmit: (booking: Booking) => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ room, bookings, onClose, onSubmit }) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    check_in: todayStr,
    check_out: tomorrowStr
  });

  const roomBookings = bookings.filter(b => b.room_id === room.id && b.status !== 'cancelled');

  const calculateSubtotalCents = () => {
    if (!formData.check_in || !formData.check_out) return 0;
    const start = new Date(formData.check_in);
    const end = new Date(formData.check_out);
    const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    return nights * room.pricePerNightCents;
  };

  const subtotalCents = calculateSubtotalCents();
  const vatAmountCents = Math.round(subtotalCents * VAT_RATE);
  const totalCents = subtotalCents + vatAmountCents;

  const handleRangeSelect = (start: string, end: string) => {
    setFormData(prev => ({ ...prev, check_in: start, check_out: end }));
  };

  const checkOverlap = (newIn: string, newOut: string) => {
    return roomBookings.some(existing => {
      return (newIn < existing.check_out) && (newOut > existing.check_in);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.check_in || !formData.check_out) {
      alert("Please select stay duration on the calendar.");
      return;
    }

    if (checkOverlap(formData.check_in, formData.check_out)) {
      alert("CRITICAL ERROR: This unit is already reserved or unavailable for the selected dates. Please adjust your range to avoid overlap.");
      return;
    }

    const bookingId = Math.random().toString(36).substr(2, 9);
    const start = new Date(formData.check_in);
    const end = new Date(formData.check_out);
    const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    
    const accommodationCharge: LedgerTransaction = {
      id: crypto.randomUUID(),
      booking_id: bookingId,
      tenant_id: room.tenant_id,
      property_id: room.property_id,
      amount_cents: subtotalCents,
      type: 'charge',
      currency: 'ZAR',
      effective_date: formData.check_in,
      source: 'system',
      note: `Accommodation: ${room.name} (${nights} nights)`,
      created_at: new Date().toISOString(),
      created_by: 'staff-auto',
      role_at_time: 'staff',
      is_locked: false
    };

    const vatCharge: LedgerTransaction = {
      id: crypto.randomUUID(),
      booking_id: bookingId,
      tenant_id: room.tenant_id,
      property_id: room.property_id,
      amount_cents: vatAmountCents,
      type: 'charge',
      currency: 'ZAR',
      effective_date: formData.check_in,
      source: 'system',
      note: 'VAT 15%',
      created_at: new Date().toISOString(),
      created_by: 'staff-auto',
      role_at_time: 'staff',
      is_locked: false
    };

    const booking: Booking = {
      id: bookingId,
      tenant_id: room.tenant_id,
      property_id: room.property_id,
      room_id: room.id,
      ...formData,
      transactions: [accommodationCharge, vatCharge],
      status: 'confirmed',
      check_in_status: 'not-checked-in',
      created_at: new Date().toISOString(),
      is_locked: false
    };
    onSubmit(booking);
  };

  const formatPrice = (cents: number) => (cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
      <div className="bg-slate-50 px-10 py-6 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">New Stay Entry</h2>
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">{room.name}</p>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-2xl transition-all">
           <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="p-10 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-700 tracking-widest block ml-1">Guest Name</label>
                <input required type="text" value={formData.guest_name} onChange={e => setFormData({...formData, guest_name: e.target.value})} placeholder="Jonathan Sterling" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-500 tracking-widest block ml-1">Email</label>
                  <input required type="email" value={formData.guest_email} onChange={e => setFormData({...formData, guest_email: e.target.value})} placeholder="email@address.com" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-500 tracking-widest block ml-1">Phone</label>
                  <input required type="tel" value={formData.guest_phone} onChange={e => setFormData({...formData, guest_phone: e.target.value})} placeholder="+27..." className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-200 text-center shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Check In</p>
                <p className="text-sm font-black text-slate-900">{formatDate(formData.check_in)}</p>
              </div>
              <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-200 text-center shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Check Out</p>
                <p className="text-sm font-black text-slate-900">{formatDate(formData.check_out)}</p>
              </div>
            </div>

            <div className="p-6 bg-slate-100 rounded-[2rem] space-y-3 border border-slate-200">
              <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-widest">
                <span>Accommodation Subtotal</span>
                <span className="text-slate-900">R{formatPrice(subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-widest">
                <span>Value Added Tax (15%)</span>
                <span className="text-slate-900">R{formatPrice(vatAmountCents)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-black uppercase text-slate-500 tracking-widest block text-center">Unit Availability Schedule</label>
            <div className="origin-top shadow-lg rounded-2xl overflow-hidden">
              <Calendar roomId={room.id} existingBookings={roomBookings} onRangeSelect={handleRangeSelect} selectedStart={formData.check_in} selectedEnd={formData.check_out} />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2rem] text-white flex justify-between items-center shadow-2xl mt-4">
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Gross Statement Total</p>
              <p className="text-3xl font-black tracking-tighter serif">R{formatPrice(totalCents)}</p>
           </div>
           <button type="submit" className="bg-white text-slate-900 px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-lg">
             Authorize Stay
           </button>
        </div>
      </form>
    </div>
  );
};

export default BookingModal;