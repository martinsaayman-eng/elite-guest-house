
import React, { useState } from 'react';
import { Booking } from '../types';

interface CorrectionModalProps {
  booking: Booking;
  onClose: () => void;
  onSubmit: (amountCents: number, reason: string) => void;
}

const CorrectionModal: React.FC<CorrectionModalProps> = ({ booking, onClose, onSubmit }) => {
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  
  const formatPrice = (cents: number) => (cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      alert("Please enter a valid correction amount.");
      return;
    }
    if (!reason.trim()) {
      alert("Please enter a valid reason for this correction.");
      return;
    }
    
    // Convert to cents for internal storage parity
    const centsAmount = Math.round(numAmount * 100);
    onSubmit(centsAmount, reason.trim());
  };

  return (
    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
      <div className="p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-slate-900">Account Correction</h3>
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Adjusting balance for {booking.guest_name}</p>
        </div>

        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl">
          <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-1">Confidential Adjustment</p>
          <p className="text-[11px] text-amber-600 font-medium leading-tight">This adjustment corrects the ledger but is <span className="font-bold">hidden</span> from the guest-facing invoice. Use negative values to reduce the amount due.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Specific Correction Amount (ZAR)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400">R</span>
                <input 
                  autoFocus
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-10 pr-5 py-4 text-sm font-black focus:border-rose-500 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Internal Reason (Audit Trail Only)</label>
              <textarea 
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g., Room upgrade discount, miscalculation of tax, staff error correction..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-xs font-medium focus:border-rose-500 transition-all outline-none min-h-[120px] resize-none"
                required
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">Cancel</button>
            <button type="submit" className="flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-lg">Correct Ledger</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CorrectionModal;
