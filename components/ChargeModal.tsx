
import React, { useState } from 'react';
import { Booking } from '../types';

interface ChargeModalProps {
  booking: Booking;
  onClose: () => void;
  onSubmit: (amountCents: number, note: string) => void;
}

const ChargeModal: React.FC<ChargeModalProps> = ({ booking, onClose, onSubmit }) => {
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  
  const formatPrice = (cents: number) => (cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const totalCharges = booking.transactions
    .filter(t => t.type === 'charge' || t.type === 'adjustment')
    .reduce((sum, t) => sum + t.amount_cents, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Please enter a valid positive amount.");
      return;
    }
    const centsAmount = Math.round(numAmount * 100);
    onSubmit(centsAmount, note.trim());
  };

  return (
    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
      <div className="p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-slate-900">Add Manual Charge</h3>
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Applying additional cost to {booking.guest_name}</p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl space-y-1 text-center border border-slate-100">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Current Total Charges</p>
          <p className="text-sm font-black text-slate-900">R{formatPrice(totalCharges)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Charge Amount (ZAR)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400">R</span>
                <input 
                  autoFocus
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-10 pr-5 py-4 text-sm font-black focus:border-blue-500 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Description / Item Name</label>
              <textarea 
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. Mini-bar consumption, Late checkout fee, Room damage..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-xs font-medium focus:border-blue-500 transition-all outline-none min-h-[80px] resize-none"
                required
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">Cancel</button>
            <button type="submit" className="flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg">Post Charge</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChargeModal;
