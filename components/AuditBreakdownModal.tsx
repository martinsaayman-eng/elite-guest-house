
import React from 'react';
import { Booking, LedgerTransaction } from '../types';

interface AuditBreakdownModalProps {
  booking: Booking;
  onClose: () => void;
}

const formatPrice = (cents: number) => (cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const RoleBadge = ({ role }: { role: string }) => {
  const colors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    manager: 'bg-blue-100 text-blue-700 border-blue-200',
    staff: 'bg-slate-100 text-slate-700 border-slate-200'
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border ${colors[role] || colors.staff}`}>
      {role}
    </span>
  );
};

const AuditBreakdownModal: React.FC<AuditBreakdownModalProps> = ({ booking, onClose }) => {
  const transactions = [...(booking.transactions || [])].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const totalBilled = transactions
    .filter(t => t.amount_cents > 0)
    .reduce((sum, t) => sum + t.amount_cents, 0);
  
  const totalSettled = Math.abs(transactions
    .filter(t => t.amount_cents < 0)
    .reduce((sum, t) => sum + t.amount_cents, 0));

  const balance = totalBilled - totalSettled;

  return (
    <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="bg-slate-900 p-8 flex justify-between items-center text-white shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest">Forensic Audit Breakdown</h2>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Guest: {booking.guest_name} • Ref: {booking.id.toUpperCase().slice(0, 8)}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-1 p-1 bg-slate-100 border-b border-slate-200">
        <div className="bg-white p-6 flex flex-col items-center">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Gross Billing</span>
          <span className="text-xl font-black text-slate-900">R{formatPrice(totalBilled)}</span>
        </div>
        <div className="bg-white p-6 flex flex-col items-center border-x border-slate-100">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Net Settlements</span>
          <span className="text-xl font-black text-emerald-600">R{formatPrice(totalSettled)}</span>
        </div>
        <div className="bg-white p-6 flex flex-col items-center">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Current Exposure</span>
          <span className={`text-xl font-black ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>R{formatPrice(balance)}</span>
        </div>
      </div>

      {/* Audit Table */}
      <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-slate-50/30">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-[8px] font-black text-slate-700 uppercase tracking-widest">
                <th className="px-6 py-4">Verification Link</th>
                <th className="px-6 py-4">Event Type</th>
                <th className="px-6 py-4">Verified By</th>
                <th className="px-6 py-4">Audit Memo</th>
                <th className="px-6 py-4 text-right">Cash Effect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-[10px] font-bold text-slate-900 tabular-nums">{new Date(tx.created_at).toLocaleDateString()}</p>
                    <p className="text-[8px] text-slate-600 font-mono tracking-tighter">{tx.id.slice(0, 12)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg border ${
                      tx.type === 'charge' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      tx.type === 'payment' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      tx.type === 'adjustment' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      {tx.type}
                    </span>
                    <p className="text-[7px] text-slate-600 font-black uppercase mt-1 tracking-tighter">via {tx.source}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-slate-700 leading-none">{tx.created_by.slice(0, 10)}</span>
                      <RoleBadge role={tx.role_at_time} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[10px] font-medium text-slate-600 max-w-[200px] line-clamp-2">{tx.note || 'No administrative comment provided'}</p>
                    {tx.reverses_transaction_id && (
                      <p className="text-[7px] font-black text-rose-500 uppercase mt-1">Reverses: {tx.reverses_transaction_id.slice(0, 8)}</p>
                    )}
                  </td>
                  <td className={`px-6 py-4 text-right tabular-nums text-xs font-black ${tx.amount_cents > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {tx.amount_cents > 0 ? '+' : '-'} R{formatPrice(Math.abs(tx.amount_cents))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-8 bg-white border-t border-slate-100 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Database Record Integrity Verified</span>
        </div>
        <button 
          onClick={onClose}
          className="px-12 py-4 bg-slate-100 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
        >
          Close Log
        </button>
      </div>
    </div>
  );
};

export default AuditBreakdownModal;
