
import React, { useState, useMemo, useEffect } from 'react';
import Navbar from './components/Navbar';
import RoomCard from './components/RoomCard';
import BookingModal from './components/BookingModal';
import RoomAdminModal from './components/RoomAdminModal';
import InvoiceModal from './components/InvoiceModal';
import PartialPaymentModal from './components/PartialPaymentModal';
import ChargeModal from './components/ChargeModal';
import CorrectionModal from './components/CorrectionModal';
import PasswordModal from './components/PasswordModal';
import ScheduleView from './components/ScheduleView';
import Calendar from './components/Calendar';
import AIChat from './components/AIChat';
import AuditBreakdownModal from './components/AuditBreakdownModal';
import HousekeepingView from './components/HousekeepingView';
import GeneralLedgerReport from './components/GeneralLedgerReport';
import ExpenseManager from './components/ExpenseManager';
import Login from './Login';
import { View, Room, Booking, LedgerTransaction, Expense } from './types';
import { ROOMS as INITIAL_ROOMS, GUEST_HOUSE_NAME, VAT_RATE, GUEST_HOUSE_PHONE, GUEST_HOUSE_ADDRESS } from './constants';
import { scanForOperationalFaults, OperationalIssue } from './src/utils/safetyScanner';
import DataSafetyTools from './components/DataSafetyTools';

// Hook Imports
import { useAuth } from './hooks/useAuth';
import { useBookings } from './hooks/useBookings';
import { useHousekeeping } from './hooks/useHousekeeping';
import { usePayments } from './hooks/usePayments';
import { useAnalytics } from './hooks/useAnalytics';

type ModalType = 'BOOKING' | 'INVOICE' | 'PARTIAL_PAYMENT' | 'ADMIN_ROOM' | 'CHARGE' | 'CORRECTION' | 'CALENDAR' | 'AUDIT' | null;

interface ModalState {
  type: ModalType;
  dataId?: string;
}

interface MonthlyTotal {
  label: string;
  totalCharges: number;
  totalCredits: number;
  totalExpenses: number;
  netBalance: number;
  debtors: { id: string, name: string, balance: number }[];
}

