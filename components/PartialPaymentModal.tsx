
import React, { useState } from 'react';
import { Booking } from '../types';

interface PartialPaymentModalProps {
  booking: Booking;
  onClose: () => void;
  onSubmit: (amountCents: number, note: string) => void;
}

const PartialPaymentModal: React.FC<PartialPaymentModalProps> = ({ booking, onClose, onSubmit }) => {
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  
  const formatPrice = (cents: number) => (cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const remainingCents = Math.max(0, booking.transactions.reduce((sum, t) => sum + t.amount_cents, 0));
  
  const totalPayments = Math.abs(booking.transactions
    .filter(t => t.type === 'payment' || t.type === 'reversal' || t.type === 'refund')
    .reduce((sum, t) => sum + Math.min(0, t.amount_cents), 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Please enter a valid positive amount.");
      return;
    }
    const centsAmount = Math.round(numAmount * 100);
    if (centsAmount > remainingCents) {
      alert(`Payment cannot exceed the remaining balance of R${formatPrice(remainingCents)}.`);
      return;
    }
    onSubmit(centsAmount, note.trim());
  };

  return (
    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
      <div className="p-8 space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-xl font-black text-slate-900">Record Payment</h3>
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Allocate funds for {booking.guest_name}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="bg-slate-50 p-4 rounded-2xl space-y-1 text-center border border-slate-100">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Remaining</p>
              <p className="text-sm font-black text-rose-600">R{formatPrice(remainingCents)}</p>
           </div>
           <div className="bg-slate-50 p-4 rounded-2xl space-y-1 text-center border border-slate-100">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Collected</p>
              <p className={`text-sm font-black ${totalPayments > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>R{formatPrice(totalPayments)}</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Payment Amount</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400">R</span>
                <input 
                  autoFocus
                  type="number" 
                  step="0.01"
                  placeholder={(remainingCents / 100).toFixed(2)}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-10 pr-5 py-4 text-sm font-black focus:border-slate-900 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Transaction Note</label>
              <textarea 
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. Card payment at reception, EFT Ref #123..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-xs font-medium focus:border-slate-900 transition-all outline-none min-h-[80px] resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">Cancel</button>
            <button type="submit" className="flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg">Confirm Entry</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PartialPaymentModal;
