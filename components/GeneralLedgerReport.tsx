
import React, { useMemo } from 'react';
import { Booking, Room, Expense } from '../types';

interface GeneralLedgerProps {
  bookings: Booking[];
  rooms: Room[];
  expenses: Expense[];
}

// Added explicit interfaces to fix TypeScript inference issues
interface GroupedAccount {
  type: 'booking' | 'expense';
  title: string;
  subtitle: string;
  reference: string;
  history: any[];
  finalBalance: number;
  sortDate: Date;
}

interface MonthGroup {
  accounts: GroupedAccount[];
  totalDebits: number;
  totalCredits: number;
  net: number;
}

const formatPrice = (cents: number) => (cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const GeneralLedgerReport: React.FC<GeneralLedgerProps> = ({ bookings, rooms, expenses }) => {
  
  // Process and Group Ledger Data by Month with internal subtotals
  const groupedLedger = useMemo(() => {
    // Process Bookings
    const processedBookings: GroupedAccount[] = bookings.map(booking => {
      const room = rooms.find(r => r.id === booking.room_id);
      let runningBalance = 0;

      const sortedTxs = [...(booking.transactions || [])].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      const historyWithBalance = sortedTxs.map(tx => {
        runningBalance += tx.amount_cents;
        return { ...tx, currentBalance: runningBalance };
      });

      return {
        type: 'booking',
        title: booking.guest_name,
        subtitle: room?.name || 'Unknown',
        reference: booking.id.slice(0, 8),
        history: historyWithBalance,
        finalBalance: runningBalance,
        sortDate: sortedTxs.length > 0 ? new Date(sortedTxs[0].created_at) : new Date(booking.check_in)
      };
    });

    // Process Expenses
    const processedExpenses: GroupedAccount[] = expenses.map(expense => {
      return {
        type: 'expense',
        title: expense.category,
        subtitle: 'Operational Expense',
        reference: expense.id.slice(0, 8),
        history: [{
          created_at: expense.date,
          note: expense.note,
          amount_cents: expense.amount_cents,
          currentBalance: expense.amount_cents
        }],
        finalBalance: expense.amount_cents,
        sortDate: new Date(expense.date)
      };
    });

    const allAccounts = [...processedBookings, ...processedExpenses];

    // Sort accounts chronologically by their first transaction
    allAccounts.sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());

    // Grouping logic with subtotal calculation using MonthGroup interface
    const groups: Record<string, MonthGroup> = {};
    
    allAccounts.forEach(account => {
      const monthLabel = account.sortDate.toLocaleString('en-ZA', { month: 'long', year: 'numeric' });
      if (!groups[monthLabel]) {
        groups[monthLabel] = { accounts: [], totalDebits: 0, totalCredits: 0, net: 0 };
      }
      
      groups[monthLabel].accounts.push(account);
      
      account.history.forEach((tx: any) => {
        if (tx.amount_cents > 0) {
          groups[monthLabel].totalDebits += tx.amount_cents;
        } else {
          groups[monthLabel].totalCredits += Math.abs(tx.amount_cents);
        }
        groups[monthLabel].net += tx.amount_cents;
      });
    });

    return groups;
  }, [bookings, rooms, expenses]);

  // Explicitly cast entries to fix 'unknown' type errors during iteration
  const monthEntries = Object.entries(groupedLedger) as [string, MonthGroup][];

  return (
    <div className="space-y-8 mt-6">
      <div className="space-y-12">
        {monthEntries.length > 0 ? monthEntries.map(([month, group]) => (
          <div key={month} className="space-y-6">
            {/* Month Split Header & Subtotals */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
              <div className="flex items-center gap-4 flex-1">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em] whitespace-nowrap">
                  Audit Cycle: {month.toUpperCase()}
                </h3>
                <div className="h-px bg-slate-200 flex-1" />
              </div>
              
              <div className="flex items-center gap-6 bg-white px-6 py-2 rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-center">
                  <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Debits</p>
                  <p className="text-[11px] font-black text-slate-900">R{formatPrice(group.totalDebits)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Credits</p>
                  <p className="text-[11px] font-black text-emerald-600">R{formatPrice(group.totalCredits)}</p>
                </div>
              </div>
            </div>

            {/* Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {group.accounts.map((account, idx) => (
                <div key={idx} className="bg-slate-900 text-white rounded-[1.5rem] p-4 shadow-lg border border-slate-800 animate-in fade-in slide-in-from-bottom-1 duration-300 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4 gap-3 border-b border-slate-800/40 pb-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[7px] font-black ${account.type === 'booking' ? 'text-blue-400 bg-blue-400/5 border-blue-400/10' : 'text-amber-400 bg-amber-400/5 border-amber-400/10'} px-1.5 py-0.5 rounded uppercase tracking-widest border`}>
                          {account.type === 'booking' ? 'Ledger' : 'Expense'}
                        </span>
                        <span className="text-[7px] font-mono text-slate-500 uppercase">#{account.reference.toUpperCase()}</span>
                      </div>
                      <h3 className="text-lg font-black text-white italic serif leading-tight truncate max-w-[180px]">{account.title}</h3>
                      <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest truncate">{account.subtitle}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Closing Position</span>
                      <p className={`text-xl font-black tracking-tighter leading-none ${account.finalBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        R{(account.finalBalance / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto no-scrollbar flex-1">
                    <table className="w-full text-[10px] min-w-[380px]">
                      <thead>
                        <tr className="text-left text-[8px] font-black text-slate-600 uppercase tracking-widest border-b border-slate-800/20">
                          <th className="pb-2 pr-2">Date</th>
                          <th className="pb-2 pr-2">Description</th>
                          <th className="pb-2 pr-2 text-right">Amount</th>
                          <th className="pb-2 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/20">
                        {account.history.map((tx: any, txIdx: number) => (
                          <tr key={txIdx} className="group hover:bg-white/5 transition-colors">
                            <td className="py-2 text-slate-500 tabular-nums whitespace-nowrap">{new Date(tx.created_at).toLocaleDateString('en-ZA')}</td>
                            <td className="py-2 font-bold text-slate-300 truncate max-w-[140px]" title={tx.note}>{tx.note}</td>
                            <td className={`py-2 text-right font-mono tabular-nums ${tx.amount_cents > 0 ? 'text-rose-400' : 'text-emerald-600'}`}>
                              {tx.amount_cents > 0 ? '+' : ''}{(tx.amount_cents / 100).toFixed(2)}
                            </td>
                            <td className="py-2 text-right font-black font-mono text-white tabular-nums">R{(tx.currentBalance / 100).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )) : (
          <div className="bg-white p-12 rounded-[1.5rem] border border-dashed border-slate-200 text-center text-slate-500 uppercase font-black text-[9px] tracking-[0.3em]">
            No transaction history for selected period
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneralLedgerReport;