const AuditSummaryDashboard: React.FC<{ 
  monthlyTotals: MonthlyTotal[],
  operationalIssues: OperationalIssue[],
  onExport: () => void,
  onShowExposure?: (monthLabel: string) => void,
  allBookings: Booking[],
  allExpenses: Expense[],
  onDismissIssue: (id: string) => void
}> = ({ monthlyTotals, operationalIssues, onExport, onShowExposure, allBookings, allExpenses, onDismissIssue }) => {
  
  const grandTotal = monthlyTotals.reduce((acc, m) => {
    acc.totalCredits += m.totalCredits;
    acc.totalExpenses += m.totalExpenses;
    acc.netBalance += m.netBalance;
    return acc;
  }, { totalCredits: 0, totalExpenses: 0, netBalance: 0 });

  return (
    <div className="space-y-8 mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      {/* Header - Stretched Title Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8 px-2">
        <div className="space-y-1">
          <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">Real-time Ledger Validation</h2>
          <p className="text-slate-800 text-[11px] font-black uppercase tracking-[0.4em] mt-3">Cross-referenced Financial Intelligence Audit</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="hidden sm:flex flex-col items-end mr-4">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Database Sync</span>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Records Live
              </span>
           </div>
           <button 
            onClick={onExport}
            className="bg-slate-900 hover:bg-blue-600 text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95 flex items-center gap-3"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export Comprehensive Audit
          </button>
        </div>
      </div>

      {/* Full Width Monthly Breakdown - Stretches cards or scrolls */}
      <div className="w-full relative">
        <div className={`
          flex gap-6 pb-6 overflow-x-auto no-scrollbar
          ${monthlyTotals.length <= 3 ? 'justify-between' : 'justify-start'}
        `}>
          {monthlyTotals.map((month) => (
            <div 
              key={month.label} 
              className={`
                bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-800 flex flex-col justify-between 
                transition-all duration-500 group hover:border-blue-500/50 hover:shadow-blue-500/10
                min-w-[340px]
                ${monthlyTotals.length === 1 ? 'w-full' : 'flex-1'}
              `}
            >
              <div className="flex justify-between items-start mb-10">
                 <div className="space-y-1">
                   <h3 className="text-lg font-black uppercase tracking-[0.2em] text-blue-400 group-hover:text-blue-300 transition-colors">{month.label}</h3>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Audit Cycle Internal Ref</p>
                 </div>
                 <button 
                  onClick={() => month.debtors.length > 0 && onShowExposure?.(month.label)}
                  className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full border transition-all ${month.debtors.length === 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-400/20 cursor-default' : 'bg-rose-500/10 text-rose-400 border-rose-400/20 hover:bg-rose-500 hover:text-white cursor-pointer'}`}
                 >
                   {month.debtors.length === 0 ? 'Verified Settled' : 'Exposure Detected'}
                 </button>
              </div>
                             <div className="space-y-6">
                {month.debtors.length > 0 && (
                  <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4 mb-4">
                    <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-2">Primary Exposure Sources</p>
                    <div className="space-y-2">
                      {month.debtors.slice(0, 3).map(debtor => (
                        <div key={debtor.id} className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-300 truncate max-w-[140px]">{debtor.name}</span>
                          <span className="text-[10px] font-black text-rose-400 tabular-nums">R{(debtor.balance / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                      {month.debtors.length > 3 && (
                        <p className="text-[8px] text-slate-400 italic pt-1">+{month.debtors.length - 3} more accounts</p>
                      )}
                    </div>
                  </div>
                )}
                 <div className="flex justify-between items-end border-b border-slate-800/60 pb-5">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">INCOME (CREDIT)</p>
                   <p className="text-xl font-black text-emerald-400 tabular-nums tracking-tighter">R{(month.totalCredits / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                 </div>
                 <div className="flex justify-between items-end border-b border-slate-800/60 pb-5">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">EXPENSES (DEBIT)</p>
                   <p className="text-xl font-black text-rose-400 tabular-nums tracking-tighter">R{(month.totalExpenses / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                 </div>
                 <div className="flex justify-between items-center pt-4">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Net Amount</p>
                   <p className={`text-2xl font-black tracking-tighter tabular-nums ${month.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                     R{(month.netBalance / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                   </p>
                 </div>
               </div>
            </div>
          ))}
          {monthlyTotals.length === 0 && (
            <div className="w-full h-64 flex flex-col items-center justify-center bg-white rounded-[3.5rem] border border-dashed border-slate-200 gap-4">
               <svg className="w-12 h-12 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
               <span className="text-[11px] font-black text-slate-700 uppercase tracking-[0.4em]">No financial artifacts found in current period</span>
            </div>
          )}
        </div>
      </div>

      {/* Large Aggregate Period Panel - Full Width */}
      {monthlyTotals.length > 1 && (
        <div className="bg-white p-8 lg:p-12 rounded-[3rem] lg:rounded-[4rem] border border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-8 lg:gap-12 shadow-sm animate-in fade-in zoom-in duration-500">
          <div className="flex items-center gap-4 lg:gap-6 shrink-0">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-slate-900 rounded-[1rem] lg:rounded-[1.5rem] flex items-center justify-center shadow-xl">
              <svg className="w-6 h-6 lg:w-8 lg:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <div>
              <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.3em] lg:tracking-[0.4em] text-slate-800 leading-none">Consolidated Audit Summary</p>
              <h3 className="text-lg lg:text-xl font-black text-slate-900 uppercase tracking-tighter mt-1.5 lg:mt-2">Aggregate Financial Lifecycle</h3>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-10 border-t lg:border-t-0 lg:border-l border-slate-100 pt-8 lg:pt-0 lg:pl-10 w-full lg:flex-1">
            <div className="text-left">
              <p className="text-[8px] font-black text-slate-800 uppercase tracking-widest mb-2">TOTAL INCOME (CREDIT)</p>
              <p className="text-lg lg:text-xl font-black text-emerald-600 tracking-tighter tabular-nums whitespace-nowrap">R{(grandTotal.totalCredits / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="text-left">
              <p className="text-[8px] font-black text-slate-800 uppercase tracking-widest mb-2">TOTAL EXPENSES (DEBIT)</p>
              <p className="text-lg lg:text-xl font-black text-rose-600 tracking-tighter tabular-nums whitespace-nowrap">R{(grandTotal.totalExpenses / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="text-left border-t sm:border-t-0 sm:border-l border-slate-100 pt-6 sm:pt-0 sm:pl-6 lg:pl-10">
              <p className="text-[8px] font-black text-slate-800 uppercase tracking-widest mb-2">Consolidated Net</p>
              <p className={`text-xl lg:text-2xl font-black tracking-tighter leading-none tabular-nums whitespace-nowrap ${grandTotal.netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                R{(grandTotal.netBalance / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Operational Safety Scanner Results */}
      {operationalIssues.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-8 rounded-[3rem] shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <h3 className="text-lg font-black text-rose-900 uppercase tracking-tighter">Operations Safety Scanner</h3>
              <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Critical Operational Faults Detected</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {operationalIssues.map(issue => (
              <div key={issue.id} className="bg-white p-5 rounded-2xl border border-rose-100 flex items-start justify-between gap-4 group hover:border-rose-300 transition-all">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${issue.severity === 'CRITICAL' ? 'bg-rose-600 animate-ping' : issue.severity === 'HIGH' ? 'bg-rose-500' : 'bg-orange-500'}`} />
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{issue.type} • {issue.severity}</p>
                    <p className="text-xs font-bold text-slate-900 leading-relaxed">{issue.message}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onDismissIssue(issue.id)}
                  className="text-[9px] font-black text-slate-400 hover:text-rose-600 uppercase tracking-widest transition-colors"
                  title="Dismiss Warning"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <DataSafetyTools allBookings={allBookings} allExpenses={allExpenses} />
    </div>
  );
};

// --- NEW ALERT COMPONENT ---
// This sits at the top and tells you exactly who is late.
const OperationalAlerts: React.FC<{ 
  bookings: Booking[], 
  rooms: Room[],
  getFinancials: (b: Booking) => { outstanding: number },
  onDismiss: (id: string, status: 'checked-out') => void
}> = ({ bookings, rooms, getFinancials, onDismiss }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // We define "Late" as: It is today, they were supposed to check out, 
  // AND either they haven't checked out OR they still owe money.
  const lateCheckouts = bookings.filter(b => {
    if (b.check_out !== todayStr || b.status === 'cancelled') return false;
    
    const isStillIn = b.check_in_status === 'checked-in';
    const hasBalance = getFinancials(b).outstanding > 0;
    
    return isStillIn || hasBalance;
  });

  if (lateCheckouts.length === 0) return null;

  return (
    <div className="mb-8 animate-bounce-short">
      <div className="bg-rose-600 text-white p-6 rounded-[2rem] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-white text-rose-600 p-2 rounded-full">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-black uppercase tracking-tighter text-lg leading-none">Critical Operational Faults Detected</h3>
            <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest mt-1">
              {lateCheckouts.length} guest(s) requiring attention
            </p>
          </div>
        </div>
        <div className="flex flex-wrap justify-center sm:justify-end gap-2">
          {lateCheckouts.map(b => {
            const roomName = rooms.find(r => r.id === b.room_id)?.name || 'Unknown Room';
            const { outstanding } = getFinancials(b);
            const isSettled = outstanding <= 0;

            return (
              <div key={b.id} className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-3 border border-white/20 animate-alert-flash">
                <div className="w-8 h-8 rounded-full bg-white text-rose-600 flex items-center justify-center text-[10px] font-black shrink-0">
                  {b.guest_name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-tight truncate">{b.guest_name}</p>
                  <p className="text-[9px] font-bold uppercase opacity-70 tracking-widest truncate">{roomName}</p>
                </div>
                {isSettled && (
                  <button 
                    onClick={() => onDismiss(b.id, 'checked-out')}
                    className="ml-2 bg-white/20 hover:bg-white/40 p-1.5 rounded-lg transition-colors group/dismiss"
                    title="Dismiss Warning"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const StatsCard: React.FC<{ label: string; value: string; color?: string; trend?: string }> = ({ label, value, color = "text-slate-900", trend }) => (
  <div className="bg-white p-[22px] rounded-[1.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all h-[122px] flex flex-col justify-between group">
    <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest group-hover:text-blue-700 transition-colors">{label}</p>
    <div className="flex items-baseline justify-between gap-2">
      <p className={`text-4xl font-black tracking-tighter serif ${color}`}>{value}</p>
      {trend && <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{trend}</span>}
    </div>
  </div>
);

// --- NEW SETTINGS COMPONENT ---
// This lets the user customize the app for their own business.
const SettingsView: React.FC<{ settings: any, setSettings: (s: any) => void }> = ({ settings, setSettings }) => {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  
  // Local state for the form so we don't save on every keystroke
  const [tempSettings, setTempSettings] = useState(settings);

  const handleSaveBranding = () => {
    setSettings(tempSettings);
    alert('Business profile updated successfully!');
  };

  const handleUpdatePassword = () => {
    if (currentPw !== (settings.adminPassword || 'admin')) {
      alert('Current password incorrect.');
      return;
    }
    if (!newPw || newPw !== confirmPw) {
      alert('Passwords do not match or are empty.');
      return;
    }
    setSettings({ ...settings, adminPassword: newPw });
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    alert('Password updated!');
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 space-y-6">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black uppercase tracking-tighter">Property Branding</h2>
          <button 
            onClick={handleSaveBranding}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Save Business Profile
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Business Name</label>
              <input 
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" 
                value={tempSettings.name} 
                onChange={(e) => setTempSettings({...tempSettings, name: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Physical Address</label>
              <textarea 
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" 
                value={tempSettings.address} 
                onChange={(e) => setTempSettings({...tempSettings, address: e.target.value})}
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4">
             <h3 className="text-sm font-black uppercase text-slate-400 border-b pb-2">Banking (For Invoices)</h3>
             <input 
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm" 
                placeholder="Bank Name"
                value={tempSettings.bankName}
                onChange={(e) => setTempSettings({...tempSettings, bankName: e.target.value})}
             />
             <input 
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm" 
                placeholder="Account Number"
                value={tempSettings.accountNumber}
                onChange={(e) => setTempSettings({...tempSettings, accountNumber: e.target.value})}
             />
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-10 rounded-[3rem] text-white">
        <h3 className="text-lg font-black uppercase tracking-tighter mb-4">Access Security</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            type="password"
            className="p-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:border-blue-500" 
            value={currentPw} 
            onChange={(e) => setCurrentPw(e.target.value)}
            placeholder="Current Password"
          />
          <input 
            type="password"
            className="p-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:border-blue-500" 
            value={newPw} 
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="New Password"
          />
          <button 
            onClick={handleUpdatePassword}
            className="py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
};


type DemoRole = 'STAFF' | 'ADMIN';

const App: React.FC = () => {
  const { session, authLoading, isConfigured, supabase, userContext } = useAuth();
  const [demoRole, setDemoRole] = useState<DemoRole>('STAFF');
  const isAdmin = demoRole === 'ADMIN';

  const { 
    bookings, 
    handleConfirmBooking, 
    handleCheckIn, 
    handleUpdateCheckInStatus,
    handleUpdateStatus, 
    handleLockBooking: onToggleLock,
    handleUpdateRoom,
    handleClearBookings, 
    setBookings,
    fetchBookings
  } = useBookings(session, isConfigured, supabase, userContext);
  
  const { housekeeping, updateHousekeeping, resetHousekeeping } = useHousekeeping(bookings, supabase);
  
  const { 
    handleUpdatePaymentStatus, 
    addPayment,
    addCharge,
    addAdjustment,
    getFinancials: getTxFinancials
  } = usePayments(bookings, supabase, session, fetchBookings, setBookings, userContext?.roles || []);
  
  const { analyticsSummary } = useAnalytics(bookings, userContext);
  
  const [view, setView] = useState<View>(View.HOME);

  useEffect(() => {
    if (!isAdmin && (view === View.INVOICING || view === View.ADMIN || view === View.HISTORY || view === View.SETTINGS)) {
      setView(View.HOME);
    }
    if (view !== View.INVOICING) {
      setShowOnlyDebtors(false);
    }
  }, [isAdmin, view]);

  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [ledgerFilter, setLedgerFilter] = useState<'monthly' | 'yearly'>('monthly');
  const [ledgerDate, setLedgerDate] = useState(new Date());
  const [expenseFilter, setExpenseFilter] = useState<'monthly' | 'yearly'>('monthly');
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [activeModal, setActiveModal] = useState<ModalState>({ type: null });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [financeSearch, setFinanceSearch] = useState('');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [showOnlyDebtors, setShowOnlyDebtors] = useState(false);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('app_settings');
    const defaults = { 
      name: GUEST_HOUSE_NAME, 
      address: GUEST_HOUSE_ADDRESS,
      phone: GUEST_HOUSE_PHONE,
      vatNumber: '',
      bankName: '',
      accountHolder: '',
      accountNumber: '',
      branchCode: '',
      adminPassword: 'admin'
    };
    // We merge the saved data with defaults so new features (like banking) 
    // don't break for old users.
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  // We add this to automatically save whenever you change a setting
  useEffect(() => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
  }, [settings]);
  const [opsSearch, setOpsSearch] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('expenses');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const addExpense = (category: string, amount_cents: number, note: string) => {
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      category,
      amount_cents,
      note
    };
    setExpenses([newExpense, ...expenses]);
  };

  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFs);
    
    // BABY STEP: Only generate demo data if the user is NEW or clicks a button
    // This prevents real customer data from being wiped out on refresh!
    const init = async () => {
      const hasSeenApp = localStorage.getItem('has_initialized_before');
      
      if (!hasSeenApp) {
        await handleClearBookings();
        setExpenses([]);
        resetHousekeeping();
        setDismissedSafetyIssues([]);
        setTimeout(() => {
          handleGenerateDemoData();
          localStorage.setItem('has_initialized_before', 'true');
        }, 500);
      }
    };
    init();
    
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!supabase || !isConfigured) {
        setRooms(INITIAL_ROOMS);
        return;
      }
      const { data, error } = await supabase.from('rooms').select('*');
      if (error) {
        console.error("Error fetching rooms:", error.message);
        setRooms(INITIAL_ROOMS);
      } else if (data && data.length > 0) {
        setRooms(data.map(r => ({
          ...r,
          id: r.id,
          name: r.name || 'Unnamed Unit',
          pricePerNightCents: r.price_per_night || 100000,
          description: r.description || 'Luxury boutique accommodation'
        })));
      } else {
        setRooms(INITIAL_ROOMS);
      }
    };
    fetchRooms();
  }, [isConfigured, supabase]);

  const propertyRooms = useMemo(() => {
    let filtered = rooms;
    if (userContext) {
      filtered = rooms.filter(r => r.property_id === userContext.property_id);
    }
    if (filtered.length === 0) filtered = rooms;
    return [...filtered].sort((a, b) => a.pricePerNightCents - b.pricePerNightCents);
  }, [userContext, rooms]);

  const [dismissedSafetyIssues, setDismissedSafetyIssues] = useState<string[]>([]);

  const operationalIssues = useMemo(() => {
    const rawIssues = scanForOperationalFaults(bookings, propertyRooms);
    return rawIssues.filter(issue => !dismissedSafetyIssues.includes(issue.id));
  }, [bookings, propertyRooms, dismissedSafetyIssues]);

  const handleDismissSafetyIssue = (id: string) => {
    setDismissedSafetyIssues(prev => [...prev, id]);
  };

  const ledgerRanges = useMemo(() => {
    const start = new Date(ledgerDate);
    start.setHours(0,0,0,0);
    const end = new Date(start);

    if (ledgerFilter === 'monthly') {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23,59,59,999);
    } else if (ledgerFilter === 'yearly') {
      start.setMonth(0, 1);
      end.setMonth(11, 31);
      end.setHours(23,59,59,999);
    }
    return { start, end };
  }, [ledgerDate, ledgerFilter]);

  const allActiveReservations = useMemo(() => {
    const { start, end } = ledgerRanges;
    const startTime = start.getTime();
    const endTime = end.getTime();

    let list = [...bookings]
      .filter(b => b.status !== 'cancelled')
      .filter(b => {
        const checkIn = new Date(b.check_in).getTime();
        const checkOut = new Date(b.check_out).getTime();
        return checkIn < endTime && checkOut > startTime;
      });

    if (financeSearch) {
      const query = financeSearch.toLowerCase();
      list = list.filter(b => 
        b.guest_name.toLowerCase().includes(query) || 
        b.id.toLowerCase().includes(query)
      );
    }

    if (showOnlyDebtors) {
      list = list.filter(b => getTxFinancials(b).outstanding > 0);
    }

    return list.sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime());
  }, [bookings, ledgerRanges, financeSearch, showOnlyDebtors, getTxFinancials]);

  const filteredExpenses = useMemo(() => {
    const { start, end } = ledgerRanges;
    const startTime = start.getTime();
    const endTime = end.getTime();

    let list = [...expenses].filter(e => {
      const expenseDate = new Date(e.date).getTime();
      return expenseDate >= startTime && expenseDate < endTime;
    });

    if (financeSearch) {
      const query = financeSearch.toLowerCase();
      list = list.filter(e => 
        e.category.toLowerCase().includes(query) || 
        e.note.toLowerCase().includes(query)
      );
    }

    return list;
  }, [expenses, ledgerRanges, financeSearch]);

  const transactionHistory = useMemo(() => {
    const { start, end } = ledgerRanges;
    const startTime = start.getTime();
    const endTime = end.getTime();

    const allTxs: any[] = [];
    bookings.forEach(b => {
      (b.transactions || []).forEach(tx => {
        const txDate = new Date(tx.created_at).getTime();
        if (txDate >= startTime && txDate <= endTime) {
          allTxs.push({
            ...tx,
            guestName: b.guest_name,
            guestId: b.id,
            roomName: propertyRooms.find(r => r.id === b.room_id)?.name || 'Unknown Unit',
            guestCheckIn: b.check_in,
            guestCheckOut: b.check_out
          });
        }
      });
    });
    return allTxs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [bookings, propertyRooms, ledgerRanges]);

  const unifiedMonthlyTotals = useMemo(() => {
    const groups: Record<string, MonthlyTotal> = {};
    const bookingBalancesByMonth: Record<string, Record<string, number>> = {};
    
    transactionHistory.forEach(tx => {
      const monthLabel = new Date(tx.created_at).toLocaleString('en-ZA', { month: 'long', year: 'numeric' });
      if (!groups[monthLabel]) {
        groups[monthLabel] = { label: monthLabel, totalCharges: 0, totalCredits: 0, totalExpenses: 0, netBalance: 0, debtors: [] };
        bookingBalancesByMonth[monthLabel] = {};
      }
      
      if (tx.amount_cents > 0) {
        groups[monthLabel].totalCharges += tx.amount_cents;
      } else {
        groups[monthLabel].totalCredits += Math.abs(tx.amount_cents);
      }

      if (tx.guestId) {
        bookingBalancesByMonth[monthLabel][tx.guestId] = (bookingBalancesByMonth[monthLabel][tx.guestId] || 0) + tx.amount_cents;
      }
    });

    // Include Expenses in totals
    expenses.forEach(e => {
      const monthLabel = new Date(e.date).toLocaleString('en-ZA', { month: 'long', year: 'numeric' });
      if (!groups[monthLabel]) {
        groups[monthLabel] = { label: monthLabel, totalCharges: 0, totalCredits: 0, totalExpenses: 0, netBalance: 0, debtors: [] };
      }
      groups[monthLabel].totalExpenses += e.amount_cents;
    });

    // Finalize netBalance and debtors list
    Object.keys(groups).forEach(month => {
      const g = groups[month];
      g.netBalance = g.totalCredits - g.totalExpenses;
      
      const monthBookings = bookingBalancesByMonth[month] || {};
      g.debtors = Object.entries(monthBookings)
        .filter(([_, balance]) => balance > 0)
        .map(([id, balance]) => {
          const booking = bookings.find(b => b.id === id);
          return { id, name: booking?.guest_name || 'Unknown', balance };
        })
        .sort((a, b) => b.balance - a.balance);
    });

    return Object.values(groups).sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime());
  }, [transactionHistory, expenses, bookings]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const arrivalsToday = useMemo(() => {
    return bookings.filter(b => b.check_in <= todayStr && b.status === 'confirmed' && b.check_in_status === 'not-checked-in');
  }, [bookings, todayStr]);

  const departuresToday = useMemo(() => {
    return bookings.filter(b => b.check_out <= todayStr && b.status === 'confirmed' && b.check_in_status === 'checked-in');
  }, [bookings, todayStr]);

  const globalOpsSearchResults = useMemo(() => {
    if (!opsSearch.trim()) return [];
    const query = opsSearch.toLowerCase();
    return bookings.filter(b => 
      b.status !== 'cancelled' &&
      (b.guest_name.toLowerCase().includes(query) || b.id.toLowerCase().includes(query))
    ).sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime());
  }, [bookings, opsSearch]);

  const formatPrice = (cents: number) => (cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    const newDate = new Date(val);
    newDate.setHours(0,0,0,0);
    setLedgerDate(newDate);
  };

  const handleExpenseDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    const newDate = new Date(val);
    newDate.setHours(0,0,0,0);
    setExpenseDate(newDate);
  };

  const handleFullReset = async () => {
    await handleClearBookings();
    resetHousekeeping();
    setExpenses([]);
    setDismissedSafetyIssues([]);
  };

  const handleExportToExcel = () => {
    const nowStr = new Date().toLocaleString('en-ZA');
    const csvRows: string[] = [];

    const clean = (v: any) => {
      if (v === null || v === undefined) return "";
      return v.toString().replace(/"/g, '').replace(/,/g, ';');
    };

    csvRows.push(`${clean("GUEST LEDGER SUMMARY")}`);
    csvRows.push(`${clean("Property")},${clean(settings.name)}`);
    csvRows.push(`${clean("Generated")},${clean(nowStr)}`);
    csvRows.push("");

    const processedBookings = allActiveReservations.map(booking => {
      const room = propertyRooms.find(r => r.id === booking.room_id);
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
        subtitle: room?.name || 'Unknown Unit',
        reference: booking.id.toUpperCase().slice(0, 8),
        history: historyWithBalance,
        finalBalance: runningBalance,
        sortDate: sortedTxs.length > 0 ? new Date(sortedTxs[0].created_at) : new Date(booking.check_in)
      };
    });

    const processedExpenses = filteredExpenses.map(expense => {
      return {
        type: 'expense',
        title: expense.category,
        subtitle: 'Operational Expense',
        reference: expense.id.toUpperCase().slice(0, 8),
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
    allAccounts.sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());

    const grouped: Record<string, { accounts: any[], totalDebits: number, totalCredits: number, net: number }> = {};
    allAccounts.forEach(account => {
      const monthLabel = account.sortDate.toLocaleString('en-ZA', { month: 'long', year: 'numeric' });
      if (!grouped[monthLabel]) {
        grouped[monthLabel] = { accounts: [], totalDebits: 0, totalCredits: 0, net: 0 };
      }
      grouped[monthLabel].accounts.push(account);
      
      account.history.forEach((tx: any) => {
        if (tx.amount_cents > 0) {
          grouped[monthLabel].totalDebits += tx.amount_cents;
        } else {
          grouped[monthLabel].totalCredits += Math.abs(tx.amount_cents);
        }
        grouped[monthLabel].net += tx.amount_cents;
      });
    });

    Object.entries(grouped).forEach(([month, group]) => {
      csvRows.push(`${clean("AUDIT CYCLE: " + month.toUpperCase())}`);
      csvRows.push(`${clean("Monthly Subtotal Debits")},${(group.totalDebits / 100).toFixed(2)}`);
      csvRows.push(`${clean("Monthly Subtotal Credits")},${(group.totalCredits / 100).toFixed(2)}`);
      csvRows.push(`${clean("Monthly Net Balance")},${(group.net / 100).toFixed(2)}`);
      csvRows.push("");

      group.accounts.forEach(account => {
        const typeLabel = account.type === 'booking' ? "GUEST ACCOUNT" : "EXPENSE ENTRY";
        csvRows.push(`${clean(typeLabel)},${clean(account.title)},${clean("REF")},${clean(account.reference)},${clean("UNIT/CAT")},${clean(account.subtitle)}`);
        csvRows.push(`${clean("Date")},${clean("Description")},${clean("Amount")},${clean("Running Balance")}`);

        account.history.forEach((tx: any) => {
          csvRows.push([
            clean(new Date(tx.created_at).toLocaleDateString('en-ZA')),
            clean(tx.note || 'Entry'),
            (tx.amount_cents / 100).toFixed(2),
            (tx.currentBalance / 100).toFixed(2)
          ].join(","));
        });

        csvRows.push(`${clean("CLOSING POSITION")},,${(account.finalBalance / 100).toFixed(2)}`);
        csvRows.push("");
      });
      csvRows.push(""); 
    });

    csvRows.push(`${clean("END OF REPORT")}`);

    const finalizeExport = (csvRows: string[]) => {
      const blobContent = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([blobContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Audit_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    finalizeExport(csvRows);
  };

  const handleWhatsAppBooking = (booking: Booking) => {
    const phone = booking.guest_phone?.replace(/\D/g, '');
    if (!phone) {
      alert("No phone number found for this guest.");
      return;
    }
    
    const { total_charged, total_paid, outstanding } = getTxFinancials(booking);
    
    const message = `*INVOICE SUMMARY - ${settings.name}*\n\n` +
      `*Guest:* ${booking.guest_name}\n` +
      `*Ref:* ${booking.id.toUpperCase().slice(0, 8)}\n` +
      `*Dates:* ${booking.check_in} to ${booking.check_out}\n\n` +
      `--------------------------\n` +
      `*Stay Total:* R${formatPrice(total_charged)}\n` +
      `*Amount Paid:* R${formatPrice(total_paid)}\n` +
      `*Balance Due:* R${formatPrice(outstanding)}\n` +
      `--------------------------\n\n` +
      `Thank you for choosing ${settings.name}. For any queries, please contact ${settings.phone}.`;
      
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleShowExposure = (monthLabel: string) => {
    const date = new Date(monthLabel);
    setLedgerDate(date);
    setLedgerFilter('monthly');
    setShowOnlyDebtors(true);
    setView(View.INVOICING);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerateDemoData = async () => {
    if (!propertyRooms.length) return;
    
    // Robust helper to get YYYY-MM-DD in local time
    const toDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Clear existing data first
    await handleClearBookings();
    setExpenses([]);
    resetHousekeeping();
    setDismissedSafetyIssues([]);
    
    const names = [
      'James Smith', 'Maria Garcia', 'Robert Johnson', 'Patricia Brown', 'Michael Miller', 
      'Linda Davis', 'William Wilson', 'Elizabeth Moore', 'David Taylor', 'Sarah Anderson', 
      'Thomas Jackson', 'Jennifer White', 'Charles Harris', 'Susan Martin', 'Christopher Thompson', 
      'Jessica Young', 'Daniel King', 'Karen Wright', 'Matthew Scott', 'Nancy Green',
      'Anthony Baker', 'Betty Adams', 'Kevin Campbell', 'Dorothy Mitchell', 'Brian Roberts',
      'Sandra Carter', 'Edward Phillips', 'Ashley Evans', 'Ronald Turner', 'Kimberly Torres',
      'Jason Parker', 'Donna Collins', 'Jeffrey Edwards', 'Michelle Stewart', 'Ryan Morris',
      'Carol Rogers', 'Gary Reed', 'Amanda Cook', 'Nicholas Morgan', 'Melissa Bell',
      'Eric Murphy', 'Deborah Bailey', 'Stephen Rivera', 'Stephanie Cooper', 'Andrew Richardson',
      'Rebecca Cox', 'Timothy Howard', 'Laura Ward', 'Frank Torres', 'Cynthia Peterson'
    ];
    
    const demoBookings: Booking[] = [];
    // Use local time for "today"
    const now = new Date(); 
    const todayStr = toDateStr(now);
    
    const roomSchedules: Record<string, { start: string, end: string }[]> = {};
    let createdCount = 0;
    
    const createBookingsForMonth = (year: number, month: number, count: number) => {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      let monthCreated = 0;
      let attempts = 0;
      
      while (monthCreated < count && attempts < 300) {
        attempts++;
        const room = propertyRooms[Math.floor(Math.random() * propertyRooms.length)];
        if (!roomSchedules[room.id]) roomSchedules[room.id] = [];
        
        const startDay = Math.floor(Math.random() * (daysInMonth - 3)) + 1;
        const nights = Math.floor(Math.random() * 3) + 2; 
        
        const checkIn = new Date(year, month, startDay);
        const checkOut = new Date(year, month, startDay + nights);
        
        const checkInStr = toDateStr(checkIn);
        const checkOutStr = toDateStr(checkOut);
        
        const isOverlapping = roomSchedules[room.id].some(s => (checkInStr < s.end) && (checkOutStr > s.start));
        
        if (!isOverlapping) {
          roomSchedules[room.id].push({ start: checkInStr, end: checkOutStr });
          
          const bookingId = crypto.randomUUID().slice(0, 9);
          const subtotalCents = nights * room.pricePerNightCents;
          const vatAmountCents = Math.round(subtotalCents * VAT_RATE);

          const transactions: LedgerTransaction[] = [
            {
              id: crypto.randomUUID(),
              booking_id: bookingId,
              tenant_id: room.tenant_id,
              property_id: room.property_id,
              amount_cents: subtotalCents,
              type: 'charge',
              currency: 'ZAR',
              effective_date: checkInStr,
              source: 'system',
              note: `Accommodation: ${room.name} (${nights} nights)`,
              created_at: checkIn.toISOString(),
              created_by: 'demo-system',
              role_at_time: 'admin',
              is_locked: false
            },
            {
              id: crypto.randomUUID(),
              booking_id: bookingId,
              tenant_id: room.tenant_id,
              property_id: room.property_id,
              amount_cents: vatAmountCents,
              type: 'charge',
              currency: 'ZAR',
              effective_date: checkInStr,
              source: 'system',
              note: 'VAT 15%',
              created_at: checkIn.toISOString(),
              created_by: 'demo-system',
              role_at_time: 'admin',
              is_locked: false
            }
          ];

          let status: Booking['status'] = 'confirmed';
          let checkInStatus: Booking['check_in_status'] = 'not-checked-in';

          const totalDue = subtotalCents + vatAmountCents;
          const paymentRoll = Math.random();

          if (checkOutStr < todayStr) {
            status = 'completed';
            checkInStatus = 'checked-out';
            transactions.push({
              id: crypto.randomUUID(),
              booking_id: bookingId,
              tenant_id: room.tenant_id,
              property_id: room.property_id,
              amount_cents: -totalDue,
              type: 'payment',
              currency: 'ZAR',
              effective_date: checkInStr,
              source: 'manual',
              note: 'Final Bill Settlement',
              created_at: checkOut.toISOString(),
              created_by: 'demo-system',
              role_at_time: 'admin',
              is_locked: false
            });
          } else {
            if (paymentRoll < 0.5) {
              transactions.push({
                id: crypto.randomUUID(),
                booking_id: bookingId,
                tenant_id: room.tenant_id,
                property_id: room.property_id,
                amount_cents: -totalDue,
                type: 'payment',
                currency: 'ZAR',
                effective_date: checkInStr,
                source: 'manual',
                note: 'Full Payment Received',
                created_at: checkIn.toISOString(),
                created_by: 'demo-system',
                role_at_time: 'admin',
                is_locked: false
              });
            } else if (paymentRoll < 0.75) {
              transactions.push({
                id: crypto.randomUUID(),
                booking_id: bookingId,
                tenant_id: room.tenant_id,
                property_id: room.property_id,
                amount_cents: -Math.round(totalDue * 0.5),
                type: 'payment',
                currency: 'ZAR',
                effective_date: checkInStr,
                source: 'manual',
                note: 'Partial Payment (Deposit)',
                created_at: checkIn.toISOString(),
                created_by: 'demo-system',
                role_at_time: 'admin',
                is_locked: false
              });
            }

            if (checkInStr <= todayStr && checkOutStr > todayStr) {
              checkInStatus = 'checked-in';
            }
          }

          demoBookings.push({
            id: bookingId,
            tenant_id: room.tenant_id,
            property_id: room.property_id,
            room_id: room.id,
            guest_name: names[createdCount % names.length],
            check_in: checkInStr,
            check_out: checkOutStr,
            status,
            check_in_status: checkInStatus,
            created_at: now.toISOString(),
            transactions,
            is_locked: false,
            guest_phone: '+2782' + Math.floor(1000000 + Math.random() * 9000000)
          });
          
          createdCount++;
          monthCreated++;
        }
      }
    };

    const createSpecificBookings = (type: 'arrival' | 'departure', count: number) => {
      let added = 0;
      let attempts = 0;
      while (added < count && attempts < 200) {
        attempts++;
        const room = propertyRooms[Math.floor(Math.random() * propertyRooms.length)];
        if (!roomSchedules[room.id]) roomSchedules[room.id] = [];
        
        const nights = 3;
        let checkIn, checkOut;
        
        if (type === 'arrival') {
          checkIn = new Date(now);
          checkOut = new Date(now);
          checkOut.setDate(checkOut.getDate() + nights);
        } else {
          checkIn = new Date(now);
          checkIn.setDate(checkIn.getDate() - nights);
          checkOut = new Date(now);
        }
        
        const checkInStr = toDateStr(checkIn);
        const checkOutStr = toDateStr(checkOut);
        
        const isOverlapping = roomSchedules[room.id].some(s => (checkInStr < s.end) && (checkOutStr > s.start));
        
        if (!isOverlapping) {
          roomSchedules[room.id].push({ start: checkInStr, end: checkOutStr });
          const bookingId = crypto.randomUUID().slice(0, 9);
          const subtotalCents = nights * room.pricePerNightCents;
          const vatAmountCents = Math.round(subtotalCents * VAT_RATE);
          
          const totalDue = subtotalCents + vatAmountCents;
          const paymentRoll = Math.random();
          
          const transactions: LedgerTransaction[] = [
            {
              id: crypto.randomUUID(),
              booking_id: bookingId,
              tenant_id: room.tenant_id,
              property_id: room.property_id,
              amount_cents: subtotalCents,
              type: 'charge',
              currency: 'ZAR',
              effective_date: checkInStr,
              source: 'system',
              note: `Accommodation: ${room.name} (${nights} nights)`,
              created_at: checkIn.toISOString(),
              created_by: 'demo-system',
              role_at_time: 'admin',
              is_locked: false
            },
            {
              id: crypto.randomUUID(),
              booking_id: bookingId,
              tenant_id: room.tenant_id,
              property_id: room.property_id,
              amount_cents: vatAmountCents,
              type: 'charge',
              currency: 'ZAR',
              effective_date: checkInStr,
              source: 'system',
              note: 'VAT 15%',
              created_at: checkIn.toISOString(),
              created_by: 'demo-system',
              role_at_time: 'admin',
              is_locked: false
            }
          ];

          if (paymentRoll < 0.5) {
            transactions.push({
              id: crypto.randomUUID(),
              booking_id: bookingId,
              tenant_id: room.tenant_id,
              property_id: room.property_id,
              amount_cents: -totalDue,
              type: 'payment',
              currency: 'ZAR',
              effective_date: checkInStr,
              source: 'manual',
              note: 'Full Payment Received',
              created_at: checkIn.toISOString(),
              created_by: 'demo-system',
              role_at_time: 'admin',
              is_locked: false
            });
          } else if (paymentRoll < 0.75) {
            transactions.push({
              id: crypto.randomUUID(),
              booking_id: bookingId,
              tenant_id: room.tenant_id,
              property_id: room.property_id,
              amount_cents: -Math.round(totalDue * 0.5),
              type: 'payment',
              currency: 'ZAR',
              effective_date: checkInStr,
              source: 'manual',
              note: 'Partial Payment (Deposit)',
              created_at: checkIn.toISOString(),
              created_by: 'demo-system',
              role_at_time: 'admin',
              is_locked: false
            });
          }

          demoBookings.push({
            id: bookingId,
            tenant_id: room.tenant_id,
            property_id: room.property_id,
            room_id: room.id,
            guest_name: names[createdCount % names.length],
            check_in: checkInStr,
            check_out: checkOutStr,
            status: 'confirmed',
            check_in_status: type === 'arrival' ? 'not-checked-in' : 'checked-in',
            created_at: now.toISOString(),
            transactions,
            is_locked: false,
            guest_phone: '+2782' + Math.floor(1000000 + Math.random() * 9000000)
          });
          added++;
          createdCount++;
        }
      }
    };

    // Generate bookings for March, April, May
    createBookingsForMonth(2026, 2, 20); 
    createBookingsForMonth(2026, 3, 15); 
    createBookingsForMonth(2026, 4, 15); 
    
    createSpecificBookings('arrival', 2);
    createSpecificBookings('departure', 2);
    
    let inHouseAdded = 0;
    let inHouseAttempts = 0;
    while (inHouseAdded < 4 && inHouseAttempts < 200) {
        inHouseAttempts++;
        const room = propertyRooms[inHouseAdded % propertyRooms.length];
        if (!roomSchedules[room.id]) roomSchedules[room.id] = [];

        const checkIn = new Date(now);
        const checkOut = new Date(now);
        checkOut.setDate(checkOut.getDate() + 5);
        
        const checkInStr = toDateStr(checkIn);
        const checkOutStr = toDateStr(checkOut);
        
        const isOverlapping = roomSchedules[room.id].some(s => (checkInStr < s.end) && (checkOutStr > s.start));

        if (!isOverlapping) {
          roomSchedules[room.id].push({ start: checkInStr, end: checkOutStr });
          const bookingId = crypto.randomUUID().slice(0, 9);
          const nights = 5;
          const subtotalCents = nights * room.pricePerNightCents;
          const vatAmountCents = Math.round(subtotalCents * VAT_RATE);
          
          const totalDue = subtotalCents + vatAmountCents;
          const paymentRoll = Math.random();
          
          const transactions: LedgerTransaction[] = [
              {
                  id: crypto.randomUUID(),
                  booking_id: bookingId,
                  tenant_id: room.tenant_id,
                  property_id: room.property_id,
                  amount_cents: subtotalCents,
                  type: 'charge',
                  currency: 'ZAR',
                  effective_date: checkInStr,
                  source: 'system',
                  note: `Accommodation: ${room.name} (${nights} nights)`,
                  created_at: checkIn.toISOString(),
                  created_by: 'demo-system',
                  role_at_time: 'admin',
                  is_locked: false
              },
              {
                  id: crypto.randomUUID(),
                  booking_id: bookingId,
                  tenant_id: room.tenant_id,
                  property_id: room.property_id,
                  amount_cents: vatAmountCents,
                  type: 'charge',
                  currency: 'ZAR',
                  effective_date: checkInStr,
                  source: 'system',
                  note: 'VAT 15%',
                  created_at: checkIn.toISOString(),
                  created_by: 'demo-system',
                  role_at_time: 'admin',
                  is_locked: false
              }
          ];

          if (paymentRoll < 0.5) {
              transactions.push({
                  id: crypto.randomUUID(),
                  booking_id: bookingId,
                  tenant_id: room.tenant_id,
                  property_id: room.property_id,
                  amount_cents: -totalDue,
                  type: 'payment',
                  currency: 'ZAR',
                  effective_date: checkInStr,
                  source: 'manual',
                  note: 'Full Payment Received',
                  created_at: checkIn.toISOString(),
                  created_by: 'demo-system',
                  role_at_time: 'admin',
                  is_locked: false
              });
          } else if (paymentRoll < 0.75) {
              transactions.push({
                  id: crypto.randomUUID(),
                  booking_id: bookingId,
                  tenant_id: room.tenant_id,
                  property_id: room.property_id,
                  amount_cents: -Math.round(totalDue * 0.5),
                  type: 'payment',
                  currency: 'ZAR',
                  effective_date: checkInStr,
                  source: 'manual',
                  note: 'Partial Payment (Deposit)',
                  created_at: checkIn.toISOString(),
                  created_by: 'demo-system',
                  role_at_time: 'admin',
                  is_locked: false
              });
          }

          demoBookings.push({
              id: bookingId,
              tenant_id: room.tenant_id,
              property_id: room.property_id,
              room_id: room.id,
              guest_name: names[(createdCount + inHouseAdded) % names.length],
              check_in: checkInStr,
              check_out: checkOutStr,
              status: 'confirmed',
              check_in_status: 'checked-in',
              created_at: now.toISOString(),
              transactions,
              is_locked: false,
              guest_phone: '+2782' + Math.floor(1000000 + Math.random() * 9000000)
          });
          inHouseAdded++;
        }
    }

    // Add 8 additional expenses for the current month
    const expenseCats = ['Utilities (Water/Elec)', 'Maintenance', 'Staff Wages', 'Laundry & Cleaning', 'Food & Beverage'];
    const newExpenses: Expense[] = [];
    for (let i = 0; i < 8; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      const dateStr = `2026-03-${day.toString().padStart(2, '0')}`;
      newExpenses.push({
        id: crypto.randomUUID(),
        date: dateStr,
        category: expenseCats[Math.floor(Math.random() * expenseCats.length)],
        amount_cents: Math.floor(Math.random() * 500000) + 50000,
        note: `March Expense ${i + 1}`
      });
    }
    setExpenses(prev => [...prev, ...newExpenses]);

    // Add 2 explicit Warning-triggering bookings (Late Checkouts)
    const triggerRooms = propertyRooms.slice(0, 2);
    triggerRooms.forEach((room, idx) => {
      const bookingId = `WARN-${idx}-${crypto.randomUUID().slice(0, 4)}`;
      const checkIn = new Date(now);
      checkIn.setDate(checkIn.getDate() - 2);
      const checkInStr = toDateStr(checkIn);
      const checkOutStr = todayStr;
      
      const nights = 2;
      const subtotalCents = nights * room.pricePerNightCents;
      const vatAmountCents = Math.round(subtotalCents * VAT_RATE);
      const totalDue = subtotalCents + vatAmountCents;

      const transactions: LedgerTransaction[] = [
        {
          id: crypto.randomUUID(),
          booking_id: bookingId,
          tenant_id: room.tenant_id,
          property_id: room.property_id,
          amount_cents: subtotalCents,
          type: 'charge',
          currency: 'ZAR',
          effective_date: checkInStr,
          source: 'system',
          note: `Accommodation: ${room.name} (Warning Demo)`,
          created_at: checkIn.toISOString(),
          created_by: 'demo-system',
          role_at_time: 'admin',
          is_locked: false
        },
        {
          id: crypto.randomUUID(),
          booking_id: bookingId,
          tenant_id: room.tenant_id,
          property_id: room.property_id,
          amount_cents: vatAmountCents,
          type: 'charge',
          currency: 'ZAR',
          effective_date: checkInStr,
          source: 'system',
          note: 'VAT 15%',
          created_at: checkIn.toISOString(),
          created_by: 'demo-system',
          role_at_time: 'admin',
          is_locked: false
        }
      ];

      // If idx is 1, add a partial payment so it has a balance warning too
      if (idx === 1) {
        transactions.push({
          id: crypto.randomUUID(),
          booking_id: bookingId,
          tenant_id: room.tenant_id,
          property_id: room.property_id,
          amount_cents: -Math.round(totalDue * 0.4),
          type: 'payment',
          currency: 'ZAR',
          effective_date: checkInStr,
          source: 'manual',
          note: 'Deposit Received',
          created_at: checkIn.toISOString(),
          created_by: 'demo-system',
          role_at_time: 'admin',
          is_locked: false
        });
      }

      demoBookings.push({
        id: bookingId,
        tenant_id: room.tenant_id,
        property_id: room.property_id,
        room_id: room.id,
        guest_name: idx === 0 ? 'Late Leaver Larry' : 'Unpaid Ursula',
        check_in: checkInStr,
        check_out: checkOutStr,
        status: 'confirmed',
        check_in_status: 'checked-in',
        created_at: now.toISOString(),
        transactions,
        is_locked: false,
        guest_phone: '+2782000000' + idx
      });
    });

    await handleConfirmBooking(demoBookings, true);

    // Randomly set some rooms to dirty or cleaning for demo purposes
    propertyRooms.forEach(room => {
      const rand = Math.random();
      if (rand < 0.2) {
        updateHousekeeping(room.id, 'dirty');
      } else if (rand < 0.3) {
        updateHousekeeping(room.id, 'cleaning');
      }
    });

    alert(`Demo Environment Synchronized: ${demoBookings.length} bookings generated across 3 months. System is live for ${now.toLocaleDateString('en-ZA')}.`);
  };

  const handleCheckInGuest = async (booking: Booking) => {
    await handleCheckIn(booking.id);
    const phone = booking.guest_phone?.replace(/\D/g, '');
    if (phone) {
      const msg = `Hello *${booking.guest_name}*, welcome to *${settings.name}*! We have successfully checked you in. We hope you have a pleasant stay with us!`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  const handleCheckOutGuest = async (booking: Booking) => {
    const { outstanding } = getTxFinancials(booking);
    if (outstanding > 0 && !confirm(`Warning: Balance of R${formatPrice(outstanding)} due. Check-out anyway?`)) return;
    
    await handleUpdateStatus(booking.id, 'completed');
    await handleUpdateCheckInStatus(booking.id, 'checked-out');
    await updateHousekeeping(booking.room_id, 'dirty');
    
    const phone = booking.guest_phone?.replace(/\D/g, '');
    if (phone) {
      const msg = `Hello *${booking.guest_name}*, thank you for staying at *${settings.name}*! We have successfully checked you out. We hope you had a wonderful stay and look forward to welcoming you back soon!`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    }

    alert(`${booking.guest_name} checked out. Unit marked as DIRTY.`);
  };

  const handleAdminSwitch = () => {
    if (isAdmin) return; // Already admin
    setShowPasswordModal(true);
  };

  const handlePasswordConfirm = (pw: string) => {
    if (pw === (settings.adminPassword || 'admin')) {
      setDemoRole('ADMIN');
      setShowPasswordModal(false);
    } else {
      alert("Incorrect password.");
    }
  };

  if (authLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black text-slate-600 tracking-widest uppercase text-center">Synchronizing Management Systems...</div>;
  if (isConfigured && !session) return <Login onLoginSuccess={() => window.location.reload()} />;

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 text-slate-900 overflow-x-hidden transition-all duration-500`}>
      {/* --- ROLE SWITCHER (For Demo Purposes) --- */}
      <div className="bg-slate-900 p-2 flex justify-center gap-4 sticky top-0 z-[60]">
        <span className="text-[10px] font-black text-slate-600 uppercase self-center">Current View:</span>
        <button 
          onClick={() => setDemoRole('STAFF')}
          className={`px-4 py-1 rounded-full text-[10px] font-black uppercase transition-all ${!isAdmin ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-white'}`}
        >
          Staff Mode
        </button>
        <button 
          onClick={handleAdminSwitch}
          className={`px-4 py-1 rounded-full text-[10px] font-black uppercase transition-all ${isAdmin ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-white'}`}
        >
          Admin Mode
        </button>
      </div>

      <Navbar 
        view={view} 
        setView={setView} 
        userContext={userContext} 
        isAdmin={isAdmin} 
      />
      
      {showPasswordModal && (
        <PasswordModal 
          onConfirm={handlePasswordConfirm} 
          onCancel={() => setShowPasswordModal(false)} 
        />
      )}
      
      <main className={`flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 pb-24 ${isFullscreen ? 'pt-4' : ''}`}>
        <OperationalAlerts 
          bookings={bookings} 
          rooms={propertyRooms} 
          getFinancials={getTxFinancials} 
          onDismiss={handleUpdateCheckInStatus}
        />
        {/* ACCESS DENIED MESSAGE */}
        {!isAdmin && (view === View.INVOICING || view === View.ADMIN || view === View.HISTORY || view === View.SETTINGS) ? (
          <div className="flex flex-col items-center justify-center py-40 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-[2rem] flex items-center justify-center mb-6 text-3xl shadow-xl shadow-rose-500/10">🔒</div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Access Restricted</h2>
            <p className="text-slate-700 text-sm mt-2 font-medium">Please switch to Admin Mode to view financial and configuration data.</p>
            <button 
              onClick={handleAdminSwitch}
              className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95"
            >
              Elevate to Admin
            </button>
          </div>
        ) : (
          <>
            {view === View.HOME && (
          <div className="space-y-12 animate-in fade-in duration-500 mt-6">
            <header className="relative h-[25vh] flex items-center justify-center rounded-[3rem] overflow-hidden shadow-2xl bg-slate-900">
               <img src="https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&q=80&w=2000" className="absolute inset-0 w-full h-full object-cover opacity-30" alt="" />
               <div className="relative text-center z-10 px-6 space-y-4">
                 <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter serif uppercase">{settings.name}</h1>
                 <div className="flex flex-wrap gap-4 justify-center">
                   <button onClick={handleGenerateDemoData} className="px-6 py-3 bg-emerald-600/90 backdrop-blur-md text-white border border-emerald-400/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl">Re-generate Demo Data</button>
                   <button onClick={handleFullReset} className="px-6 py-3 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all">Clear All History</button>
                 </div>
               </div>
            </header>

            <div className="max-w-3xl mx-auto -mt-8 relative z-30 px-4">
              <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 p-2.5 rounded-[2.5rem] shadow-2xl flex items-center gap-4 transition-all focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-400">
                <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input 
                  type="text"
                  placeholder="Instantly find Guest by Name or Reference..."
                  value={opsSearch}
                  onChange={(e) => setOpsSearch(e.target.value)}
                  className="flex-1 bg-transparent border-none text-sm font-bold placeholder:text-slate-600 text-slate-900 outline-none"
                />
              </div>
            </div>


            {opsSearch.trim() ? (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-2xl font-black uppercase tracking-widest flex items-center gap-4">
                  <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                  Matched Records
                </h3>
                {globalOpsSearchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {globalOpsSearchResults.map(b => (
                      <div key={b.id} className="bg-white p-7 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-4 group hover:shadow-xl transition-all">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xl font-black text-slate-900 truncate">{b.guest_name}</h4>
                          <button onClick={() => setActiveModal({ type: 'INVOICE', dataId: b.id })} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">View Statement</button>
                        </div>
                        <p className="text-[10px] font-bold text-slate-700 uppercase">{propertyRooms.find(r => r.id === b.room_id)?.name} • {b.check_in} — {b.check_out}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center text-slate-400 uppercase font-black text-[10px]">No records found matching "{opsSearch}"</div>
                )}
              </div>
            ) : (
              <>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatsCard label="Current Occupancy" value={`${Math.round(analyticsSummary.occupancyRate)}%`} trend={`${analyticsSummary.currentOccupied}/${analyticsSummary.totalUnits} Units`} color="text-blue-800" />
                  <StatsCard label="Arriving Today" value={arrivalsToday.length.toString()} color="text-emerald-800" />
                  <StatsCard label="Departing Today" value={departuresToday.length.toString()} color="text-orange-900" />
                </div>

                <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Pending Arrivals</h3>
                    {arrivalsToday.length > 0 ? arrivalsToday.map(b => (
                      <div key={b.id} className="bg-white p-5 rounded-[2rem] border shadow-sm flex justify-between items-center group hover:border-blue-400 transition-all">
                        <div 
                          className="min-w-0 flex-1 cursor-pointer hover:opacity-70 transition-opacity"
                          onClick={() => {
                            setFinanceSearch(b.guest_name);
                            setLedgerDate(new Date(b.check_in));
                            setLedgerFilter('monthly');
                            setView(View.INVOICING);
                          }}
                        >
                          <p className="text-base font-black text-slate-900 truncate">{b.guest_name}</p>
                          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest truncate">{propertyRooms.find(r => r.id === b.room_id)?.name}</p>
                        </div>
                        <button onClick={() => handleCheckInGuest(b)} className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg active:scale-95">Check In</button>
                      </div>
                    )) : (
                      <div className="p-10 border-2 border-dashed rounded-[2rem] text-center text-slate-500 uppercase font-black text-[10px]">No pending or overdue arrivals</div>
                    )}
                  </div>
                  
                  <div className="space-y-6">
                    <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-rose-500" /> Pending Departures</h3>
                    {departuresToday.length > 0 ? departuresToday.map(b => (
                      <div key={b.id} className="bg-white p-5 rounded-[2rem] border shadow-sm flex justify-between items-center group hover:border-rose-400 transition-all">
                        <div 
                          className="min-w-0 flex-1 cursor-pointer hover:opacity-70 transition-opacity"
                          onClick={() => {
                            setFinanceSearch(b.guest_name);
                            setLedgerDate(new Date(b.check_in));
                            setLedgerFilter('monthly');
                            setView(View.INVOICING);
                          }}
                        >
                          <p className="text-base font-black text-slate-900 truncate">{b.guest_name}</p>
                          <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest truncate">Balance: R{formatPrice(getTxFinancials(b).outstanding)}</p>
                        </div>
                        <button onClick={() => handleCheckOutGuest(b)} className="bg-rose-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg active:scale-95">Check Out</button>
                      </div>
                    )) : (
                      <div className="p-10 border-2 border-dashed rounded-[2rem] text-center text-slate-500 uppercase font-black text-[10px]">No pending or overdue departures</div>
                    )}
                  </div>
                </section>

                <ScheduleView 
                  bookings={bookings} 
                  housekeeping={housekeeping} 
                  rooms={propertyRooms} 
                  onBookingUpdate={handleUpdateRoom}
                  onBookingClick={(b) => setActiveModal({ type: 'INVOICE', dataId: b.id })} 
                  onRoomClick={(r) => setActiveModal({ type: 'CALENDAR', dataId: r.id })}
                  onStatusChange={updateHousekeeping}
                  getFinancials={getTxFinancials}
                />
              </>
            )}
          </div>
        )}

        {view === View.ROOMS && (
          <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-500 items-stretch">
            {propertyRooms.map(room => {
              const roomBookings = bookings.filter(b => b.room_id === room.id);
              const isLate = roomBookings.some(b => {
                if (b.check_out !== todayStr || b.status === 'cancelled') return false;
                const isStillIn = b.check_in_status === 'checked-in';
                const hasBalance = getTxFinancials(b).outstanding > 0;
                return isStillIn || hasBalance;
              });
              
              return (
                <div key={room.id} className={isLate ? "ring-4 ring-rose-500 rounded-[2rem] transition-all" : ""}>
                  <RoomCard 
                    room={room} 
                    onBook={(r) => setActiveModal({ type: 'BOOKING', dataId: r.id })} 
                    onViewInvoice={(b) => setActiveModal({ type: 'INVOICE', dataId: b.id })} 
                    onViewCalendar={(r) => setActiveModal({ type: 'CALENDAR', dataId: r.id })}
                    isBookedToday={bookings.some(b => b.room_id === room.id && b.status !== 'cancelled' && (todayStr >= b.check_in && todayStr < b.check_out))} 
                    bookings={roomBookings} 
                    housekeepingStatus={housekeeping[room.id] || 'clean'} 
                  />
                </div>
              );
            })}
          </div>
        )}

        {view === View.HOUSEKEEPING && (
          <HousekeepingView rooms={propertyRooms} housekeepingStatus={housekeeping} onUpdateStatus={updateHousekeeping} />
        )}

        {view === View.ADMIN && (
          <div className="py-12 space-y-12 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-8 gap-6">
              <div className="space-y-1">
                <h2 className="text-3xl font-black serif text-slate-900 uppercase">Expense Management</h2>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Track and log business operational costs</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm w-full md:w-auto">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input 
                    type="text"
                    placeholder="Search Expenses..."
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                    className="bg-transparent border-none text-[10px] font-black uppercase text-slate-900 outline-none w-32"
                  />
                  {expenseSearch && (
                    <button onClick={() => setExpenseSearch('')} className="text-slate-400 hover:text-slate-600">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
                  {(['monthly', 'yearly'] as const).map(f => (
                    <button key={f} onClick={() => setExpenseFilter(f)} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${expenseFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>{f}</button>
                  ))}
                </div>
                <input 
                  type={expenseFilter === 'monthly' ? 'month' : 'number'}
                  value={expenseFilter === 'monthly' ? `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}` : expenseDate.getFullYear()}
                  onChange={handleExpenseDateChange}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-slate-900 outline-none"
                  placeholder={expenseFilter === 'yearly' ? 'YYYY' : ''}
                />
              </div>
            </div>
            
            <ExpenseManager 
              expenses={expenses} 
              onAdd={addExpense} 
              filter={expenseFilter}
              date={expenseDate}
              search={expenseSearch}
            />
          </div>
        )}

        {(view === View.INVOICING || view === View.HISTORY) && (
          <div className="py-12 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-8 gap-6">
               <div className="space-y-1">
                  <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-black serif text-slate-900 uppercase tracking-tight">{view === View.INVOICING ? 'Financial Administration' : 'Audit Ledger'}</h2>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Revenue Lifecycle</p>
               </div>
                <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm w-full md:w-auto">
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input 
                      type="text"
                      placeholder="Search Guest..."
                      value={financeSearch}
                      onChange={(e) => setFinanceSearch(e.target.value)}
                      className="bg-transparent border-none text-[10px] font-black uppercase text-slate-900 outline-none w-32"
                    />
                    {financeSearch && (
                      <button onClick={() => setFinanceSearch('')} className="text-slate-600 hover:text-slate-800">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
                    {(['monthly', 'yearly'] as const).map(f => (
                      <button key={f} onClick={() => setLedgerFilter(f)} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${ledgerFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-700 hover:text-slate-900'}`}>{f}</button>
                    ))}
                  </div>
                  <input 
                    type={ledgerFilter === 'monthly' ? 'month' : 'number'}
                    value={ledgerFilter === 'monthly' ? `${ledgerDate.getFullYear()}-${String(ledgerDate.getMonth() + 1).padStart(2, '0')}` : ledgerDate.getFullYear()}
                    onChange={handleDateChange}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-slate-900 outline-none"
                    placeholder={ledgerFilter === 'yearly' ? 'YYYY' : ''}
                  />
                  {view === View.INVOICING && (
                    <button 
                      onClick={() => setShowOnlyDebtors(!showOnlyDebtors)}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${showOnlyDebtors ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-400 border-slate-200 hover:border-rose-400 hover:text-rose-400'}`}
                    >
                      {showOnlyDebtors ? 'Outstanding Only' : 'All Accounts'}
                    </button>
                  )}
               </div>
            </div>

            {view === View.INVOICING ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {(() => {
                    const totals = allActiveReservations.reduce((acc, b) => {
                      const { total_paid, outstanding } = getTxFinancials(b);
                      acc.received += total_paid;
                      acc.outstanding += outstanding;
                      return acc;
                    }, { received: 0, outstanding: 0 });

                    return (
                      <>
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex justify-between items-center group hover:border-emerald-400 transition-all">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Received</p>
                            <p className="text-3xl font-black text-emerald-600 tabular-nums">R{formatPrice(totals.received)}</p>
                          </div>
                          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3 1.343 3 3-1.343 3-3 3m0-10V7m0 10v1m0-9l-1-1m1 1l1-1m-1 12l-1-1m1 1l1-1" /></svg>
                          </div>
                        </div>
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex justify-between items-center group hover:border-rose-400 transition-all">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Outstanding</p>
                            <p className="text-3xl font-black text-rose-600 tabular-nums">R{formatPrice(totals.outstanding)}</p>
                          </div>
                          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto no-scrollbar">
                <table className="w-full text-left min-w-[900px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                      <th className="px-8 py-5">Guest Reference</th>
                      <th className="px-8 py-5">Stay Cycle</th>
                      <th className="px-8 py-5 text-center">Status</th>
                      <th className="px-8 py-5 text-center">Actions</th>
                      <th className="px-8 py-5 text-right">Received</th>
                      <th className="px-8 py-5 text-right">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allActiveReservations.length > 0 ? allActiveReservations.map(b => {
                      const { payment_status, outstanding, total_paid } = getTxFinancials(b);
                      return (
                        <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-6 cursor-pointer" onClick={() => setActiveModal({ type: 'INVOICE', dataId: b.id })}>
                            <p className="text-xs font-black text-slate-900">{b.guest_name}</p>
                            <p className="text-[9px] text-slate-400 uppercase tracking-widest">REF-{b.id.slice(0, 8).toUpperCase()}</p>
                          </td>
                          <td className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase">{b.check_in} — {b.check_out}</td>
                          <td className="px-8 py-6 text-center">
                            <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full border ${payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{payment_status}</span>
                          </td>
                          <td className="px-8 py-6 flex gap-2 justify-center">
                            <button 
                              onClick={() => handleWhatsAppBooking(b)} 
                              className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 text-emerald-600 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.483 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.308 1.656zm6.29-4.171c1.589.943 3.13 1.415 4.75 1.417 5.432.002 9.851-4.417 9.854-9.848.002-2.63-1.023-5.103-2.884-6.965C16.248 2.571 13.774 1.548 11.145 1.547c-5.431 0-9.85 4.419-9.853 9.85-.001 1.738.459 3.438 1.326 4.927l-1.03 3.766 3.856-1.012zm11.724-6.177c-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/></svg>
                              WhatsApp
                            </button>
                            <button onClick={() => setActiveModal({ type: 'PARTIAL_PAYMENT', dataId: b.id })} className="px-3 py-1.5 border border-amber-200 text-amber-600 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all">Payment</button>
                            <button onClick={() => setActiveModal({ type: 'CHARGE', dataId: b.id })} className="px-3 py-1.5 border border-blue-200 text-blue-600 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Charge</button>
                            <button onClick={() => setActiveModal({ type: 'CORRECTION', dataId: b.id })} className="px-3 py-1.5 border border-rose-200 text-rose-600 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">Correction</button>
                          </td>
                          <td className="px-8 py-6 text-xs font-black text-right tabular-nums text-emerald-600">R{formatPrice(total_paid)}</td>
                          <td className={`px-8 py-6 text-xs font-black text-right tabular-nums ${outstanding > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>R{formatPrice(outstanding)}</td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={6} className="px-8 py-20 text-center text-slate-300 font-bold uppercase text-[10px]">No active stays identified in this period</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
              <div className="space-y-8">
                <AuditSummaryDashboard 
                  monthlyTotals={unifiedMonthlyTotals} 
                  operationalIssues={operationalIssues}
                  onExport={handleExportToExcel} 
                  onShowExposure={handleShowExposure}
                  allBookings={bookings}
                  allExpenses={expenses}
                  onDismissIssue={handleDismissSafetyIssue}
                />
                <GeneralLedgerReport 
                  bookings={allActiveReservations} 
                  rooms={propertyRooms} 
                  expenses={filteredExpenses}
                />
              </div>
            )}
          </div>
        )}
        {view === View.SETTINGS && (
          <div className="py-12 animate-in fade-in duration-500">
            <SettingsView settings={settings} setSettings={setSettings} />
          </div>
        )}
      </>
      )}
      </main>

      {activeModal.type && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in zoom-in duration-300" onClick={() => setActiveModal({ type: null })}>
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar" onClick={e => e.stopPropagation()}>
            {(() => {
              const currentBooking = bookings.find(b => b.id === activeModal.dataId);
              const currentRoom = rooms.find(r => r.id === activeModal.dataId);
              
              switch (activeModal.type) {
                case 'BOOKING': return currentRoom ? <BookingModal room={currentRoom} bookings={bookings} onClose={() => setActiveModal({ type: null })} onSubmit={(b) => { handleConfirmBooking(b); setActiveModal({ type: null }); }} /> : null;
                case 'INVOICE': return currentBooking ? <InvoiceModal booking={currentBooking} rooms={rooms} onClose={() => setActiveModal({ type: null })} onToggleLock={onToggleLock} onUpdatePaymentStatus={handleUpdatePaymentStatus} settings={settings} /> : null;
                case 'PARTIAL_PAYMENT': return currentBooking ? <PartialPaymentModal booking={currentBooking} onClose={() => setActiveModal({ type: null })} onSubmit={async (amt, note) => { await addPayment(currentBooking.id, amt / 100, note); setActiveModal({ type: null }); }} /> : null;
                case 'CHARGE': return currentBooking ? <ChargeModal booking={currentBooking} onClose={() => setActiveModal({ type: null })} onSubmit={async (amt, note) => { await addCharge(currentBooking.id, amt / 100, note); setActiveModal({ type: 'INVOICE', dataId: currentBooking.id }); }} /> : null;
                case 'CORRECTION': return currentBooking ? <CorrectionModal booking={currentBooking} onClose={() => setActiveModal({ type: null })} onSubmit={async (amt, reason) => { await addAdjustment(currentBooking.id, amt / 100, reason); setActiveModal({ type: 'INVOICE', dataId: currentBooking.id }); }} /> : null;
                case 'AUDIT': return currentBooking ? <AuditBreakdownModal booking={currentBooking} onClose={() => setActiveModal({ type: null })} /> : null;
                case 'CALENDAR': return currentRoom ? (
                  <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl space-y-6 max-w-xl mx-auto">
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-black text-slate-900 serif">{currentRoom.name}</h3>
                      <button onClick={() => setActiveModal({ type: null })} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                        <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <Calendar roomId={currentRoom.id} existingBookings={bookings.filter(b => b.room_id === currentRoom.id)} onRangeSelect={() => {}} selectedStart="" selectedEnd="" />
                  </div>
                ) : null;
                default: return null;
              }
            })()}
          </div>
        </div>
      )}

      <AIChat bookings={bookings} rooms={propertyRooms} settings={settings} />
    </div>
  );
};

export default App;
