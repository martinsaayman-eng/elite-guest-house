
import React, { useState, useMemo } from 'react';
import { Expense } from '../types';

interface ExpenseManagerProps {
  expenses: Expense[];
  onAdd: (cat: string, amt: number, note: string) => void;
  filter: 'monthly' | 'yearly';
  date: Date;
  search: string;
}

const ExpenseManager: React.FC<ExpenseManagerProps> = ({ expenses, onAdd, filter, date, search }) => {
  const [amt, setAmt] = useState('');
  const [cat, setCat] = useState('Utilities (Water/Elec)');
  const [customCat, setCustomCat] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amt) return;
    const finalCat = cat === 'Other' ? (customCat || 'Other') : cat;
    onAdd(finalCat, Math.round(parseFloat(amt) * 100), note);
    setAmt('');
    setNote('');
    setCustomCat('');
  };

  const filteredExpenses = useMemo(() => {
    let list = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      if (filter === 'monthly') {
        return expDate.getMonth() === date.getMonth() && expDate.getFullYear() === date.getFullYear();
      } else {
        return expDate.getFullYear() === date.getFullYear();
      }
    });

    if (search) {
      const query = search.toLowerCase();
      list = list.filter(exp => 
        exp.category.toLowerCase().includes(query) || 
        (exp.note || '').toLowerCase().includes(query)
      );
    }

    // Sort by date ascending (oldest first)
    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [expenses, filter, date, search]);

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount_cents, 0);

  const periodLabel = filter === 'monthly' 
    ? date.toLocaleString('en-ZA', { month: 'long', year: 'numeric' })
    : `Year ${date.getFullYear()}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* INPUT CARD */}
      <div className="bg-white p-7 rounded-[2.5rem] border border-slate-200 shadow-xl">
        <h3 className="text-lg font-black uppercase tracking-tighter mb-4">Log New Business Expense</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <select 
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
              value={cat} 
              onChange={e => setCat(e.target.value)}
            >
              <option>Utilities (Water/Elec)</option>
              <option>Maintenance</option>
              <option>Staff Wages</option>
              <option>Laundry & Cleaning</option>
              <option>Food & Beverage</option>
              <option>Other</option>
            </select>
            
            {cat === 'Other' && (
              <input 
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all animate-in slide-in-from-left-2 duration-300" 
                type="text" 
                placeholder="Specify Category" 
                value={customCat} 
                onChange={e => setCustomCat(e.target.value)} 
                required
              />
            )}

            <input 
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
              type="number" 
              placeholder="Amount (R)" 
              value={amt} 
              onChange={e => setAmt(e.target.value)} 
            />
            <input 
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
              type="text" 
              placeholder="Note (e.g. June Electricity)" 
              value={note} 
              onChange={e => setNote(e.target.value)} 
            />
            <button type="submit" className="p-3.5 bg-rose-500 text-white font-black uppercase rounded-2xl hover:bg-rose-600 transition-all shadow-lg active:scale-95">Record Expense</button>
          </div>
        </form>
      </div>

      {/* SUMMARY TABLE */}
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl">
        <div className="flex justify-end items-end mb-6">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Outflow • {periodLabel}</p>
            <h2 className="text-3xl font-black text-rose-400 tracking-tighter">R{(totalExpenses/100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          {filteredExpenses.length === 0 ? (
            <div className="py-10 text-center text-slate-500 uppercase font-black text-[10px] italic border border-dashed border-white/10 rounded-2xl">No expenses found for {periodLabel}</div>
          ) : (
            filteredExpenses.map(exp => (
              <div key={exp.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group">
                <div className="min-w-0 pr-2">
                  <p className="text-[8px] font-black uppercase text-blue-400 mb-0.5 truncate">{exp.category}</p>
                  <p className="text-xs font-bold text-white group-hover:text-blue-200 transition-colors truncate">{exp.note || 'No description'}</p>
                  <p className="text-[7px] font-bold text-slate-500 uppercase mt-0.5">{exp.date}</p>
                </div>
                <p className="text-lg font-black text-rose-400 tabular-nums whitespace-nowrap">-R{(exp.amount_cents/100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseManager;
